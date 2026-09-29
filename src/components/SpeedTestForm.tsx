"use client";

import { useState, useEffect, FormEvent } from "react";

const ISPS = [
  "Globe",
  "PLDT",
  "Smart",
  "DITO",
  "Converge",
  "Sky",
  "Bayan",
  "Other",
] as const;

const PLAN_TYPES = [
  "Fiber",
  "DSL",
  "Prepaid WiFi",
  "Mobile Data",
  "Cable",
  "Other",
] as const;

const PUROK_OPTIONS = [
  "Kingspoint Subdivision",
  "California Village",
  "Goodwill Homes 2",
] as const;

const ISP_PLANS: Record<string, { name: string; speed: number }[]> = {
  Globe: [
    { name: "GFiber Unli 1699 — 200 Mbps", speed: 200 },
    { name: "GFiber Unli 2499 — 500 Mbps", speed: 500 },
    { name: "GFiber Unli 3499 — 800 Mbps", speed: 800 },
    { name: "GFiber Unli 4999 — 1 Gbps", speed: 1000 },
    { name: "GFiber Prepaid 50 Mbps", speed: 50 },
    { name: "GFiber Prepaid 100 Mbps", speed: 100 },
    { name: "Home Prepaid WiFi — 10 Mbps", speed: 10 },
    { name: "Home Prepaid WiFi — 15 Mbps", speed: 15 },
    { name: "Home Prepaid WiFi — 20 Mbps", speed: 20 },
    { name: "Home Prepaid WiFi — 50 Mbps", speed: 50 },
  ],
  PLDT: [
    { name: "Home Fibr 1299 — 50 Mbps", speed: 50 },
    { name: "Home Fibr 1699 — 100 Mbps", speed: 100 },
    { name: "Home Fibr 2099 — 200 Mbps", speed: 200 },
    { name: "Home Fibr 2699 — 400 Mbps", speed: 400 },
    { name: "Home Fibr 3899 — 600 Mbps", speed: 600 },
    { name: "Home Fibr 6499 — 1 Gbps", speed: 1000 },
    { name: "Home Ultera 999 — 25 Mbps", speed: 25 },
    { name: "Home Ultera 1299 — 50 Mbps", speed: 50 },
  ],
  Smart: [
    { name: "Bro Turbo 599 — 10 Mbps", speed: 10 },
    { name: "Bro Turbo 899 — 20 Mbps", speed: 20 },
    { name: "Bro Turbo 1299 — 50 Mbps", speed: 50 },
    { name: "Bro Turbo 1599 — 100 Mbps", speed: 100 },
    { name: "Bro Turbo 1999 — 200 Mbps", speed: 200 },
  ],
  DITO: [
    { name: "DITO Home 5G 599 — 20 Mbps", speed: 20 },
    { name: "DITO Home 5G 899 — 50 Mbps", speed: 50 },
    { name: "DITO Home 5G 1299 — 100 Mbps", speed: 100 },
    { name: "DITO Home 5G 1699 — 200 Mbps", speed: 200 },
  ],
  Converge: [
    { name: "FiberX 1500 — 200 Mbps", speed: 200 },
    { name: "FiberX 2500 — 400 Mbps", speed: 400 },
    { name: "FiberX 3500 — 600 Mbps", speed: 600 },
    { name: "FiberX 4500 — 800 Mbps", speed: 800 },
    { name: "FiberX 6000 — 1 Gbps", speed: 1000 },
    { name: "FiberX Basic 1200 — 35 Mbps", speed: 35 },
  ],
  Sky: [
    { name: "Sky Fiber 899 — 20 Mbps", speed: 20 },
    { name: "Sky Fiber 1299 — 40 Mbps", speed: 40 },
    { name: "Sky Fiber 1699 — 80 Mbps", speed: 80 },
    { name: "Sky Fiber 2499 — 200 Mbps", speed: 200 },
  ],
  Bayan: [
    { name: "Bayan Fiber 999 — 25 Mbps", speed: 25 },
    { name: "Bayan Fiber 1299 — 50 Mbps", speed: 50 },
    { name: "Bayan Fiber 1699 — 100 Mbps", speed: 100 },
  ],
};

interface FormData {
  isp: string;
  planType: string;
  planName: string;
  currentPlanMbps: string;
  downloadMbps: string;
  uploadMbps: string;
  pingMs: string;
  street: string;
  purok: string;
}

interface GeoState {
  status: "idle" | "loading" | "done" | "error" | "denied";
  latitude: number | null;
  longitude: number | null;
  street: string;
  purok: string;
  message: string;
}

const GEO_UNSUPPORTED: GeoState = {
  status: "error",
  latitude: null,
  longitude: null,
  street: "",
  purok: "",
  message: "Geolocation not supported",
};

function generateDeviceFingerprint(): string {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (!nav) return "";
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return "fp_" + Math.abs(hash).toString(36);
}

export default function SpeedTestForm() {
  const [form, setForm] = useState<FormData>({
    isp: "",
    planType: "",
    planName: "",
    currentPlanMbps: "",
    downloadMbps: "",
    uploadMbps: "",
    pingMs: "",
    street: "",
    purok: "",
  });

  const geoSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const [geo, setGeo] = useState<GeoState>(
    geoSupported
      ? {
          status: "idle",
          latitude: null,
          longitude: null,
          street: "",
          purok: "",
          message: "",
        }
      : GEO_UNSUPPORTED
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!geoSupported) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeo((g) => ({
          ...g,
          status: "loading",
          latitude,
          longitude,
          message: "Resolving address...",
        }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "User-Agent": "BagbagSpeedTest/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const street =
            addr.road || addr.pedestrian || addr.neighbourhood || "";
          const purok =
            addr.suburb || addr.quarter || addr.village || "";
          setGeo((g) => ({
            ...g,
            status: "done",
            street,
            purok,
            message: "Location captured",
          }));
          setForm((f) => ({
            ...f,
            street: f.street || street,
            purok: f.purok || purok,
          }));
        } catch {
          setGeo((g) => ({
            ...g,
            status: "error",
            message: "Could not resolve address",
          }));
        }
      },
      () => {
        setGeo((g) => ({
          ...g,
          status: "denied",
          message: "Location access denied — enter manually",
        }));
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [geoSupported]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.isp) errs.isp = "Select your ISP";
    if (!form.planType) errs.planType = "Select plan type";
    if (
      !form.currentPlanMbps ||
      isNaN(Number(form.currentPlanMbps)) ||
      Number(form.currentPlanMbps) < 0
    ) {
      errs.currentPlanMbps = "Enter current plan speed (Mbps)";
    }
    if (
      !form.downloadMbps ||
      isNaN(Number(form.downloadMbps)) ||
      Number(form.downloadMbps) < 0
    ) {
      errs.downloadMbps = "Enter download speed";
    }
    if (
      !form.uploadMbps ||
      isNaN(Number(form.uploadMbps)) ||
      Number(form.uploadMbps) < 0
    ) {
      errs.uploadMbps = "Enter upload speed";
    }
    if (form.pingMs && (isNaN(Number(form.pingMs)) || Number(form.pingMs) < 0)) {
      errs.pingMs = "Enter a valid ping";
    }
    if (!form.purok) errs.purok = "Select your area";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    setSuccess(false);

    const fingerprint = generateDeviceFingerprint();

    const payload = {
      isp: form.isp,
      plan_type: form.planType,
      promised_mbps: Number(form.currentPlanMbps),
      download_mbps: Number(form.downloadMbps),
      upload_mbps: Number(form.uploadMbps),
      ping_ms: form.pingMs ? Number(form.pingMs) : null,
      street: form.street || null,
      purok: form.purok || null,
      barangay: "Bagbag",
      latitude: geo.latitude,
      longitude: geo.longitude,
      device_fingerprint: fingerprint || null,
      ip_hash: null,
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Submission failed");
        return;
      }

      setSuccess(true);
      setForm({
        isp: "",
        planType: "",
        planName: "",
        currentPlanMbps: "",
        downloadMbps: "",
        uploadMbps: "",
        pingMs: "",
        street: geo.street,
        purok: geo.purok,
      });
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950">
        <p className="text-lg font-semibold text-green-800 dark:text-green-200">
          Speed test submitted!
        </p>
        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
          Your contribution helps map internet quality in Barangay Bagbag.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </div>
      )}

      {/* ISP */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Internet Service Provider
        </label>
        <select
          value={form.isp}
          onChange={(e) => setForm({ ...form, isp: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Select ISP...</option>
          {ISPS.map((isp) => (
            <option key={isp} value={isp}>
              {isp}
            </option>
          ))}
        </select>
        {errors.isp && (
          <p className="mt-1 text-xs text-red-600">{errors.isp}</p>
        )}
      </div>

      {/* Plan Type + Current Plan Speed */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Plan Type</label>
          <select
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Select...</option>
            {PLAN_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
          {errors.planType && (
            <p className="mt-1 text-xs text-red-600">{errors.planType}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Current Plan Speed (Mbps)
          </label>
          {form.isp && ISP_PLANS[form.isp] ? (
            <select
              value={form.planName}
              onChange={(e) => {
                const plan = ISP_PLANS[form.isp]?.find((p) => p.name === e.target.value);
                setForm({
                  ...form,
                  planName: e.target.value,
                  currentPlanMbps: plan ? String(plan.speed) : "",
                });
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">Select plan...</option>
              {ISP_PLANS[form.isp].map((plan) => (
                <option key={plan.name} value={plan.name}>
                  {plan.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 200"
              value={form.currentPlanMbps}
              onChange={(e) =>
                setForm({ ...form, currentPlanMbps: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          )}
          {errors.currentPlanMbps && (
            <p className="mt-1 text-xs text-red-600">{errors.currentPlanMbps}</p>
          )}
        </div>
      </div>

      {/* Speed Test */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <p className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
          Run a speed test first
        </p>
        <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">
          Open fast.com or speedtest.net, run the test, then enter results below.
        </p>
        <div className="flex gap-2">
          <a
            href="https://fast.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Open fast.com
          </a>
          <a
            href="https://speedtest.net"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Open speedtest.net
          </a>
        </div>
      </div>

      {/* Actual Speeds */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Download (Mbps)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 25.5"
            value={form.downloadMbps}
            onChange={(e) =>
              setForm({ ...form, downloadMbps: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          {errors.downloadMbps && (
            <p className="mt-1 text-xs text-red-600">{errors.downloadMbps}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Upload (Mbps)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 10.2"
            value={form.uploadMbps}
            onChange={(e) =>
              setForm({ ...form, uploadMbps: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          {errors.uploadMbps && (
            <p className="mt-1 text-xs text-red-600">{errors.uploadMbps}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Ping (ms){" "}
            <span className="text-gray-400 font-normal">optional</span>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="e.g. 15"
            value={form.pingMs}
            onChange={(e) => setForm({ ...form, pingMs: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          {errors.pingMs && (
            <p className="mt-1 text-xs text-red-600">{errors.pingMs}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium">Location</label>
          {geo.status === "loading" && (
            <span className="text-xs text-blue-600">Detecting...</span>
          )}
          {geo.status === "done" && (
            <span className="text-xs text-green-600">{geo.message}</span>
          )}
          {(geo.status === "denied" || geo.status === "error") && (
            <span className="text-xs text-amber-600">{geo.message}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Street</label>
            <input
              type="text"
              placeholder="e.g. Bagbag Rd"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Purok / Subdivision</label>
            <select
              value={form.purok}
              onChange={(e) => setForm({ ...form, purok: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">Select area...</option>
              {PUROK_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {errors.purok && (
              <p className="mt-1 text-xs text-red-600">{errors.purok}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Speed Test"}
      </button>
    </form>
  );
}
