"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapView = dynamic(() => import("./MapView").catch(() => ({ default: () => null })), { ssr: false });

interface SpeedTest {
  id: string;
  isp: string;
  plan_type: string;
  promised_mbps: number;
  download_mbps: number;
  upload_mbps: number;
  ping_ms: number | null;
  street: string | null;
  purok: string | null;
  barangay: string;
  created_at: string;
}

interface ISPStats {
  isp: string;
  count: number;
  avgPromised: number;
  avgDownload: number;
  avgUpload: number;
  avgPing: number | null;
  avgRatio: number;
}

export default function ResultsDashboard() {
  const [tests, setTests] = useState<SpeedTest[]>([]);
  const [stats, setStats] = useState<ISPStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ispFilter, setIspsFilter] = useState("all");

  function computeStats(data: SpeedTest[]) {
    const grouped: Record<string, SpeedTest[]> = {};
    for (const t of data) {
      if (!grouped[t.isp]) grouped[t.isp] = [];
      grouped[t.isp].push(t);
    }

    const result: ISPStats[] = Object.entries(grouped).map(([isp, items]) => {
      const avgPromised =
        items.reduce((s, i) => s + i.promised_mbps, 0) / items.length;
      const avgDownload =
        items.reduce((s, i) => s + i.download_mbps, 0) / items.length;
      const avgUpload =
        items.reduce((s, i) => s + i.upload_mbps, 0) / items.length;
      const withPing = items.filter((i) => i.ping_ms != null);
      const avgPing = withPing.length
        ? withPing.reduce((s, i) => s + (i.ping_ms ?? 0), 0) / withPing.length
        : null;
      const avgRatio = avgPromised > 0 ? (avgDownload / avgPromised) * 100 : 0;

      return {
        isp,
        count: items.length,
        avgPromised,
        avgDownload,
        avgUpload,
        avgPing,
        avgRatio,
      };
    });

    result.sort((a, b) => b.count - a.count);
    setStats(result);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const { data, error } = await supabase
          .from("public_speed_tests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200)
          .abortSignal(controller.signal);

        clearTimeout(timeout);

        if (cancelled) return;

        if (error) {
          setLoadError(error.message);
        } else if (data) {
          setTests(data as SpeedTest[]);
          computeStats(data as SpeedTest[]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.name === "AbortError"
              ? "Request timed out — check your connection"
              : e?.message || "Failed to load results"
          );
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered =
    ispFilter === "all"
      ? stats
      : stats.filter((s) => s.isp === ispFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          Failed to load results
        </p>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Results by ISP ({filtered.length} providers)
        </h2>
        <select
          value={ispFilter}
          onChange={(e) => setIspsFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="all">All ISPs</option>
          {stats.map((s) => (
            <option key={s.isp} value={s.isp}>
              {s.isp} ({s.count})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No results yet. Be the first to submit!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">ISP</th>
                    <th className="pb-2 font-medium text-right">Samples</th>
                    <th className="pb-2 font-medium text-right">Promised</th>
                    <th className="pb-2 font-medium text-right">Actual DL</th>
                    <th className="pb-2 font-medium text-right">Ratio</th>
                    <th className="pb-2 font-medium text-right">Avg UL</th>
                    <th className="pb-2 font-medium text-right">Avg Ping</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.isp}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2.5 font-medium">{s.isp}</td>
                      <td className="py-2.5 text-right text-gray-500">
                        {s.count}
                      </td>
                      <td className="py-2.5 text-right">
                        {s.avgPromised.toFixed(0)} Mbps
                      </td>
                      <td className="py-2.5 text-right">
                        {s.avgDownload.toFixed(1)} Mbps
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={
                            s.avgRatio >= 80
                              ? "text-green-600"
                              : s.avgRatio >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                          }
                        >
                          {s.avgRatio.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {s.avgUpload.toFixed(1)} Mbps
                      </td>
                      <td className="py-2.5 text-right text-gray-500">
                        {s.avgPing != null ? `${s.avgPing.toFixed(0)} ms` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {tests.length > 0 && (
          <div className="lg:w-[45%] shrink-0">
            <MapView tests={tests} />
          </div>
        )}
      </div>

      {tests.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-500">
            Recent Submissions
          </h3>
          <div className="space-y-2">
            {tests.slice(0, 20).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-gray-100 px-4 py-2.5 text-sm dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{t.isp}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    {t.purok || t.barangay}
                  </span>
                  {t.promised_mbps > 0 && (
                    <span className="text-xs text-gray-400">
                      promised {t.promised_mbps} Mbps
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span>
                    ↓ {t.download_mbps} Mbps
                  </span>
                  <span>
                    ↑ {t.upload_mbps} Mbps
                  </span>
                  {t.ping_ms != null && <span>{t.ping_ms} ms</span>}
                  <span className="text-xs">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
