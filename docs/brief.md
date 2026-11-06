# MedTrack Demo: project brief

**App name:** MedTrack Demo

## The problem

Adults who take several medicines a day often cannot remember whether they already took a dose, especially on busy days. A paper list gets lost, and a phone alarm does not show what is still to take. This can lead to missed or doubled doses.

## Who it is for

An adult who takes 3-5 medicines a day, for example a grandparent with tablets in the morning and evening, sometimes helped by a family member.

## Main features (must-have only)

1. Add, edit and delete a medicine: name, dose and time(s), typed exactly as on the label or prescription.
2. Today's checklist: tick each dose when taken; see what is still to take, in time order.
3. Overdue note: a gentle message on the page when a dose time has passed and it is not ticked.
4. Weekly view: a simple chart of doses taken vs planned for the last 7 days.
5. Sign in with Google, so each person sees only their own list.

## Not included (out of scope)

- Calculating or suggesting doses
- Diagnosis, symptom checking or medical advice
- Phone, SMS or email notifications
- Sharing with doctors or pharmacies
- Real patient data
- Children's health data
- An app-store mobile app

## Data the app will store (all fake/demo data)

- **users:** Google ID, email
- **medicines:** name, dose text, times
- **dose_logs:** which medicine, date, time ticked

During the course every medicine and dose is made up.

## Health, privacy or safety risks and how I will handle them

- **Could look like medical advice** → the app only shows what the user typed, never suggests a dose, and every page shows: "For education only. Not medical advice. In an emergency, call your local emergency number."
- **Health data is private** → fake data only; every API route returns only the signed-in user's rows; analytics never include medicine names or doses.
- **A wrong tick could cause a missed or double dose** → "Undo" on every tick, and the time of each tick is shown.

## How I will know it works (success measure)

- A new user can sign in, add 3 medicines and tick today's doses in under 2 minutes.
- The weekly view matches the ticks.
- An automated test proves user B cannot see user A's medicines.
