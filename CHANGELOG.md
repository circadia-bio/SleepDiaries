# Changelog

All notable changes to Sleep Diaries will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.1.0-beta.1] — 2026-04-22

### Added

- **Final report — share card**: shareable image card showing all sleep metrics in a 2×4 grid with threshold-coloured stat chips; works on native (via `react-native-view-shot` + `expo-sharing`) and web PWA
- **Final report — thresholds**: metric chips now colour-coded against clinical reference values
- **Export screen**: modernised with glassy cards and a shadow header
- **Medication dose stepper**: 5 mg increment stepper added to medication dose input
- **Alcohol question**: standard drink definition hint added to the diary alcohol question
- **SVG backgrounds**: PNG background assets replaced with adaptive SVG components via `react-native-svg`
- **Unit test suite**: tests for storage helpers, stat computations, sleep metrics, and i18n; run automatically on every push via GitHub Actions
- **CI badge**: test status badge added to README

### Improved

- **Home screen**: entry card aspect ratio fixed; improved medication UX
- **Profile and questionnaire modals**: constrained to app width on web
- **Fathom analytics**: SPA page tracking enabled via `data-spa=auto`
- **Stability**: all AsyncStorage operations wrapped in try/catch with safe JSON parsing
- **Accessibility**: accessible labels added throughout; decorative emoji hidden from screen readers; colour-only distinctions resolved
- **Performance**: heavy computations memoised to avoid redundant re-renders on re-render
- **Architecture**: entry state centralised in `EntriesContext`; `MIN_ENTRIES` threshold and `computeStats` moved to `utils/`

### Fixed

- Entry button distortion on web and profile layout issues
- Duplicate i18n questionnaire keys that broke Back/Next buttons
- PWA splash dismissal on Android (`display-mode` standalone detection)

---

## [1.0.0-beta.1] — 2026-04-21

First public beta release of Sleep Diaries. This release covers the full core feature set intended for research use.

### Daily diary

- Morning entry (13 questions) covering bedtime, sleep onset latency, night wakings, final awakening, time in bed, sleep quality, and restedness
- Evening entry (5 questions) covering naps, caffeine, exercise, and medication
- Rich input types: 24-hour time stepper, duration stepper, yes/no, 1–5 rating scale, number counter, medication tracker, and free text
- Conditional follow-up questions appear automatically based on prior answers
- Dual amber/blue themes distinguish morning and evening flows

### Research questionnaires *(beta)*

- Eight validated one-time instruments accessible from the Profile screen: ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, MCTQ
- Step-by-step questionnaire modal with a purple theme, distinct from the daily diary
- Results gated behind 14 morning diary entries; questionnaires themselves always completable
- Colour-banded score bars and plain-language interpretation text
- Redo option for follow-up timepoints, with confirmation before overwriting
- Questionnaire credits screen listing copyright and permission status per instrument

### Final report

- Unlocks automatically after 14 morning diary entries
- Computes total sleep time, sleep efficiency, sleep onset latency, WASO, sleep quality, and restedness
- Questionnaire results included in the report with interpretation and completion dates

### Profile

- Editable participant name and research code
- Summary statistics: morning entries, evening entries, current streak, member since date
- Sleep metrics glossary with plain-language descriptions of each computed metric
- Quick actions: replay instructions, link to circadia-lab.uk
- My Medications screen — save regular treatments that auto-populate morning and evening diary medication questions

### Data management

- Local persistence via AsyncStorage; no data sent to any server
- CSV and JSON export via native share sheet, including questionnaire results
- JSON import with merge or replace options; duplicate entries are skipped on merge
- Research code included in all exports for participant linkage

### Platform and deployment

- iOS and Android via React Native + Expo SDK 55
- Progressive Web App (PWA) installable on iOS (Safari), Android (Chrome), and desktop
- Offline support via service worker
- Automatic deployment to [sleepdiaries.circadia-lab.uk](https://sleepdiaries.circadia-lab.uk) on push to `main`

### Notifications

- Daily push notification reminders at 8am and 9pm (configurable in Settings - iOS/Android only)
- Test notification option from the Settings screen

### Localisation

- Full Brazilian Portuguese (pt-BR) translation — UI strings, question text, and locale-specific image assets
- Locale detected automatically from device settings; falls back to English

### UI and navigation

- Tab bar, questionnaire nav buttons, instructions slideshow, and bottom shortcut cards all rendered in code using Ionicons (no PNG assets)
- Centralised typography system (Livvic Bold headings, Afacad body)
- Safe area handling via `useInsets.js`; tab bar width via `useWindowDimensions()`
- Settings screen: notifications, text-to-speech, language, export, and account management
- Version number displayed dynamically in Settings → About, sourced from `app.json`

### Known limitations

- Questionnaire scoring should be considered experimental; always verify against published sources before use in research
- KSS (Karolinska Sleepiness Scale) is defined but not yet active, pending protocol decisions
- Text-to-speech and bigger text settings are placeholders not yet implemented
