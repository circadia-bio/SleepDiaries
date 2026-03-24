# 🌙 Sleep Diaries

An open-source, research-grade sleep diary mobile app built with React Native and Expo. Designed to be easily tailored by researchers, clinicians, and developers for their own sleep studies and clinical needs.

---

## 📖 What is Sleep Diaries?

Sleep Diaries is a cross-platform mobile app (iOS & Android) that guides users through structured morning and evening questionnaires to track their sleep patterns over time. It is based on consensus sleep diary methodology used in clinical sleep research.

The app is intentionally simple and modular — the question sets, input types, themes, and data storage can all be customised without touching the core navigation or UI logic.

---

## ✨ Features

- 🌅 **Morning entry** — 13-question diary covering bedtime, sleep onset, night wakings, final awakening, sleep quality, and restedness
- 🌙 **Evening entry** — 5-question diary covering naps, caffeine, exercise, and medication
- ⏱️ **Rich input types** — 24-hour time stepper, duration stepper, yes/no, 1–5 rating scale, number counter, medication tracker, and free text
- 🔀 **Conditional questions** — follow-up questions appear automatically based on previous answers (e.g. medication details only shown if the user said yes)
- 🎨 **Dual themes** — amber for morning entries, blue for evening entries
- ⚙️ **Settings screen** — notifications toggle, text-to-speech toggle, language selection, account management
- 📱 **iOS & Android** — single codebase via React Native + Expo

---

## 🗂️ Project Structure

```
SleepDiaries/
├── app/                        # expo-router file-based navigation
│   ├── _layout.jsx             # Root stack navigator (login + questionnaire live here)
│   ├── index.jsx               # Onboarding / name entry screen
│   ├── questionnaire.jsx       # Step-by-step questionnaire (morning or evening)
│   └── (tabs)/                 # Tab bar screens (always show bottom nav)
│       ├── _layout.jsx         # Tab bar configuration (icons, colours, labels)
│       ├── home.jsx            # Home screen (entry cards, past entries, final report)
│       ├── entry.jsx           # Entry chooser (morning vs evening shortcut)
│       └── settings.jsx        # Settings (notifications, language, account)
├── data/
│   └── questions.js            # ⭐ All question definitions — start here to customise
├── assets/                     # App icons and splash screen
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
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

A question can be shown only when a previous question was answered a specific way:

```js
// Parent question
{
  id: 'mq4',
  text: 'Did you wake up during the night?',
  type: 'yes_no',
  followUp: 'mq4b',       // ID of the follow-up question
},

// Follow-up — only shown if mq4 === 'yes'
{
  id: 'mq4b',
  text: 'How many times did you wake up?',
  type: 'number',
  conditionalOn: { id: 'mq4', value: 'yes' },
},
```

### Adding a new question

```js
// Add to MORNING_QUESTIONS or EVENING_QUESTIONS in data/questions.js
{
  id: 'mq_custom1',
  number: 14,
  text: 'Did you dream last night?',
  type: 'yes_no',
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
    progressBg:   '#F5DEB3',   // Progress track colour
    background:   '#FDFAF5',   // Screen background
    cardBg:       '#FFF8EE',   // Medication card background
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

Change any hex value to restyle the entire questionnaire for that entry type.

---

## 🗺️ Navigation Architecture

The app uses [expo-router](https://expo.github.io/router/) with file-based routing:

```
index.jsx          → Onboarding screen (shown on first launch)
(tabs)/home        → Main home screen
(tabs)/entry       → Entry type chooser
(tabs)/settings    → Settings
questionnaire      → Full-screen questionnaire (slides up, hides tab bar)
```

The questionnaire is a **stack screen** (not a tab), so it slides up over the tab bar when opened. This gives it a focused, form-like feel appropriate for data entry.

---

## 💾 Data Storage

Currently, answers are logged to the console at the end of each questionnaire. Persistent storage using `@react-native-async-storage/async-storage` is already installed and ready to wire up.

Planned storage structure:

```js
// Key: 'entries'
// Value: array of entry objects
[
  {
    id: '2024-01-15-morning',
    type: 'morning',
    date: '2024-01-15',
    completedAt: '2024-01-15T08:32:00Z',
    answers: {
      mq1: { hour: 22, minute: 30 },
      mq2: { hour: 23, minute: 0 },
      mq4: 'yes',
      mq4b: 2,
      mq11: 4,
      // ...
    }
  }
]
```

---

## 🔬 Research Use

This app is designed to implement the **Consensus Sleep Diary (CSD)** — a standardised instrument developed for use in clinical and research settings. The morning questions follow the core CSD items covering:

- Sleep onset latency
- Number and duration of night wakings
- Early morning awakening
- Total sleep time
- Sleep quality and restedness

### Adapting for your study

To adapt the app for a specific study protocol:

1. **Edit `data/questions.js`** to add, remove, or reorder questions
2. **Add new input types** in `app/questionnaire.jsx` by adding a new component and a new `type` string
3. **Change the entry schedule** — the morning/evening split can be changed to any schedule by renaming and reconfiguring the entry types
4. **Connect a backend** — replace the `AsyncStorage` placeholder with an API call to send data to your research database

---

## 👥 Authors

**Northumbria University**

| Role | Name |
|------|------|
| Principal Investigator & Supervisor | Lucas França |
| Principal Investigator & Supervisor | Mario Miguel |
| Development | Lucas França |
| Design | Bri Baehl |
| Design | Jacob Howard |
| Design | Frederic Kussow |
| Design | Yuliana Luna Colón |

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
| `expo` | ~55.0.8 | Core Expo SDK |
| `expo-router` | ~55.0.7 | File-based navigation |
| `react-native` | 0.83.2 | Cross-platform mobile framework |
| `@expo/vector-icons` | bundled | Ionicons icon set |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local data persistence |
| `expo-notifications` | ~55.0.13 | Push notifications for reminders |
| `react-native-safe-area-context` | ~5.6.2 | Safe area handling |
| `react-native-screens` | ~4.23.0 | Native screen management |

---

## 📄 Licence

See [LICENSE](./LICENSE) for details.

---

## 🏗️ Roadmap

- [ ] Persist answers with AsyncStorage
- [ ] Show name entered at onboarding on home screen
- [ ] Past entries screen with history view
- [ ] Final report generation
- [ ] Push notification reminders (morning + evening)
- [ ] Data export (CSV / JSON)
- [ ] Backend API integration
- [ ] Multi-language support
