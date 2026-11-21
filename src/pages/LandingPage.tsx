import { Link } from 'react-router';
import Disclaimer from '../components/Disclaimer.tsx';

const APP_NAME = 'MedTrack Demo';

const features = [
  {
    title: "Today's checklist",
    text: 'Tick each dose when you take it and see what is still to take, in time order.',
  },
  {
    title: 'Gentle overdue note',
    text: 'A calm message on the page when a dose time has passed and it is not ticked yet.',
  },
  {
    title: 'Weekly view',
    text: 'A simple chart of doses taken compared with doses planned over the last 7 days.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-700">
            Helps adults who take several medicines a day tick off each dose and
            see at a glance what is still to take.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-block rounded-lg bg-teal-700 px-6 py-3 text-lg font-semibold text-white hover:bg-teal-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Get started
          </Link>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mx-auto max-w-5xl px-4 pb-16 sm:px-6"
        >
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-slate-700">{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Disclaimer />
    </div>
  );
}
