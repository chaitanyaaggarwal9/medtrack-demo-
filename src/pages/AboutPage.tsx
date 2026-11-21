import { Link } from 'react-router';
import Disclaimer from '../components/Disclaimer.tsx';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About MedTrack Demo
        </h1>

        <section aria-labelledby="what-heading" className="mt-8">
          <h2 id="what-heading" className="text-xl font-semibold">
            What the app is
          </h2>
          <p className="mt-2 text-slate-700">
            MedTrack Demo helps adults who take several medicines a day tick off
            each dose and see at a glance what is still to take. It only shows
            what you typed in. It never suggests or calculates a dose.
          </p>
        </section>

        <section aria-labelledby="learning-heading" className="mt-8">
          <h2 id="learning-heading" className="text-xl font-semibold">
            A learning project
          </h2>
          <p className="mt-2 text-slate-700">
            This app was built by a student while learning to make web apps. It
            is not a medical device and has not been checked by doctors.
          </p>
        </section>

        <section aria-labelledby="data-heading" className="mt-8">
          <h2 id="data-heading" className="text-xl font-semibold">
            All data is fake
          </h2>
          <p className="mt-2 text-slate-700">
            Every medicine and dose you see is made up. Please do not enter real
            personal or health information.
          </p>
        </section>

        <section aria-labelledby="disclaimer-heading" className="mt-8">
          <h2 id="disclaimer-heading" className="text-xl font-semibold">
            Disclaimer
          </h2>
          <p className="mt-2 text-slate-700">
            MedTrack Demo does not diagnose, give medical advice or tell you
            what to take. Always follow your doctor or pharmacist. In an
            emergency, call your local emergency number.
          </p>
        </section>

        <Link
          to="/"
          className="mt-10 inline-block font-semibold text-teal-800 underline hover:text-teal-900 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Back to home
        </Link>
      </main>

      <Disclaimer />
    </div>
  );
}
