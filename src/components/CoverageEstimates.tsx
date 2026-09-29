"use client";

const PASIG_ESTIMATES = [
  { isp: "Globe", download: 200.6, upload: 165.9, ping: 23 },
  { isp: "Converge", download: 135.2, upload: 129.6, ping: 21 },
  { isp: "PLDT", download: 125.1, upload: 126.9, ping: 20 },
  { isp: "Smart Axiata", download: 60.2, upload: 10.6, ping: 37 },
  { isp: "Dito", download: 51.2, upload: 7.1, ping: 34 },
  { isp: "Dito Telecommunity", download: 27.9, upload: 3.7, ping: 51 },
];

const PASIG_AVERAGE = { download: 133.2, upload: 119.8, ping: 25 };

export default function CoverageEstimates() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Coverage Area Estimates
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Reference broadband speeds for Pasig, Philippines (Jul 2025 – Jun 2026).
          Source:{" "}
          <a
            href="https://www.speedgeo.net/statistics/philippines/pasig"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            SpeedGeo.net
          </a>
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pasig Average
          </span>
          <span className="text-xs text-gray-400">
            All ISPs — external reference, not Bagbag measurement
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {PASIG_AVERAGE.download}
            </div>
            <div className="text-xs text-gray-500">Mbps Download</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {PASIG_AVERAGE.upload}
            </div>
            <div className="text-xs text-gray-500">Mbps Upload</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {PASIG_AVERAGE.ping}
            </div>
            <div className="text-xs text-gray-500">ms Ping</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">ISP</th>
              <th className="pb-2 font-medium text-right">Download</th>
              <th className="pb-2 font-medium text-right">Upload</th>
              <th className="pb-2 font-medium text-right">Ping</th>
            </tr>
          </thead>
          <tbody>
            {PASIG_ESTIMATES.map((row) => (
              <tr
                key={row.isp}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2.5 font-medium">
                  {row.isp}
                  <span className="block text-xs text-gray-400">
                    source: SpeedGeo.net (Pasig, Jul2025-Jun2026) — external reference, not Bagbag measurement
                  </span>
                </td>
                <td className="py-2.5 text-right">{row.download} Mbps</td>
                <td className="py-2.5 text-right">{row.upload} Mbps</td>
                <td className="py-2.5 text-right text-gray-500">{row.ping} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
