import type { ReactNode } from 'react';
import { Link } from 'react-router';
import Disclaimer from './Disclaimer.tsx';
import { focusRing } from './styles.ts';

/** Header (home link), main area and the disclaimer footer for app pages. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className={`font-semibold text-teal-800 underline-offset-4 hover:underline ${focusRing}`}
        >
          MedTrack Demo
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <Disclaimer />
    </div>
  );
}
