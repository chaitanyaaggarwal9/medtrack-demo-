/** Shared Tailwind class names for links, buttons and focus rings. */
export const focusRing =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700';

export const linkClass = `font-semibold text-teal-800 underline underline-offset-4 hover:text-teal-900 ${focusRing}`;

export const primaryButton = `rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const secondaryButton = `rounded-lg border border-slate-500 bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100 ${focusRing}`;
