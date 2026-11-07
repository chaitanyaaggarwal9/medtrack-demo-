import { Link } from 'react-router';
import Disclaimer from '../components/Disclaimer.tsx';

/** Placeholder until adding medicines is built (separate issue). */
export default function AddMedicinePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Add a medicine</h1>
        <p className="mt-2 text-lg text-slate-700">
          Adding medicines is not available yet.
        </p>
        <p className="mt-6">
          <Link
            to="/app"
            className="font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Back to today&apos;s checklist
          </Link>
        </p>
      </main>
      <Disclaimer />
    </div>
  );
}
