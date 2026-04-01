# 🌙 Sleep Diaries

![](header.png)

An open-source, research-grade sleep diary app built with React Native and Expo. Available on **iOS**, **Android**, and the **web**. Designed to be easily tailored by researchers, clinicians, and developers for their own sleep studies and clinical needs.

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
- 📤 **Data export** — CSV and JSON export via native share sheet
- 🔔 **Push notifications** — daily 8am and 9pm reminders
- ⚙️ **Settings** — notifications toggle, text-to-speech, language, account management
- 👤 **Profile** — editable name and research code, summary stats, quick actions
- 📈 **Entry tab stats** — streak, entry counts, days in study (sleep metrics unlock after 14 morning entries)
- 📥 **JSON import** — restore a backup or migrate between devices, with merge or replace
- 📱 **iOS & Android** — single codebase via React Native + Expo
- 🌐 **Web** — Progressive Web App (PWA) installable on any device
- 📲 **Installable** — installs to home screen on iOS, Android, and desktop Chrome with full offline support

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
│   ├── InstructionsModal.jsx   # Full-screen instructions slideshow
│   ├── ProfileModal.jsx        # Profile sheet (name, research code, stats)
│   └── (tabs)/                 # Tab bar screens
│       ├── _layout.jsx         # Custom image-based tab bar
│       ├── home.jsx            # Home screen
│       ├── entry.jsx           # Entry tab with sleep stats dashboard
│       └── settings.jsx        # Settings
├── data/
│   └── questions.js            # ⭐ All question definitions — start here to customise
├── storage/
│   ├── storage.js              # AsyncStorage helpers + CSV/JSON export + import
│   └── notifications.js        # Push notification scheduling
├── theme/
│   ├── typography.js           # Font constants (Livvic, Afacad)
│   └── useInsets.js            # Cross-platform safe area hook
├── web/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (offline support)
│   ├── icons/                  # PWA icons (192px, 512px)
│   └── splashscreens/          # iPhone/iPad splash screens
├── scripts/
│   └── deploy.sh               # Web export + PWA injection + deploy prep
├── assets/                     # App icons, splash, and image assets
├── netlify.toml                # CI/CD build configuration
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

## 📥 Importing Data

Entries exported as JSON from Sleep Diaries can be imported back into the app — useful for restoring a backup, transferring data between devices, or migrating participants between study phases.

### How to import

1. Go to **Settings → Export Data**
2. Scroll to **Import from JSON** at the bottom
3. Tap it and select your `.json` file from Files
4. If you already have entries on the device, you will be asked how to handle the conflict:

| Option | What it does |
|--------|--------------|
| **Merge** | Keeps all existing entries and adds any new ones from the file. Duplicate entries (same date and type) are skipped. |
| **Replace** | Deletes all existing entries and replaces them with the imported ones. Requires a second confirmation. |

### File format

The import expects a JSON file previously exported by Sleep Diaries. The file must contain an `entries` array. A `participant` name and `researchCode` at the top level are optional and not imported (only the entries are).

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
      "answers": { ... }
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

---

## 🗺️ Navigation Architecture

The app uses [expo-router](https://expo.github.io/router/) with file-based routing:

```
index.jsx           → Onboarding (shown on first launch, skipped if name saved)
(tabs)/home         → Main home screen (+ InstructionsModal + ProfileModal)
(tabs)/entry        → Entry tab with sleep stats dashboard
(tabs)/settings     → Settings
questionnaire       → Full-screen questionnaire (slides up, hides tab bar)
past-entries        → Entry history
final-report        → Sleep metrics report
export              → CSV / JSON export + JSON import
```

---

## 💾 Data Storage

All data is stored locally on the device using `@react-native-async-storage/async-storage`. No data is sent to any server.

```js
// Stored keys:
// 'user_name'         → participant name string
// 'research_code'     → optional research study identifier
// 'entries'           → JSON array of entry objects
// 'seen_instructions' → 'true' once the instructions modal has been dismissed

// Entry structure:
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
- Quick actions: replay instructions, link to circadia-lab.uk

### Entry tab stats

The **Entry tab** shows a live stats dashboard above the entry cards:

- 🔥 Current streak (consecutive days with a morning entry)
- Morning entries, evening entries, and days in study (always visible)
- Average sleep time, sleep efficiency, and sleep quality (unlock after 14 morning entries)

Before 14 entries a lock hint shows the number of entries remaining.

### Adapting for your study

1. **Edit `data/questions.js`** to add, remove, or reorder questions
2. **Add new input types** in `app/questionnaire.jsx`
3. **Change the unlock threshold** — edit `MIN_ENTRIES_FOR_REPORT` in `app/final-report.jsx` (currently 14)
4. **Connect a backend** — replace the `AsyncStorage` calls in `storage/storage.js` with API calls

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

Development of this app was assisted by **Claude** (Anthropic's AI assistant). Claude helped scaffold the React Native codebase, implement navigation, build the questionnaire engine, set up local storage, push notifications, data export, and the final report.

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
| `react-native` | 0.83.2 | Cross-platform mobile framework |
| `react` | 19.2.0 | React framework |
| `@expo/vector-icons` | ^15.0.2 | Ionicons icon set |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local data persistence |
| `expo-notifications` | ~55.0.0 | Push notification reminders |
| `expo-status-bar` | ~55.0.0 | Status bar control |
| `react-native-paper` | ^5.12.0 | UI component library |
| `react-native-safe-area-context` | 5.6.2 | Safe area handling |
| `react-native-screens` | 4.23.0 | Native screen management |
| `babel-preset-expo` | ~55.0.0 | Babel transpilation |
| `expo-document-picker` | ~55.0.0 | JSON file import |
| `expo-asset` | ~55.0.0 | Asset preloading at startup |

---

## 📄 Licence

![](assets/images/logo.png)

Copyright © Circadia Lab — Lucas França & Mario Leocadio-Miguel

Released under the [MIT License](./LICENSE).

Design by Bri Baehl, Jacob Howard, Frederic Kussow, and Yuliana Luna Colón.

---

## 🏗️ Roadmap

- [x] Persist answers with AsyncStorage
- [x] Show name entered at onboarding on home screen
- [x] Past entries screen with history view
- [x] Final report with sleep metrics
- [x] Push notification reminders (morning + evening)
- [x] Data export (CSV / JSON)
- [x] Web app (Netlify)
- [x] Progressive Web App (PWA) — installable on iOS, Android, and desktop
- [x] Offline support via service worker
- [x] JSON import with merge/replace
- [x] Optional research code for study participants
- [x] Profile screen with editable participant info and stats
- [x] Entry tab sleep stats dashboard
- [x] Sleep metrics glossary in Profile
- [x] Automatic deployment via CI/CD
- [ ] Backend API integration
- [ ] Multi-language support
