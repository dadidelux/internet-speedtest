import SpeedTestForm from "@/components/SpeedTestForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import MapView from "@/components/MapView";
import CoverageEstimates from "@/components/CoverageEstimates";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Bagbag Internet Speed Test
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Community-powered internet quality data for Barangay Bagbag, Quezon
            City. See if you&apos;re getting the Mbps you pay for.
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Form + Results */}
        <div className="lg:w-1/2 flex flex-col p-6 space-y-8 overflow-y-auto">
          {/* Submit Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">Submit Your Speed Test</h2>
            <p className="mb-4 text-sm text-gray-500">
              Run a speed test, then report your ISP, plan, and actual results
              below. We compare promised vs. actual speeds across the barangay.
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950">
              <SpeedTestForm />
            </div>
          </section>

          {/* Results Section */}
          <section>
            <ResultsDashboard />
          </section>

          {/* Coverage Estimates */}
          <section>
            <CoverageEstimates />
          </section>
        </div>

        {/* Right: Map (full height) */}
        <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-screen">
          <MapView tests={[]} fullHeight />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-black">
        Barangay Bagbag Internet Speed Monitoring Project
      </footer>
    </div>
  );
}
