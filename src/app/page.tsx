import SpeedTestForm from "@/components/SpeedTestForm";
import ResultsDashboard from "@/components/ResultsDashboard";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Bagbag Internet Speed Test
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Community-powered internet quality data for Barangay Bagbag, Quezon
            City. See if you&apos;re getting the Mbps you pay for.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 space-y-10">
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
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-black">
        Barangay Bagbag Internet Speed Monitoring Project
      </footer>
    </div>
  );
}
