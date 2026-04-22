/**
 * i18n/en.js — English strings
 */
export default {
  // ── Login screen ─────────────────────────────────────────────────────────
  login: {
    subtitle:        'Enter your name to get started',
    namePlaceholder: 'Your name',
    codePlaceholder: 'Research code (optional)',
    codeHint:        'Optional — provided by your research team',
    cta:             "Let's go",
    errorName:       'Please enter your name to continue.',
  },

  // ── Home screen ───────────────────────────────────────────────────────────
  home: {
    welcome:          'Welcome,',
    profile:          'Profile',
    newEntry:         'New Entry',
    instructionsTitle:'Instructions',
    instructionsBody: 'Click here to learn more about sleep diaries and additional information.',
    entriesNeeded_one:   '{{count}} more entry needed',
    entriesNeeded_other: '{{count}} more entries needed',
  },

  // ── Entry tab ─────────────────────────────────────────────────────────────
  entry: {
    daysInStudy:  'Days in study',
    statsUnlock:  'Sleep stats unlock after {{count}} more morning entries',
    a11y: {
      morningStart:     'Start morning entry',
      morningCompleted: 'Morning entry completed. Tap to edit.',
      eveningStart:     'Start evening entry',
      eveningCompleted: 'Evening entry completed. Tap to edit.',
      eveningLocked:    'Evening entry locked. Complete the morning entry first.',
    },
  },

  // ── Profile modal ─────────────────────────────────────────────────────────
  profile: {
    title:           'Profile',
    tapToSetName:    'Tap to set name',
    addResearchCode: 'Add research code',
    researchCodePlaceholder: 'Research code',

    sectionSummary:  'Summary',
    statMorning:      'Morning entries',
    statEvening:      'Evening entries',
    statMorningShort: 'Morning',
    statEveningShort: 'Evening',
    statStreak:      'Current streak',
    statStreakUnit:  'days',
    statSince:       'Member since',
    statQuestionnaires: 'Questionnaires',
    statMedications:    'Medications',
    noEntries:       'No entries yet',

    sectionGlossary: 'Sleep metrics explained',
    glossary: {
      sleepDuration: {
        title: 'Sleep Duration',
        body:  'The total amount of time you were asleep. Most adults need between 7 and 9 hours per night.',
      },
      sleepEfficiency: {
        title: 'Sleep Efficiency',
        body:  'The percentage of time in bed that you were actually asleep. A score of 85% or above is considered healthy — higher is better.',
      },
      sleepOnsetLatency: {
        title: 'Sleep Onset Latency',
        body:  'How long it took you to fall asleep after getting into bed. Falling asleep within 30 minutes is typical.',
      },
      waso: {
        title: 'Wake After Sleep Onset (WASO)',
        body:  'The total time spent awake after first falling asleep but before getting up for the day. Lower is better.',
      },
      nightWakings: {
        title: 'Night Wakings',
        body:  'The number of times you woke during the night. Occasional brief wakings are normal, but frequent disruptions can affect sleep quality.',
      },
      sleepQuality: {
        title: 'Sleep Quality',
        body:  'Your own rating of how well you slept, on a scale of 1 to 5. This captures the overall feel of your night beyond what the numbers alone can show.',
      },
      restedness: {
        title: 'Restedness',
        body:  'How refreshed and restored you felt upon waking, on a scale of 1 to 5. This reflects whether sleep was restorative, even when duration and efficiency look good.',
      },
      earlyWaking: {
        title: 'Early Waking',
        body:  'The proportion of nights you woke earlier than intended and could not get back to sleep. This can be a sign of disrupted sleep or early-morning light exposure.',
      },
    },

    sectionActions:     'Quick actions',
    replayInstructions: 'Replay instructions',
    website:            'circadia-lab.uk',
  },

  // ── Past entries screen ───────────────────────────────────────────────────
  pastEntries: {
    title:         'Past Entries',
    morningEntry:  'Morning Entry',
    eveningEntry:  'Evening Entry',
    emptyTitle:    'No entries yet',
    emptySubtitle: 'Complete your first morning or evening entry to see it here.',
    answerNone:    'None recorded',
    answerYes:     'Yes',
    answerNo:      'No',
  },

  // ── Export / import screen ────────────────────────────────────────────────
  export: {
    title:               'Export Data',
    infoText:            'Export all your sleep diary entries and questionnaire results to share with a researcher or import into a spreadsheet.',
    csvTitle:            'Export as CSV',
    csvSubtitle:         'One row per entry. Opens in Excel, Numbers, or any spreadsheet app.',
    jsonTitle:           'Export as JSON',
    jsonSubtitle:        'Full structured data including all answers. Ideal for analysis scripts.',
    importTitle:         'Import from JSON',
    importSubtitle:      'Restore entries from a previously exported Sleep Diaries JSON file.',
    note:                'Your data stays on your device at all times. Exporting shares it only with the app you choose.',
    noDataTitle:         'No data',
    noDataBody:          'Complete at least one entry before exporting.',
    exportFailTitle:     'Export failed',
    importFailTitle:     'Import failed',
    existingDataTitle:   'Existing data found',
    existingDataBody_one:   'You already have {{count}} entry. What would you like to do?',
    existingDataBody_other: 'You already have {{count}} entries. What would you like to do?',
    cancel:              'Cancel',
    merge:               'Merge',
    replace:             'Replace',
    replaceConfirmTitle: 'Replace all data?',
    replaceConfirmBody:  'This will permanently delete all your existing entries. This cannot be undone.',
  },

  // ── Final report ──────────────────────────────────────────────────────────
  report: {
    title:               'Final Report',
    notEnoughTitle:      'Not enough data yet',
    notEnoughSubtitle:   'Complete at least {{count}} morning entries to generate your report.',
    morningEntries_one:   '{{count}} morning entry',
    morningEntries_other: '{{count}} morning entries',
    sleepTiming:         'Sleep timing',
    sleepQuality:        'Sleep quality',
    nightDisruptions:    'Night disruptions',
    lifestyle:           'Lifestyle factors',
    avgSleepDuration:    'Average sleep duration',
    avgSleepDurationSub: 'Total sleep time per night',
    sleepEfficiency:     'Sleep efficiency',
    sleepEfficiencySub:  'Time asleep ÷ time in bed',
    efficiencyGood:      '✓ Target met',
    efficiencyLow:       '↓ Below target',
    sleepOnsetLatency:   'Sleep onset latency',
    sleepOnsetLatencySub:'Average time to fall asleep',
    waso:                'Wake after sleep onset',
    wasoSub:             'Average time awake during the night',
    avgNightWakings:     'Average night wakings',
    avgNightWakingsSub:  'Per night average',
    earlyWaking:         'Early waking',
    earlyWakingSub:      'Woke earlier than planned',
    avgAlcohol:          'Average alcohol intake',
    avgAlcoholSub:       'Average drinks reported the evening before',
    alcoholNote:         'Colour-coded against NHS guidelines (UK Chief Medical Officers, 2016): green <1 drink/night, amber 1–2, red >2. The NHS advises no more than 14 units per week for both men and women, spread over 3 or more days. If you have concerns about your alcohol intake, speak to a healthcare provider.',
    nightQuality:        'Sleep quality',
    morningRestedness:   'Morning restedness',
    ofNights:            '% of nights',
    drinksNight:         'drinks/night',
    times:               'times',
    disclaimer:          'This report is generated from self-reported diary data and one-time questionnaire results. It is intended as a research summary and not a clinical diagnosis.',
    thresholdNote:        'Reference thresholds shown are general population averages and may vary by age, sex, and individual health factors. Consult a healthcare provider if you have concerns about your sleep.',
    questionnaireOne:   'questionnaire done',
    questionnaireOther:  'questionnaires done',
    eveningEntries:      'evening entries',
    sectionQuestionnaires: 'Questionnaire results',
    shareHeader:         'Sleep Diaries — Final Report',
    shareParticipant:    'Participant:',
    sharePeriod:         'Period:',
    shareEntries:        'Entries:',
    shareAvgDuration:    'Average sleep duration:',
    shareAvgEfficiency:  'Average sleep efficiency:',
    shareAvgSOL:         'Average sleep onset latency:',
    shareAvgWASO:        'Average wake after sleep onset:',
    shareAvgWakings:     'Average night wakings:',
    shareAvgQuality:     'Average sleep quality:',
    shareAvgRestedness:  'Average restedness:',
    shareEarlyWaking:    'Early waking:',
  },

  // ── Settings screen ───────────────────────────────────────────────────────
  settings: {
    title:                'Settings',
    sectionAccessibility: 'Accessibility',
    biggerText:           'Bigger Text',
    sectionLanguage:      'Language',
    chooseLanguage:       'Choose Language',
    sectionNotifications: 'Notifications',
    dailyReminders:       'Daily Reminders',
    notificationsHint:    'Morning reminder at 8:00 AM and evening reminder at 9:00 PM every day.',
    permissionTitle:      'Permission required',
    permissionBody:       'Please enable notifications for Sleep Diaries in your device Settings to receive reminders.',
    remindersSetTitle:    'Reminders set',
    remindersSetBody:     "You'll receive a morning reminder at 8:00 AM and an evening reminder at 9:00 PM every day.",
    sendTestNotif:        'Send test notification',
    ok:                   'OK',
    sectionTTS:           'Text to Speech',
    ttsLabel:             'Text to Speech',
    ttsHint:              'Read questions aloud through the speaker.',
    sectionData:          'Data',
    exportData:           'Export Data',
    exportDataHint:       'Export your entries as CSV or JSON for research use.',
    sectionQuestionnaires: 'Questionnaire credits',
    sectionThresholds:       'Sleep metric thresholds',
    thresholdsNote:          'The following reference thresholds are used to colour-code metrics in the final report. These are general population averages and may vary by age, sex, and individual health factors.',
    thresholdDuration:       'Sleep Duration',
    thresholdDurationRef:    'National Sleep Foundation: 7–9 hours recommended for adults. Hirshkowitz et al. (2015). Sleep Health, 1(1), 40–43.',
    thresholdEfficiency:     'Sleep Efficiency',
    thresholdEfficiencyRef:  'Morin, C. M. (1993). Insomnia: Psychological assessment and management. Guilford Press. ≥85% considered healthy.',
    thresholdLatency:        'Sleep Onset Latency',
    thresholdLatencyRef:     'Ohayon et al. (2017). Sleep Medicine Reviews, 34, 14–31. ≤15 min normal; >30 min clinically significant.',
    thresholdWaso:           'Wake After Sleep Onset',
    thresholdWasoRef:        'Ohayon et al. (2017). Sleep Medicine Reviews, 34, 14–31. ≤20 min normal; >30 min clinically significant.',
    thresholdAlcohol:        'Alcohol Intake',
    thresholdAlcoholRef:     'UK Chief Medical Officers’ Low Risk Drinking Guidelines (2016). No more than 14 units per week, equating to ≤2 drinks per night on average.',
    questionnairesNote:    'The following validated instruments are used in this app. Please ensure you have the appropriate permissions before using them in research or clinical practice.',
    sectionAbout:         'About',
    aboutDesign:          'Design',
    sectionAccount:       'Account',
    logOut:               'Log Out',
    logOutTitle:          'Log Out',
    logOutBody:           'Are you sure you want to log out?',
    cancel:               'Cancel',
    deleteAccount:        'Delete Account',
    deleteAccountTitle:   'Delete Account',
    deleteAccountBody:    'This will permanently delete your account and all data. Are you sure?',
    delete:               'Delete',
  },

  // ── Profile modal — questionnaires section ─────────────────────────────
  profileQuestionnaires: {
    sectionTitle:        'Questionnaires',
    start:               'Start',
    redo:                'Redo',
    notYetCompleted:     'Not yet completed',
    resultsAfter14:      'Results available after 14 days',
    completed:           'Completed',
    betaFootnote:        'These questionnaires are experimental. Scoring algorithms and interpretations are provided for informational purposes only and may not be fully accurate. Always verify results against validated published sources before use in research or clinical practice. Full licensing details are available under Settings → Questionnaire Credits.',
    redoTitle:           'Replace existing result?',
    redoBody:            'This will permanently overwrite your previous {{title}} result. Are you sure?',
    redoCancel:          'Cancel',
    redoConfirm:         'Continue',
  },

  // ── Questionnaire modal ──────────────────────────────────────────────────
  questionnaireModal: {
    back:            'Back',
    next:            'Next',
    finish:          'Finish',
    itemOf:          'Item {{current}} of {{total}}',
    allDone:         'All done!',
    pendingDesc:     'Your responses have been saved. Your {{shortTitle}} results will be available once you have completed 14 days of sleep diary entries.',
    done:            'Done',
    betaBanner:      'Beta — scoring and results are experimental and may not be fully accurate.',
  },

  // ── Daily questionnaire (diary entry flow) ───────────────────────────────
  questionnaire: {
    back:               'Back',
    next:               'Next',
    yes:                'Yes',
    no:                 'No',
    addMedicine:        'Add Medicine',
    addNewTime:         'Add New Time',
    medName:            'Name:',
    dose:               'Dose:',
    time:               'Time:',
    mgUnit:             'mg',
    dosePlaceholder:    'e.g. 5',
    medNamePlaceholder: 'Medication name',
    doseAndTime:        'Dose & Time',
    collapse:           'Collapse',
    hrs:                'hrs',
    min:                'min',
    saveErrorTitle:     'Could not save entry',
    saveErrorBody:      'Something went wrong saving your entry. Please try again.',
  },

  // ── Instructions slideshow ────────────────────────────────────────────────
  instructions: {
    close:      'Close',
    getStarted: 'Get Started',
    back:       'Back',
    next:       'Next',
    slides: [
      {
        title: 'What is a Sleep Diary?',
        body:  'A sleep diary is designed to gather information about your daily sleep patterns.',
      },
      {
        title: 'How often and when do I fill out the sleep diary?',
        body:  'It is necessary for you to complete your sleep diary every day (once after waking, once before bed). If possible, the sleep diary should be completed within one hour of getting out of bed in the morning. The Night Time Sleep Diary questions can be completed before you go to bed at night.',
      },
      {
        title: 'What should I do if I miss a day?',
        body:  'If you forget to fill in the diary or are unable to finish it, leave the diary blank for that day.',
      },
      {
        title: 'What if something unusual affects my sleep or how I feel in the daytime?',
        body:  'If your sleep or daytime functioning is affected by some unusual event (such as an illness, or an emergency) you may make brief notes on your diary.',
      },
      {
        title: 'What do the words "bed" and "day" mean on the diary?',
        body:  'This diary can be used for people who are awake or asleep at unusual times. In the sleep diary, the word "day" is the time when you choose or are required to be awake. The term "bed" means the place where you usually sleep.',
      },
      {
        title: 'Will answering these questions about my sleep keep me awake?',
        body:  'This is not usually a problem. You should not worry about giving exact times, and you should not watch the clock. Just give your best estimate.',
      },
      {
        title: 'Install Sleep Diaries on your device',
        body:  'On iPhone: open this page in Safari, tap the Share button ↑, and choose Add to Home Screen.\n\nOn Android: open in Chrome, tap the menu (⋮), and choose Add to Home Screen.\n\nOnce installed the app runs full-screen and works offline — just like a native app.',
      },
    ],
  },

  // ── Common ───────────────────────────────────────────────────────────────────────────
  common: {
    ok: 'OK',
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────────────
  tabs: {
    home:     'Home',
    entry:    'Diary',
    settings: 'Settings',
  },

  // ── Medications screen ───────────────────────────────────────────────────────────────
  medications: {
    title:           'My Medications',
    hint:            'Save your regular medications here. They will be pre-filled in your morning and evening diary entries so you don’t have to re-enter them each day.',
    empty:           'No medications saved yet. Tap the button below to add one.',
    namePlaceholder: 'Medication name',
    add:             'Add Medication',
  },
};
