# GearCheck

An offline-first Android app for photography and videography studios to inventory gear, pack for events, and verify returns.

## Run & Operate

- `pnpm --filter @workspace/gearcheck run dev` — start the Expo mobile app
- `pnpm --filter @workspace/gearcheck run typecheck` — typecheck GearCheck
- `pnpm run typecheck` — typecheck all workspace packages
- Scan the Expo QR code with Expo Go to preview on a phone.
- GearCheck does not require the API server, a database, an account, or an internet connection for normal use.

## Stack

- pnpm workspace, Expo SDK 57, React Native, TypeScript
- Expo Router for stack and bottom-tab navigation
- AsyncStorage for on-device persistence
- Expo Notifications for optional local event reminders
- Reanimated and Expo Haptics for checklist feedback

## Where things live

- `artifacts/gearcheck/app/` — app routes and tab screens
- `artifacts/gearcheck/context/GearCheckContext.tsx` — local data, persistence, and event actions
- `artifacts/gearcheck/components/` — shared controls and packing/return checklist
- `artifacts/gearcheck/constants/colors.ts` — light and dark theme tokens
- `artifacts/gearcheck/app.json` — app identity, Android package, icon, and native plugins

## Architecture decisions

- Keep inventory, events, templates, and preferences on-device so event checklists work offline.
- Copy item names and categories into each event selection so later inventory edits do not rewrite event history.
- Gear selection and checklists track quantities as unit counts, not only item-level booleans.

## Product

GearCheck helps photo and video crews avoid forgotten or missing equipment at off-site events. Users maintain a categorized inventory, create event-specific packing lists, check gear back in, save reusable templates, export JSON backups, and review completed event history.

## User preferences

- Minimal, professional English interface with system, light, and dark appearance modes.
- Android is the target platform; the requested app ID is `com.studio.gearcheck`.

## Gotchas

- Keep the Expo config in static `app.json`; dynamic app config files break the managed mobile build flow.
- Treat the Android package identifier as fixed after initial setup.
- No API or database migration is needed for GearCheck changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
