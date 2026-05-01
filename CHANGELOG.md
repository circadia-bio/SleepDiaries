# Changelog

All notable changes to Sleep Diaries will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.1.0] — 2026-05-01

### Added

- **Unit test suite — questionnaire scoring**: comprehensive tests for all eight one-time questionnaire instruments (ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, MCTQ) covering score computation, boundary conditions, and interpretation labels
- **Unit test suite — JSON export consistency**: structural validation of `exportToJSON` output, field-format checks (clock, duration, medication), round-trip fidelity, and import edge cases

### Fixed

- **MEQ items 11 and 12**: corrected option values to match the original Horne & Östberg (1976) paper — item 11 now scores 6/4/2/0 and item 12 scores 0/2/3/5, raising the maximum achievable score to 86
- **PSQI scoring**: corrected sleep duration boundary (`>7` → `≥7`), sleep efficiency formula, and disturbance thresholds to match the official Buysse et al. (1989) scoring algorithm; maximum score now correctly displayed as `/21`
- **PSQI result display**: maximum score was incorrectly calculated by summing raw item option values (giving `/39`); now uses the published maximum of 21 via `maxScore` property
- **RU-SATED**: fully rewritten to match official Ru-SATED v4.0 — 6 items (not 7), 0–4 response scale (Never/Rarely/Sometimes/Often/Always), maximum score 24, corrected item wording; interpretation thresholds updated accordingly
- **MCTQ MSFsc formula**: corrected to compare SD_F vs SD_W (not SD_week) per Roenneberg et al.; social jetlag now uses circular (shorter arc) arithmetic to handle midnight-straddling schedules, fixing erroneous values such as 24.0 h
- **Questionnaire results not showing**: `resultsUnlocked` was passed as a stale route param from `QuestionnairesScreen` (evaluated before `morningCount` loaded from storage); `QuestionnaireScreen` now loads entry count independently, resolving the issue where results only appeared after visiting the Final Report screen
- **Service worker cache**: bumped cache version from `v1` to `v2` to force a full cache bust on existing PWA installations, ensuring updated JS bundles are served

### Improved

- **One-time questionnaire steppers**: time, duration, and number steppers in `QuestionnaireModal` now support long-press repeat (150 ms interval), matching the behaviour of the daily diary steppers
- **Beta flags removed**: ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, and MCTQ are now considered stable; beta flags and banners removed from all eight instruments
- **Questionnaire footnote**: removed the opening "These questionnaires are experimental" sentence; retained the methodological caveat and licensing reference
- **MCTQ**: removed beta flag following scoring correction

---
## [1.1.0-beta.2] — 2026-04-24

### Improved

- **Questionnaire UI refresh**: daily (morning/evening) and one-time questionnaire screens fully modernised — glassy progress bar, yes/no, rating and number buttons with soft shadows; themed tint on progress track for contrast; glassy Back button; shadow lift on Next button; borderless unselected button states throughout
- **Minor visual polish**: button shadow depths increased across questionnaire screens; progress icon and track borders softened to match glassy language

---

## [1.2.0-beta.1] — 2026-04-24

### Improved

- **UI modernisation — glassy card system**: unified semi-transparent card treatment (`rgba(255,255,255,0.72)`) with white borders and blue-tinted shadows applied across all screens; replaces hard `borderWidth: 1.5` / `#B0CCEE` borders throughout
- **Home screen**: instructions card and bottom shortcut cards (Past Entries, Final Report) refreshed with glassy treatment, icon pills, and inline label + chevron rows
- **Tab bar**: labels added (Home / Diary / Settings; EN + PT-BR), semi-transparent background with blur on web, upward shadow, refined inactive colour
- **Diary tab**: streak banner and stat chips refreshed; streak emoji replaced with themed flame icon (orange when active, blue when zero); stat box labels shortened to prevent wrapping
- **Login screen**: logo added as a soft footer element; glassy inputs; dynamic CTA button colour (grey → blue based on input)
- **Final report**: blurred home gradient background with white overlay; battery-half icon for morning restedness; sleep quality swapped to blue star
- **Profile modal**: full-screen gradient background with overlay; glassy edit inputs and action buttons
- **Past entries**: glassy entry cards; orange uppercase date labels; icon pills for morning/evening
- **Questionnaires screen**: blue-tinted borderless Start/Redo buttons
- **Daily questionnaire**: glassy progress bar, yes/no, rating, and number buttons; themed tint on progress track; glassy Back button; shadow on Next button
- **One-time questionnaire modal**: gradient background with purple overlay; glassy progress bar, scale buttons, instructions box, and nav buttons; purple border only on selected state
- **Export, Medications, Sleep Metrics, Questionnaire Credits, Threshold References screens**: all modernised with glassy cards and shadow headers
- **`expo-blur`**: added as a dependency for blur effects on the final report and profile modal

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
