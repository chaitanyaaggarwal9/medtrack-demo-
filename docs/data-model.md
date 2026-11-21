# MedTrack Demo: data model (MVP)

> Status: proposal, 21 Nov 2026. No code or migrations yet (Week 5).
> Based on [docs/brief.md](brief.md). Demo data: [docs/demo-data.json](demo-data.json).

## Overview

```
users 1 ──< medicines 1 ──< dose_logs
  └────────────────────────────┘ (user_id on every table)
```

One user has many medicines; one medicine has many dose logs (one per ticked dose).

## 1. `users`

| Column     | Type                       | Required | Key / index      |
| ---------- | -------------------------- | -------- | ---------------- |
| id         | uuid (random)              | yes      | **Primary key**  |
| google_sub | text                       | yes      | **Unique index** |
| email      | text                       | yes      |                  |
| created_at | timestamptz, default now() | yes      |                  |
| updated_at | timestamptz, default now() | yes      |                  |

- **id is a random uuid**: nobody can guess another user's id by counting.
- **google_sub** is Google's permanent id for the person (emails can change), used to find the user at sign-in.
- **Unique index on google_sub**: one Google account = one user, and fast sign-in lookups.
- **email** is only to show "Signed in as …"; never in logs or analytics. Optional: could be dropped to collect less.
- **No name, birthday or address**: the app does not need them, so we do not collect them.
- **No sessions table**: the session is a signed cookie, so the server stores nothing.

## 2. `medicines`

| Column     | Type                       | Required | Key / index                                               |
| ---------- | -------------------------- | -------- | --------------------------------------------------------- |
| id         | uuid (random)              | yes      | **Primary key**                                           |
| user_id    | uuid                       | yes      | **Foreign key → users.id** (on delete cascade), **index** |
| name       | text (max 100)             | yes      |                                                           |
| dose_text  | text (max 100)             | yes      |                                                           |
| times      | time[] (1-6 times)         | yes      |                                                           |
| created_at | timestamptz, default now() | yes      |                                                           |
| updated_at | timestamptz, default now() | yes      |                                                           |
|            |                            |          | **Unique (id, user_id)**                                  |

- **user_id**: who owns the row; every query filters `WHERE user_id = <signed-in user>`.
- **On delete cascade**: deleting a user deletes their medicines ("Delete my account and data").
- **Index on user_id**: "show my medicines" stays fast.
- **dose_text is free text** exactly as typed (e.g. "1 tablet"); the app never calculates or checks a dose.
- **Max lengths**: stop huge text; Zod checks the same limits before the database.
- **times is a list in the row** (e.g. `[08:00, 20:00]`): simpler than a separate table for 1-6 times a day.
- **Unique (id, user_id)**: lets `dose_logs` check that a medicine belongs to the same user.

## 3. `dose_logs` (one row = one dose ticked as taken)

| Column         | Type                       | Required | Key / index                                                                          |
| -------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| id             | uuid (random)              | yes      | **Primary key**                                                                      |
| user_id        | uuid                       | yes      | **Foreign key → users.id** (on delete cascade)                                       |
| medicine_id    | uuid                       | yes      | **Foreign key (medicine_id, user_id) → medicines (id, user_id)** (on delete cascade) |
| dose_date      | date                       | yes      |                                                                                      |
| scheduled_time | time                       | yes      |                                                                                      |
| taken_at       | timestamptz                | yes      |                                                                                      |
| created_at     | timestamptz, default now() | yes      |                                                                                      |
| updated_at     | timestamptz, default now() | yes      |                                                                                      |
|                |                            |          | **Unique (medicine_id, dose_date, scheduled_time)**                                  |
|                |                            |          | **Index (user_id, dose_date)**                                                       |

- **A row only when ticked**: an unticked dose has no row.
- **Undo deletes the row**: no "taken = false" state to get wrong.
- **Two-column foreign key**: a user cannot log a dose against someone else's medicine, even by guessing its id.
- **dose_date is the user's own calendar day**: "today" resets at their midnight.
- **scheduled_time**: which dose was ticked (08:00 vs 20:00).
- **taken_at**: the exact moment of the tick, shown on the checklist to help catch a wrong tick.
- **Unique (medicine_id, dose_date, scheduled_time)**: the database itself blocks ticking the same dose twice in one day.
- **Index (user_id, dose_date)**: fast "my ticks today" and "my last 7 days" (weekly view).
- **updated_at**: kept for consistency; logs are only added or deleted, so it normally equals created_at.

## Known MVP choices

1. **Deleting a medicine deletes its old ticks**, so the weekly view "forgets" it. Simplest. Alternative later: an `archived_at` column to hide instead of delete.
2. **Weekly "planned" doses use the current times.** If times change mid-week, earlier days use the new times. Fine for an MVP; a full history would need another table.

## Rules check

- Every user-owned table has `user_id`: `medicines`, `dose_logs`.
- Fake data only: made-up medicine names; only the Google id and email are needed to sign in.
- No medical advice: no column calculates, suggests or judges a dose.
