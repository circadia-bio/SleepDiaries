# 🌙 Sleep Diaries

![](header.png)

An open-source, research-grade sleep diary app built with React Native and Expo. Available on **iOS**, **Android**, and the **web**. Designed to be easily tailored by researchers, clinicians, and developers for their own sleep studies and clinical needs.

[![Tests](https://github.com/circadia-bio/SleepDiaries/actions/workflows/test.yml/badge.svg)](https://github.com/circadia-bio/SleepDiaries/actions/workflows/test.yml)
[![Version](https://img.shields.io/badge/version-1.0.0--beta.1-blue)](https://github.com/circadia-bio/SleepDiaries/releases)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.19683378.svg)](https://doi.org/10.5281/zenodo.19683378)
[![Beta](https://img.shields.io/badge/status-beta-orange)](#)
[![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)](https://sleepdiaries.circadia-lab.uk)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)](#)
[![License: MIT](https://img.shields.io/badge/licence-MIT-yellow)](./LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/circadia-bio/SleepDiaries)](https://github.com/circadia-bio/SleepDiaries/commits/main)
[![Issues](https://img.shields.io/github/issues/circadia-bio/SleepDiaries)](https://github.com/circadia-bio/SleepDiaries/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/circadia-bio/SleepDiaries/pulls)

🌐 **Web app:** https://sleepdiaries.circadia-lab.uk

---

## 📖 What is Sleep Diaries?

Sleep Diaries is a cross-platform app (iOS, Android, and web) that guides users through structured morning and evening questionnaires to track their sleep patterns over time. It is based on consensus sleep diary methodology used in clinical sleep research.

The app is intentionally simple and modular — the question sets, input types, themes, and data storage can all be customised without touching the core navigation or UI logic.

---

## ✨ Features

- 🌅 **Morning entry** — 13-question diary covering bedtime, sleep onset, night wakings, final awakening, sleep quality, and restedness
- 🌙 **Evening entry** — 5-question diary covering naps, caffeine, exercise, and medication
- ⏱️ **Rich input types** — 24-hour time stepper, duration stepper, yes/no, 1–5 rating scale, number counter, medication tracker, and free text
- 🔀 **Conditional questions** — follow-up questions appear automatically based on previous answers
- 🎨 **Dual themes** — amber for morning entries, blue for evening entries
- 💾 **Local persistence** — all entries saved to device storage via AsyncStorage
- 📋 **Past entries** — scrollable history grouped by date with expandable answer cards
- 📊 **Final report** — auto-unlocks after 14 morning entries, computes sleep metrics
- 📤 **Data export** — CSV and JSON export via native share sheet, including questionnaire results
- 🖼️ **Share card** — share a branded sleep report image to social media from the final report screen, with the original home screen background; works on iOS, Android, and mobile web (PWA)
- 🔔 **Push notifications** — daily 8am and 9pm reminders
- ⚙️ **Settings** — notifications toggle, text-to-speech, language, questionnaire credits, account management
- 👤 **Profile** — editable name and research code, summary stats, sleep metrics glossary, quick actions
- 📈 **Entry tab stats** — streak, entry counts, days in study
- 📥 **JSON import** — restore a backup or migrate between devices, with merge or replace (imports questionnaire results too)
- 📱 **iOS & Android** — single codebase via React Native + Expo
- 🌐 **Web** — Progressive Web App (PWA) installable on any device
- 📲 **Installable** — installs to home screen on iOS, Android, and desktop Chrome with full offline support
- 🌍 **Localisation** — full Portuguese (Brazilian) translation 🇧🇷, locale detected automatically from device settings
- 📋 **Research questionnaires** *(beta)* — validated one-time instruments (ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, MCTQ) accessible from the Profile, with results unlocking after 14 diary days
- 💊 **My Medications** — save regular treatments to your profile; they auto-populate the morning and evening medication questions

---

## 📱 Screens

![](screens.png)

---

## 🗂️ Project Structure

```
SleepDiaries/
├── app/                        # expo-router file-based navigation
│   ├── _layout.jsx             # Root stack navigator + asset preloading + PWA splash
│   ├── index.jsx               # Onboarding / name entry screen (+ research code)
│   ├── questionnaire.jsx       # Step-by-step questionnaire (morning or evening)
│   ├── past-entries.jsx        # Scrollable entry history
│   ├── final-report.jsx        # Sleep metrics summary report
│   ├── export.jsx              # CSV / JSON export + JSON import
│   ├── InstructionsModal.jsx   # Full-screen instructions slideshow (coded, no PNGs)
│   ├── ProfileModal.jsx        # Profile sheet (name, code, stats, glossary, questionnaires)
│   ├── QuestionnaireModal.jsx  # Step-by-step one-time research questionnaire modal
│   ├── MyMedicationsScreen.jsx         # Saved medication presets (accessible from Profile modal)
│   ├── SleepMetricsScreen.jsx          # Sleep metrics glossary (push screen from Profile modal)
│   ├── QuestionnairesScreen.jsx        # Questionnaires list (push screen from Profile modal)
│   ├── QuestionnaireCreditsScreen.jsx  # Questionnaire credits (push screen from Settings)
│   └── (tabs)/                         # Tab bar screens
│       ├── _layout.jsx         # Custom tab bar (Ionicons, no image assets)
│       ├── home.jsx            # Home screen
│       ├── entry.jsx           # Entry tab with sleep stats dashboard
│       └── settings.jsx        # Settings (includes questionnaire credits)
├── components/
│   ├── BottomCards.jsx         # Past Entries and Final Report shortcut cards
│   └── NavButtons.jsx          # Questionnaire Back / Next buttons
├── data/
│   ├── questions.js            # ⭐ Daily diary question definitions — start here to customise
│   ├── questions.pt-BR.js      # Portuguese (BR) translations of question text
│   ├── useQuestions.js         # Merges locale overrides at startup
│   └── questionnaires.js       # ⭐ One-time research questionnaire definitions (ESS, ISI, etc.)
├── i18n/
│   ├── index.js                # Locale detector + t() helper (interpolation, plurals)
│   ├── en.js                   # English strings
│   └── pt-BR.js                # Portuguese (Brazil) strings
├── storage/
│   ├── storage.js              # AsyncStorage helpers + CSV/JSON export + import
│   ├── EntriesContext.jsx      # React Context — shared entry cache consumed by all screens
│   └── notifications.js        # Push notification scheduling
├── utils/
│   ├── alert.js                # Cross-platform Alert helper (web fallback)
│   ├── constants.js            # ⭐ Shared constants (e.g. MIN_ENTRIES_FOR_REPORT)
│   └── stats.js                # Shared stat helpers (computeStats)
├── theme/
│   ├── typography.js           # Font constants (Livvic, Afacad)
│   └── useInsets.js            # Cross-platform safe area hook
├── web/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (offline support)
│   ├── icons/                  # PWA icons (192px, 512px)
│   └── splashscreens/          # iPhone/iPad splash screens
├── scripts/
│   ├── deploy.sh               # Web export + PWA injection + deploy prep
│   └── crop_taskbars.py        # Utility to centre-crop taskbar image assets
├── assets/
│   └── images/
│       ├── pt-BR/              # Locale-specific image assets (entry cards)
│       └── index.js            # Locale-aware image map
├── netlify.toml                # CI/CD build configuration
├── metro.config.js             # Metro bundler config (SVG support)
├── declarations.d.ts           # TypeScript declaration for SVG imports
├── app.json                    # Expo configuration
└── package.json                # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) on your phone, or Xcode (iOS simulator) / Android Studio (Android emulator)

### Installation

```bash
# Clone the repository
git clone https://github.com/circadia-bio/SleepDiaries.git
cd SleepDiaries

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go on your phone.

### Running on web (development)

```bash
npx expo start --web
```

### Deploying to the web

```bash
npm run deploy
```

This runs the deploy script which exports the web build, injects PWA tags, copies assets, and outputs everything to the `docs/` folder. The repository is configured for automatic deployment on every push to `main`.

🌐 **Live web app:** https://sleepdiaries.circadia-lab.uk

---

## 🌍 Localisation

The app detects the device locale at startup using `expo-localization` and selects the appropriate language automatically. No in-app language switcher is required — it just works.

### Supported languages

| Language | Locale code | Status |
|----------|-------------|--------|
| 🇬🇧 English | `en` | ✅ Complete |
| 🇧🇷 Portuguese (Brazil) | `pt-BR` | ✅ Complete |

All other locales fall back to English.

### How it works

All UI strings are defined in `i18n/en.js` and `i18n/pt-BR.js`. The `i18n/index.js` module resolves the correct bundle at startup and exports a `t()` helper used throughout the app:

```js
import t from '../i18n';

t('login.cta')                          // "Let's go" / "Vamos lá"
t('home.entriesNeeded', { count: 3 })   // "3 more entries needed" / "Faltam 3 registros"
```

The helper supports `{{variable}}` interpolation and automatic `_one` / `_other` pluralisation.

### Question translations

Question text, rating labels, units, and placeholders are defined separately in `data/questions.pt-BR.js` and merged over the base English definitions at startup by `data/useQuestions.js`. Only translatable fields are overridden — IDs, types, defaults, and conditional logic remain in `data/questions.js`.

### Adding a new language

1. Create `i18n/<locale>.js` following the structure of `en.js`
2. Create `data/questions.<locale>.js` for the question text
3. Add the locale to the `TRANSLATIONS` map in `i18n/index.js`
4. Add the locale to the `LANGUAGE_NAMES` map in `app/(tabs)/settings.jsx`
5. Export any locale-specific image assets to `assets/images/<locale>/`

### Locale-specific image assets

Entry cards (morning/evening pending, completed, locked) contain baked-in text and require locale-specific versions. These live in `assets/images/pt-BR/` and are selected at module load time by `assets/images/index.js`.

The tab bar, questionnaire nav buttons, instructions slideshow, and bottom shortcut cards are all rendered in code — no locale-specific image exports are needed for these.

---

## 📋 Research Questionnaires *(Beta)*

Sleep Diaries includes a set of validated one-time research questionnaires accessible from the Profile screen. These complement the daily diary by capturing baseline clinical and chronobiological characteristics of participants.

> ⚠️ **Beta notice:** Questionnaire scoring algorithms and result interpretations are implemented in good faith from the published literature but should be considered experimental. Always verify results against the original published sources before use in research or clinical practice.

### Available instruments

| Instrument | Full name | Items | Measures |
|------------|-----------|-------|---------|
| ESS | Epworth Sleepiness Scale | 8 | Daytime sleepiness |
| ISI | Insomnia Severity Index | 7 | Insomnia severity |
| DBAS-16 | Dysfunctional Beliefs and Attitudes about Sleep | 16 | Sleep-related cognitions |
| MEQ | Morningness–Eveningness Questionnaire | 19 | Chronotype |
| PSQI | Pittsburgh Sleep Quality Index | 17 | Sleep quality (7 components) |
| RU-SATED | RU-SATED Sleep Health Scale | 7 | Multidimensional sleep health |
| STOP-BANG | STOP-BANG Questionnaire | 8 | OSA risk screening |
| MCTQ | Munich Chronotype Questionnaire | 7 | Chronotype (MSFsc + social jetlag) |

### How it works

Questionnaires appear in the **Profile** modal under a dedicated section. Each can be completed at any time, but **results are withheld until 14 morning diary entries have been collected** — matching the same threshold as the final report. This ensures results reflect a participant who has completed an adequate baseline period.

Once the threshold is met, the scored result and a colour-banded interpretation are shown both in the profile and on the completion screen. A **Redo** option is available for follow-up timepoints, with a confirmation prompt before overwriting any existing result.

### Adding a new questionnaire

All questionnaire definitions live in `data/questionnaires.js`. Each instrument is a plain JavaScript object:

```js
export const MY_SCALE = {
  id:           'myscale',
  title:        'My Scale',
  shortTitle:   'MS',
  beta:         true,
  credit:       'Author, A. (Year). Journal, vol(issue), pp–pp. © Rights holder.',
  instructions: 'Instructions shown to the participant before item 1.',
  reference:    'Short citation string shown on the result screen.',
  items: [
    {
      id: 'ms1', number: 1,
      text: 'Question text',
      type: 'scale_0_3',       // see supported input types below
      options: [ ... ],
    },
  ],
  score: (answers) => /* return a number or object */,
  interpret: (score) => ({
    label: 'Label',
    color: '#hex',
    description: 'Plain-language description shown to the participant.',
  }),
};

// Add to the registry:
export const QUESTIONNAIRES = [..., MY_SCALE];
```

### Supported input types

| Type | Description |
|------|-------------|
| `scale_0_3` | 4-option labelled scale (0–3) |
| `scale_0_4` | 5-option labelled scale (0–4) |
| `scale_0_10` | 11-point circular picker (0–10) |
| `scale_1_10` | 10-option labelled scale (1–10) |
| `single_choice` | Pick one from a list of options with explicit values |
| `yes_no` | Yes / No |
| `frequency_3` | Rarely or never / Sometimes / Usually or always |
| `frequency_4` | Not during the past month / <once/week / 1–2×/week / ≥3×/week |
| `time` | HH:MM stepper |
| `duration_min` | Integer minutes stepper |
| `number` | Integer stepper with min/max/unit |

Any item can also include an optional `hint` string, which renders as a small info box below the question text — useful for clarifying ambiguous items (e.g. the MCTQ free-day bedtime question).

### Copyright and permissions

Several instruments are protected by copyright. The `credit` field on each definition (visible in **Settings → Questionnaire credits**) lists the citation and permission status. A summary:

| Instrument | Status |
|------------|--------|
| ESS | © Murray W. Johns — permission required for commercial use |
| ISI | © Charles M. Morin — available for non-commercial research |
| DBAS-16 | © Charles M. Morin — available via MAPI Research Trust |
| MEQ | Public domain |
| PSQI | © University of Pittsburgh — permission required; contact authors |
| RU-SATED | © University of Pittsburgh — permission required; contact authors |
| STOP-BANG | © University Health Network, Toronto — free for non-commercial research (stopbang.ca) |
| MCTQ | © Till Roenneberg, LMU Munich — free for non-commercial research (thewep.org) |
| KSS | Freely available for research use *(defined but not currently active)* |

**It is the responsibility of the researcher or institution deploying this app to obtain the necessary permissions before using any instrument in a study.**

---

## 📥 Importing Data

Entries exported as JSON from Sleep Diaries can be imported back into the app — useful for restoring a backup, transferring data between devices, or migrating participants between study phases.

### How to import

1. Go to **Settings → Export Data**
2. Scroll to **Import from JSON** at the bottom
3. Tap it and select your `.json` file from Files
4. If you already have entries on the device, you will be asked how to handle the conflict:

| Option | What it does |
|--------|--------------|
| **Merge** | Keeps all existing entries and adds any new ones from the file. Duplicate entries (same date and type) are skipped. Questionnaire results are imported only if not already present. |
| **Replace** | Deletes all existing entries and questionnaire results, and replaces them with the imported data. Requires a second confirmation. |

### File format

The import expects a JSON file previously exported by Sleep Diaries. The file must contain an `entries` array. A `questionnaires` array is imported if present.

```json
{
  "participant": "Lucas",
  "researchCode": "STUDY-001",
  "exportedAt": "2025-01-15T10:30:00Z",
  "entries": [
    {
      "id": "2025-01-14-morning",
      "type": "morning",
      "date": "2025-01-14",
      "completedAt": "2025-01-14T08:22:00Z",
      "answers": { "...": "..." }
    }
  ],
  "questionnaires": [
    {
      "id": "ess",
      "completedAt": "2025-01-14T09:00:00Z",
      "answers": { "ess1": 2, "ess2": 1, "...": "..." },
      "score": 12
    }
  ]
}
```

> On the web version, tapping Import opens your browser's file picker instead of the native Files app.

---

## 📲 Installing as an App

Sleep Diaries is a Progressive Web App (PWA) — it can be installed directly to your home screen from the browser, with no App Store required. Once installed it runs full-screen, works offline, and behaves like a native app.

### iOS (Safari)
1. Open [sleepdiaries.circadia-lab.uk](https://sleepdiaries.circadia-lab.uk) in **Safari**
2. Tap the **Share** button (box with arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the app icon will appear on your home screen

> Note: PWA installation on iOS only works in Safari, not Chrome or Firefox.

### Android (Chrome)
1. Open [sleepdiaries.circadia-lab.uk](https://sleepdiaries.circadia-lab.uk) in **Chrome**
2. Tap the **three-dot menu** (⋮) in the top right
3. Tap **Add to Home screen** or **Install app**
4. Tap **Install** — the app icon will appear on your home screen

### Desktop (Chrome / Edge)
1. Open [sleepdiaries.circadia-lab.uk](https://sleepdiaries.circadia-lab.uk)
2. Click the **install icon** (⊕) in the address bar
3. Click **Install**

---

## 🔧 Customising the Question Set

All questions are defined in a single file: **`data/questions.js`**

Each question is a plain JavaScript object with a `type` field that controls how it renders. To add, remove, or reorder questions, simply edit this file — no other changes are needed.

### Question object structure

```js
{
  id: 'mq1',              // Unique identifier (used for conditional logic)
  number: 1,              // Display number shown on screen
  text: 'Question text',  // The question shown to the user
  type: 'time',           // Input type (see below)
  defaultValue: { ... },  // Optional starting value
  optional: true,         // If true, user can skip without answering
}
```

### Available input types

| Type | Description | Use for |
|------|-------------|---------|
| `time` | 24-hour hour:minute stepper | Bedtime, wake time |
| `duration` | Hours + minutes stepper | Time to fall asleep, nap length |
| `yes_no` | Large Yes / No buttons | Binary questions |
| `rating` | 1–5 labelled option buttons | Sleep quality, restedness |
| `number` | +/- counter with unit label | Number of drinks, wake-ups |
| `medication` | Add/edit/delete entries with dose and time | Medication tracking |
| `text_input` | Multiline free text | Comments, notes |

### Conditional (follow-up) questions

```js
// Parent question
{
  id: 'mq4',
  text: 'Did you wake up during the night?',
  type: 'yes_no',
  followUp: 'mq4b',
},

// Follow-up — only shown if mq4 === 'yes'
{
  id: 'mq4b',
  text: 'How many times did you wake up?',
  type: 'number',
  conditionalOn: { id: 'mq4', value: 'yes' },
},
```

---

## 🎨 Customising Themes

The morning/evening colour themes are defined at the top of `app/questionnaire.jsx`:

```js
const THEME = {
  morning: {
    primary:      '#E07A20',   // Amber — buttons, text, progress bar
    primaryLight: '#F5C96A',   // Light amber — stepper backgrounds
    progressBg:   '#F5DEB3',
    background:   '#FDFAF5',
    cardBg:       '#FFF8EE',
  },
  evening: {
    primary:      '#2A6CB5',   // Blue
    primaryLight: '#7EB0E0',
    progressBg:   '#C8DFF5',
    background:   '#F5F9FF',
    cardBg:       '#EEF5FF',
  },
};
```

The one-time research questionnaire modal uses a **purple theme** (`#6B3FA0`) to visually distinguish it from the daily diary flows.

---

## 🗺️ Navigation Architecture

The app uses [expo-router](https://expo.github.io/router/) with file-based routing:

```
index.jsx           → Onboarding (shown on first launch, skipped if name saved)
(tabs)/home         → Main home screen (+ InstructionsModal + ProfileModal)
(tabs)/entry        → Entry tab with sleep stats dashboard
(tabs)/settings     → Settings (includes questionnaire credits)
questionnaire       → Full-screen questionnaire (slides up, hides tab bar)
past-entries        → Entry history
final-report        → Sleep metrics report
export              → CSV / JSON export + JSON import
```

The `ProfileModal` also hosts the `QuestionnaireModal` inline — tapping Start or Redo on a questionnaire opens it as a page sheet on top of the profile, without leaving the screen.

---

## 💾 Data Storage

All data is stored locally on the device using `@react-native-async-storage/async-storage`. No data is sent to any server.

```js
// Stored keys:
// 'user_name'            → participant name string
// 'research_code'        → optional research study identifier
// 'entries'              → JSON array of diary entry objects
// 'seen_instructions'    → 'true' once the instructions modal has been dismissed
// 'questionnaire_{id}'   → one object per completed one-time questionnaire
// 'medication_presets'    → JSON array of saved medication preset objects

// Diary entry structure:
{
  id: '2024-01-15-morning',
  type: 'morning',
  date: '2024-01-15',
  completedAt: '2024-01-15T08:32:00Z',
  answers: {
    mq1: { hour: 22, minute: 30 },
    mq4: 'yes',
    mq4b: 2,
    mq11: 4,
    // ...
  }
}

// Questionnaire result structure:
{
  id: 'ess',
  completedAt: '2024-01-15T09:00:00Z',
  answers: { ess1: 2, ess2: 0, /* ... */ },
  score: 12   // number, or object for computed instruments (e.g. MCTQ: { msf_sc, sjl })
}
```

---

## 🔬 Research Use

This app implements the **Consensus Sleep Diary (CSD)** — a standardised instrument for clinical and research settings. The morning questions cover:

- Sleep onset latency
- Number and duration of night wakings
- Early morning awakening
- Total sleep time (computed)
- Sleep efficiency (computed)
- Sleep quality and restedness

### Final report metrics

The final report (unlocked after 14 morning entries) automatically computes:

| Metric | Formula |
|--------|---------|
| Total sleep time | Time in bed − sleep onset latency − WASO |
| Sleep efficiency | Total sleep time ÷ time in bed × 100% |
| Sleep onset latency | Average time to fall asleep |
| WASO | Wake after sleep onset |
| Sleep quality | Average of 1–5 ratings |
| Restedness | Average of 1–5 ratings |

### Research code

The onboarding screen includes an optional **research code** field. This allows researchers to assign a unique identifier to each participant at enrolment. The code is:

- Saved locally on the device alongside the participant's name
- Included as a `research_code` column in CSV exports
- Included as a `researchCode` field in JSON exports
- Cleared when the participant logs out or deletes their account

Participants leave the field blank if they are using the app independently.

### Profile screen

The **Profile** button on the home screen slides up a modal showing:

- Editable participant name and research code
- Summary stats: morning entries, evening entries, current streak, member since date
- **Questionnaires** — one-time research instruments with status badges and Start/Redo buttons
- Sleep metrics glossary with plain-language explanations of each metric
- Quick actions: replay instructions, link to circadia-lab.uk

### Entry tab stats

The **Entry tab** shows a live stats dashboard above the entry cards:

- 🔥 Current streak (consecutive days with a morning entry)
- Morning entries, evening entries, and days in study (always visible)

### Adapting for your study

1. **Edit `data/questions.js`** to add, remove, or reorder diary questions
2. **Edit `data/questionnaires.js`** to add, remove, or reorder one-time instruments
3. **Add new input types** in `app/questionnaire.jsx` or `app/QuestionnaireModal.jsx`
4. **Change the unlock threshold** — edit `MIN_ENTRIES_FOR_REPORT` in `utils/constants.js` (currently 14); the same constant governs the final report, questionnaire result visibility, and the entry-tab stats dashboard
5. **Connect a backend** — replace the `AsyncStorage` calls in `storage/storage.js` with API calls

---

## 📄 Citation

**França, L. G. S., Baehl, B., Howard, J., Kussow, F., Luna Colón, Y., & Leocadio-Miguel, M.** (2026). *Sleep Diaries* (v1.0.0-beta.1) [Software]. Circadia Lab. https://doi.org/10.5281/zenodo.19683378

---

## 👥 Authors

| Role | Names |
|------|-------|
| Principal Investigators | Lucas França, Mario Leocadio-Miguel |
| Development | Lucas França |
| Design | Bri Baehl, Jacob Howard, Frederic Kussow, Yuliana Luna Colón |

---

## 🎨 Design Acknowledgement

The app design was created by exchange students — Bri Baehl, Jacob Howard, Frederic Kussow, and Yuliana Luna Colón — during the **7th Annual Digital Civics Exchange (DCX)**, an international programme connecting students across disciplines to co-design civic technologies.

🌐 [dcx.events](https://www.dcx.events/home)

---

## 🤖 AI Acknowledgement

Development of this app was assisted by **Claude** (Anthropic's AI assistant). Claude helped scaffold the React Native codebase, implement navigation, build the questionnaire engine, set up local storage, push notifications, data export, the final report, the localisation system, and the one-time research questionnaire feature.

---

## 🤝 Contributing

Contributions are welcome. If you are adapting this for a research study and want to share improvements back, please open a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m '✨ feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.0 | Core Expo SDK |
| `expo-router` | ~55.0.0 | File-based navigation |
| `expo-localization` | ~55.0.0 | Device locale detection |
| `react-native` | 0.83.2 | Cross-platform mobile framework |
| `react` | 19.2.0 | React framework |
| `@expo/vector-icons` | ^15.0.2 | Ionicons icon set |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local data persistence |
| `expo-notifications` | ~55.0.0 | Push notification reminders |
| `expo-status-bar` | ~55.0.0 | Status bar control |
| `react-native-paper` | ^5.12.0 | UI component library |
| `react-native-safe-area-context` | 5.6.2 | Safe area handling |
| `react-native-screens` | 4.23.0 | Native screen management |
| `react-native-svg` | ~15.0.0 | SVG rendering (instructions background) |
| `react-native-svg-transformer` | latest | SVG imports as React components |
| `babel-preset-expo` | ~55.0.0 | Babel transpilation |
| `expo-document-picker` | ~55.0.0 | JSON file import |
| `react-native-view-shot` | latest | Capture React Native views as images (share card) |
| `expo-sharing` | ~55.0.0 | Native file sharing (share card) |
| `expo-asset` | ~55.0.0 | Asset preloading at startup |

---

## 🤝 Related Tools

- 🌀 [**nonparametric-actigraphy-clustering**](https://github.com/circadia-bio/nonparametric-actigraphy-clustering) — unsupervised clustering of actigraphy rest-activity profiles using nonparametric methods
- ⚡ [**ACTT_validation_study**](https://github.com/circadia-bio/ACTT_validation_study) — validation study for actigraphy-based sleep staging cut-points
- 🔬 [**circadia-bio**](https://github.com/circadia-bio) — the Circadia Lab GitHub organisation

---

## 📄 Licence

![](assets/images/logo.png)

Copyright © Circadia Lab — Lucas França & Mario Leocadio-Miguel

Released under the [MIT License](./LICENSE).

Design by Bri Baehl, Jacob Howard, Frederic Kussow, and Yuliana Luna Colón.

> **Note on third-party questionnaire instruments:** The validated sleep questionnaires included in this app (ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, MCTQ) are the intellectual property of their respective authors and institutions. Their inclusion in this open-source repository does not grant any rights to use them beyond what is permitted by each instrument's licence. See **Settings → Questionnaire credits** in the app, or the `credit` field in `data/questionnaires.js`, for per-instrument copyright and permission details.

---

## 🏗️ Roadmap

- [x] Persist answers with AsyncStorage
- [x] Show name entered at onboarding on home screen
- [x] Past entries screen with history view
- [x] Final report with sleep metrics
- [x] Push notification reminders (morning + evening)
- [x] Data export (CSV / JSON) including questionnaire results
- [x] Web app
- [x] Progressive Web App (PWA) — installable on iOS, Android, and desktop
- [x] Offline support via service worker
- [x] JSON import with merge/replace (including questionnaire results)
- [x] Optional research code for study participants
- [x] Profile screen with editable participant info, stats, and metrics glossary
- [x] Entry tab sleep stats dashboard
- [x] Automatic deployment via CI/CD
- [x] Full Portuguese (Brazil) localisation — strings, questions, and image assets
- [x] SVG support via react-native-svg-transformer
- [x] One-time research questionnaires (ESS, ISI, DBAS-16, MEQ, PSQI, RU-SATED, STOP-BANG, MCTQ) *(beta)*
- [x] Medication presets — auto-populate diary medication questions from saved treatments
- [x] Share card — share a branded sleep report image from the final report screen
- [ ] Questionnaire result validation and removal of beta flag per instrument
- [ ] KSS (Karolinska Sleepiness Scale) — protocol integration pending
- [ ] Backend API integration
- [ ] Additional language support
