"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

interface SpeedTest {
  id: string;
  isp: string;
  purok: string | null;
  download_mbps: number;
  promised_mbps: number;
  created_at: string;
}

interface PurokBubble {
  purok: string;
  lat: number;
  lng: number;
  count: number;
  avgRatio: number;
  color: string;
}

const PUROK_CENTROIDS: Record<string, [number, number]> = {
  "Kingspoint Subdivision": [14.7025, 121.0515],
  "California Village": [14.7000, 121.0480],
  "Goodwill Homes 2": [14.7040, 121.0540],
  "Goodwill Homes": [14.7035, 121.0530],
  "Holy Cross": [14.7050, 121.0500],
  "Bagbag General": [14.7020, 121.0510],
};

const BAGBAG_CENTER: [number, number] = [14.7020, 121.0510];
const DEFAULT_ZOOM = 15;

function ratioColor(ratio: number): string {
  if (ratio >= 80) return "#16a34a";
  if (ratio >= 50) return "#d97706";
  return "#dc2626";
}

function bubbleRadius(count: number): number {
  return Math.max(8, Math.min(30, 8 + Math.sqrt(count) * 4));
}

function resolvePurokCoords(
  purok: string | null
): [number, number] | null {
  if (!purok) return null;
  const normalized = purok.trim();
  if (PUROK_CENTROIDS[normalized]) return PUROK_CENTROIDS[normalized];
  for (const [key, coords] of Object.entries(PUROK_CENTROIDS)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) return coords;
  }
  const jitterLat = BAGBAG_CENTER[0] + (Math.random() - 0.5) * 0.003;
  const jitterLng = BAGBAG_CENTER[1] + (Math.random() - 0.5) * 0.003;
  return [jitterLat, jitterLng];
}

function buildBubbles(tests: SpeedTest[]): PurokBubble[] {
  const grouped: Record<string, SpeedTest[]> = {};
  for (const t of tests) {
    const key = t.purok || "__unassigned__";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  return Object.entries(grouped)
    .map(([purok, items]) => {
      const realPurok = purok === "__unassigned__" ? "Unassigned" : purok;
      const coords = resolvePurokCoords(realPurok);
      if (!coords) return null;

      const withPromised = items.filter((i) => i.promised_mbps > 0);
      const avgRatio =
        withPromised.length > 0
          ? withPromised.reduce(
              (sum, i) => sum + (i.download_mbps / i.promised_mbps) * 100,
              0
            ) / withPromised.length
          : 0;

      return {
        purok: realPurok,
        lat: coords[0],
        lng: coords[1],
        count: items.length,
        avgRatio,
        color: ratioColor(avgRatio),
      };
    })
    .filter((b): b is PurokBubble => b !== null);
}

interface MapViewProps {
  tests: SpeedTest[];
}

export default function MapView({ tests }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const [leaflet, setLeaflet] = useState<typeof L | null>(null);

  useEffect(() => {
    Promise.all([
      import("leaflet"),
      import("leaflet.markercluster"),
    ]).then(([LMod]) => {
      setLeaflet(LMod.default);
    });
  }, []);

  useEffect(() => {
    if (!leaflet || !mapRef.current || mapInstanceRef.current) return;

    const map = leaflet.map(mapRef.current, {
      center: BAGBAG_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers = (leaflet as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    map.addLayer(markers);
    mapInstanceRef.current = map;
    markersRef.current = markers;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leaflet]);

  useEffect(() => {
    if (!markersRef.current || !leaflet) return;
    markersRef.current.clearLayers();

    const bubbles = buildBubbles(tests);

    for (const bubble of bubbles) {
      const marker = leaflet.circleMarker([bubble.lat, bubble.lng], {
        radius: bubbleRadius(bubble.count),
        color: bubble.color,
        fillColor: bubble.color,
        fillOpacity: 0.7,
        weight: 2,
      });

      const popupHtml = `
        <div style="font-family:system-ui;min-width:140px">
          <div style="font-weight:600;margin-bottom:4px">${bubble.purok}</div>
          <div style="font-size:13px;color:#555">
            <div>Submissions: <strong>${bubble.count}</strong></div>
            <div>Avg ratio: <strong style="color:${bubble.color}">${bubble.avgRatio.toFixed(0)}%</strong></div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      const tooltipEl = document.createElement("span");
      tooltipEl.textContent = `${bubble.purok} (${bubble.count})`;
      marker.bindTooltip(tooltipEl, { direction: "top" });

      markersRef.current!.addLayer(marker);
    }
  }, [tests, leaflet]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500">
          Submissions Map
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
            ≥80%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-600" />
            ≥50%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
            &lt;50%
          </span>
          <span className="text-gray-300">|</span>
          <span>Bubble size = submission count</span>
        </div>
      </div>
      <div
        ref={mapRef}
        className="h-[400px] w-full rounded-lg border border-gray-200 dark:border-gray-800"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
