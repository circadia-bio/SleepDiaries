/**
 * data/questionnaires.js — One-time research questionnaire definitions
 *
 * Each questionnaire object has the shape:
 *   {
 *     id:           string          — storage key suffix (e.g. 'ess')
 *     title:        string          — display title
 *     shortTitle:   string          — compact label for chips / badges
 *     instructions: string          — shown before the first item
 *     reference:    string          — citation string
 *     items: [
 *       {
 *         id:      string           — unique within the questionnaire
 *         number:  number|string    — display number
 *         text:    string           — question stem
 *         type:    string           — input type (see QuestionnaireModal)
 *         options?: [{ value, label }]
 *         min?:    number
 *         max?:    number
 *         unit?:   string
 *         defaultValue?: any
 *       }
 *     ],
 *     score:     (answers) => number|object   — computes score(s) from answers
 *     interpret: (score)   => { label, color, description }
 *   }
 *
 * Input types used across instruments:
 *   scale_0_3      — 4-option labelled scale (0–3)
 *   scale_0_4      — 5-option labelled scale (0–4), options per item
 *   scale_0_10     — 11-point slider-style scale (0–10)
 *   scale_1_10     — 10-option labelled scale (1–10)
 *   single_choice  — pick one from a list of labelled options with explicit values
 *   yes_no         — Yes / No
 *   frequency_3    — Rarely or never / Sometimes / Usually or always
 *   frequency_4    — Not during the past month / <once/week / 1–2×/week / ≥3×/week
 *   time           — HH:MM stepper
 *   duration_min   — integer minutes stepper
 *   number         — integer stepper with min/max/unit
 *
 * Adding a new questionnaire:
 *   1. Define it below following the same structure.
 *   2. Add it to the QUESTIONNAIRES array at the bottom.
 */

// ─── Shared option sets ────────────────────────────────────────────────────────

const SCALE_0_3 = [
  { value: 0, label: 'Would never doze' },
  { value: 1, label: 'Slight chance of dozing' },
  { value: 2, label: 'Moderate chance of dozing' },
  { value: 3, label: 'High chance of dozing' },
];

const FREQUENCY_3 = [
  { value: 0, label: 'Rarely or never' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Usually or always' },
];

const FREQUENCY_3_REV = [   // reverse-scored version
  { value: 2, label: 'Rarely or never' },
  { value: 1, label: 'Sometimes' },
  { value: 0, label: 'Usually or always' },
];

const FREQUENCY_4 = [
  { value: 0, label: 'Not during the past month' },
  { value: 1, label: 'Less than once a week' },
  { value: 2, label: 'Once or twice a week' },
  { value: 3, label: 'Three or more times a week' },
];

// ─── ESS ──────────────────────────────────────────────────────────────────────

export const ESS = {
  id:         'ess',
  title:      'Epworth Sleepiness Scale',
  shortTitle: 'ESS',
  credit:     'Johns, M. W. (1991). Sleep, 14(6), 540–545. © Murray W. Johns. Permission required for commercial use.',
  instructions:
    'How likely are you to doze off or fall asleep in the following situations, ' +
    'in contrast to feeling just tired? This refers to your usual way of life in ' +
    'recent times. Even if you have not done some of these things recently, try to ' +
    'work out how they would have affected you.',
  reference:
    'Johns, M. W. (1991). Sleep, 14(6), 540–545.',
  items: [
    { id: 'ess1', number: 1, text: 'Sitting and reading',                                            type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess2', number: 2, text: 'Watching TV',                                                    type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess3', number: 3, text: 'Sitting inactive in a public place (e.g. a theatre or meeting)', type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess4', number: 4, text: 'As a passenger in a car for an hour without a break',            type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess5', number: 5, text: 'Lying down to rest in the afternoon when circumstances permit',  type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess6', number: 6, text: 'Sitting and talking to someone',                                 type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess7', number: 7, text: 'Sitting quietly after a lunch without alcohol',                  type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess8', number: 8, text: 'In a car, while stopped for a few minutes in traffic',           type: 'scale_0_3', options: SCALE_0_3 },
  ],
  score: (answers) =>
    [1,2,3,4,5,6,7,8].reduce((s, n) => s + (answers[`ess${n}`] ?? 0), 0),
  interpret: (score) => {
    if (score <= 7)  return { label: 'Normal',    color: '#2E7D32', description: 'Your daytime sleepiness is within the normal range.' };
    if (score <= 9)  return { label: 'Borderline',color: '#F59E0B', description: 'Your score is at the borderline. Consider monitoring your sleep.' };
    if (score <= 15) return { label: 'Excessive', color: '#EA580C', description: 'You may be experiencing excessive daytime sleepiness. Consider discussing this with a clinician.' };
    return              { label: 'Severe',     color: '#DC2626', description: 'Your score indicates severe excessive daytime sleepiness. We recommend seeking medical advice.' };
  },
};

// ─── ISI ──────────────────────────────────────────────────────────────────────

export const ISI = {
  id:         'isi',
  title:      'Insomnia Severity Index',
  shortTitle: 'ISI',
  credit:     'Morin, C. M., et al. (2011). Sleep, 34(5), 601–608. © Charles M. Morin. Available for non-commercial research use.',
  instructions:
    'For each of the following questions, please rate the current severity of your ' +
    'insomnia problem over the past two weeks.',
  reference:
    'Morin, C. M., et al. (2011). Sleep, 34(5), 601–608.',
  items: [
    {
      id: 'isi1', number: 1, text: 'Difficulty falling asleep', type: 'scale_0_4',
      options: [{ value: 0, label: 'None' }, { value: 1, label: 'Mild' }, { value: 2, label: 'Moderate' }, { value: 3, label: 'Severe' }, { value: 4, label: 'Very severe' }],
    },
    {
      id: 'isi2', number: 2, text: 'Difficulty staying asleep', type: 'scale_0_4',
      options: [{ value: 0, label: 'None' }, { value: 1, label: 'Mild' }, { value: 2, label: 'Moderate' }, { value: 3, label: 'Severe' }, { value: 4, label: 'Very severe' }],
    },
    {
      id: 'isi3', number: 3, text: 'Problem waking up too early', type: 'scale_0_4',
      options: [{ value: 0, label: 'None' }, { value: 1, label: 'Mild' }, { value: 2, label: 'Moderate' }, { value: 3, label: 'Severe' }, { value: 4, label: 'Very severe' }],
    },
    {
      id: 'isi4', number: 4, text: 'How satisfied or dissatisfied are you with your current sleep pattern?', type: 'scale_0_4',
      options: [{ value: 0, label: 'Very satisfied' }, { value: 1, label: 'Satisfied' }, { value: 2, label: 'Neutral' }, { value: 3, label: 'Dissatisfied' }, { value: 4, label: 'Very dissatisfied' }],
    },
    {
      id: 'isi5', number: 5, text: 'To what extent do you consider your sleep problem to interfere with your daily functioning (e.g. daytime fatigue, concentration, mood)?', type: 'scale_0_4',
      options: [{ value: 0, label: 'Not at all' }, { value: 1, label: 'A little' }, { value: 2, label: 'Somewhat' }, { value: 3, label: 'Much' }, { value: 4, label: 'Very much' }],
    },
    {
      id: 'isi6', number: 6, text: 'How noticeable to others do you think your sleeping problem is in terms of impairing the quality of your life?', type: 'scale_0_4',
      options: [{ value: 0, label: 'Not at all noticeable' }, { value: 1, label: 'Barely' }, { value: 2, label: 'Somewhat' }, { value: 3, label: 'Much' }, { value: 4, label: 'Very much noticeable' }],
    },
    {
      id: 'isi7', number: 7, text: 'How worried or distressed are you about your current sleep problem?', type: 'scale_0_4',
      options: [{ value: 0, label: 'Not at all' }, { value: 1, label: 'A little' }, { value: 2, label: 'Somewhat' }, { value: 3, label: 'Much' }, { value: 4, label: 'Very much' }],
    },
  ],
  score: (answers) =>
    [1,2,3,4,5,6,7].reduce((s, n) => s + (answers[`isi${n}`] ?? 0), 0),
  interpret: (score) => {
    if (score <= 7)  return { label: 'No clinically significant insomnia', color: '#2E7D32', description: 'Your score suggests no clinically significant insomnia.' };
    if (score <= 14) return { label: 'Subthreshold insomnia',              color: '#F59E0B', description: 'Your score suggests subthreshold insomnia. Consider sleep hygiene strategies.' };
    if (score <= 21) return { label: 'Clinical insomnia (moderate)',        color: '#EA580C', description: 'Your score indicates moderate clinical insomnia. Consider seeking professional support.' };
    return              { label: 'Clinical insomnia (severe)',          color: '#DC2626', description: 'Your score indicates severe clinical insomnia. We recommend seeking medical advice.' };
  },
};

// ─── DBAS-16 ──────────────────────────────────────────────────────────────────

export const DBAS16 = {
  id:         'dbas16',
  beta:       true,
  title:      'Dysfunctional Beliefs and Attitudes about Sleep',
  shortTitle: 'DBAS-16',
  credit:     'Morin, C. M., Vallières, A., & Ivers, H. (2007). Sleep, 30(11), 1547–1554. © Charles M. Morin. Available via MAPI Research Trust for research use.',
  instructions:
    'Listed below are statements reflecting people\'s beliefs and attitudes about sleep. ' +
    'Please indicate to what extent you personally agree or disagree with each statement. ' +
    'There are no right or wrong answers. Use a scale from 0 (strongly disagree) to 10 (strongly agree).',
  reference:
    'Morin, C. M., Vallières, A., & Ivers, H. (2007). Sleep, 30(11), 1547–1554.',
  items: [
    { id: 'dbas1',  number: 1,  text: 'I need 8 hours of sleep to feel refreshed and function well during the day.', type: 'scale_0_10' },
    { id: 'dbas2',  number: 2,  text: 'When I don\'t get the proper amount of sleep on a given night, I need to catch up on the next day by napping or on the next night by sleeping longer.', type: 'scale_0_10' },
    { id: 'dbas3',  number: 3,  text: 'I am concerned that chronic insomnia may have serious consequences on my physical health.', type: 'scale_0_10' },
    { id: 'dbas4',  number: 4,  text: 'I am worried that I may lose control over my abilities to sleep.', type: 'scale_0_10' },
    { id: 'dbas5',  number: 5,  text: 'After a poor night\'s sleep, I know that it will interfere with my daily activities on the next day.', type: 'scale_0_10' },
    { id: 'dbas6',  number: 6,  text: 'In order to be alert and function well during the day, I believe I would be better off taking a sleeping pill rather than having a poor night\'s sleep.', type: 'scale_0_10' },
    { id: 'dbas7',  number: 7,  text: 'When I feel irritable, depressed, or anxious during the day, it is mostly because I did not sleep well the night before.', type: 'scale_0_10' },
    { id: 'dbas8',  number: 8,  text: 'When I sleep poorly on one night, I know it will disturb my sleep schedule for the whole week.', type: 'scale_0_10' },
    { id: 'dbas9',  number: 9,  text: 'Without an adequate night\'s sleep, I can hardly function the next day.', type: 'scale_0_10' },
    { id: 'dbas10', number: 10, text: 'I can\'t ever predict whether I\'ll have a good or poor night\'s sleep.', type: 'scale_0_10' },
    { id: 'dbas11', number: 11, text: 'I have little ability to manage the negative consequences of disturbed sleep.', type: 'scale_0_10' },
    { id: 'dbas12', number: 12, text: 'When I feel tired, have no energy, or just seem not to function well during the day, it is generally because I did not sleep well the night before.', type: 'scale_0_10' },
    { id: 'dbas13', number: 13, text: 'I believe insomnia is essentially the result of a chemical imbalance.', type: 'scale_0_10' },
    { id: 'dbas14', number: 14, text: 'I feel that insomnia is ruining my ability to enjoy life and prevents me from doing what I want.', type: 'scale_0_10' },
    { id: 'dbas15', number: 15, text: 'Medication is probably the only solution to sleeplessness.', type: 'scale_0_10' },
    { id: 'dbas16', number: 16, text: 'I avoid or cancel obligations (social, family) after a poor night\'s sleep.', type: 'scale_0_10' },
  ],
  score: (answers) => {
    const total = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
      .reduce((s, n) => s + (answers[`dbas${n}`] ?? 0), 0);
    return Math.round((total / 16) * 10) / 10; // mean item score, 1dp
  },
  interpret: (score) => {
    // score here is the mean item score (0–10)
    if (score <= 4) return { label: 'Within normal range', color: '#2E7D32', description: 'Your beliefs and attitudes about sleep are broadly within the normal range.' };
    return           { label: 'Clinically relevant',   color: '#EA580C', description: 'Your score suggests dysfunctional beliefs about sleep that may be worth exploring, particularly in the context of insomnia.' };
  },
};

// ─── KSS ──────────────────────────────────────────────────────────────────────

export const KSS = {
  id:         'kss',
  beta:       true,
  title:      'Karolinska Sleepiness Scale',
  shortTitle: 'KSS',
  credit:     'Åkerstedt, T., & Gillberg, M. (1990). International Journal of Neuroscience, 52(1–2), 29–37. Freely available for research use.',
  instructions:
    'Using the scale below, please indicate how sleepy you feel right now, at this moment.',
  reference:
    'Åkerstedt, T., & Gillberg, M. (1990). International Journal of Neuroscience, 52(1–2), 29–37.',
  items: [
    {
      id: 'kss1', number: 1, text: 'How sleepy do you feel right now?', type: 'scale_1_10',
      options: [
        { value: 1,  label: 'Extremely alert' },
        { value: 2,  label: 'Very alert' },
        { value: 3,  label: 'Alert' },
        { value: 4,  label: 'Rather alert' },
        { value: 5,  label: 'Neither alert nor sleepy' },
        { value: 6,  label: 'Some signs of sleepiness' },
        { value: 7,  label: 'Sleepy, but no difficulty remaining awake' },
        { value: 8,  label: 'Sleepy, some effort to keep alert' },
        { value: 9,  label: 'Very sleepy, great effort to keep alert, fighting sleep' },
        { value: 10, label: 'Extremely sleepy, cannot keep awake' },
      ],
    },
  ],
  score: (answers) => answers['kss1'] ?? 0,
  interpret: (score) => {
    if (score <= 5) return { label: 'Alert',            color: '#2E7D32', description: 'You are adequately alert for most tasks.' };
    if (score === 6) return { label: 'Onset of sleepiness', color: '#F59E0B', description: 'You are showing early signs of sleepiness. Caution is warranted for safety-critical tasks.' };
    if (score <= 8) return { label: 'Moderate sleepiness', color: '#EA580C', description: 'Moderate sleepiness — performance impairment is likely.' };
    return              { label: 'Severe sleepiness',  color: '#DC2626', description: 'Severe sleepiness — significant risk of performance failure. Avoid safety-critical tasks.' };
  },
};

// ─── MEQ ──────────────────────────────────────────────────────────────────────

export const MEQ = {
  id:         'meq',
  title:      'Morningness–Eveningness Questionnaire',
  shortTitle: 'MEQ',
  credit:     'Horne, J. A., & Östberg, O. (1976). International Journal of Chronobiology, 4(2), 97–110. In the public domain.',
  instructions:
    'Please read each question carefully before answering. Answer ALL questions. ' +
    'Each question should be answered independently of the others. ' +
    'Answer according to how you truly feel, not how you think you should feel.',
  reference:
    'Horne, J. A., & Östberg, O. (1976). International Journal of Chronobiology, 4(2), 97–110.',
  items: [
    {
      id: 'meq1', number: 1, text: 'Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?', type: 'single_choice',
      options: [{ value: 5, label: '5:00–6:30 AM' }, { value: 4, label: '6:30–7:45 AM' }, { value: 3, label: '7:45–9:45 AM' }, { value: 2, label: '9:45–11:00 AM' }, { value: 1, label: '11:00 AM–12:00 PM' }],
    },
    {
      id: 'meq2', number: 2, text: 'Considering only your own "feeling best" rhythm, at what time would you go to bed if you were entirely free to plan your evening?', type: 'single_choice',
      options: [{ value: 5, label: '8:00–9:00 PM' }, { value: 4, label: '9:00–10:15 PM' }, { value: 3, label: '10:15 PM–12:30 AM' }, { value: 2, label: '12:30–1:45 AM' }, { value: 1, label: '1:45–3:00 AM' }],
    },
    {
      id: 'meq3', number: 3, text: 'If there is a specific time at which you have to get up in the morning, to what extent do you depend on being woken by an alarm clock?', type: 'single_choice',
      options: [{ value: 4, label: 'Not at all dependent' }, { value: 3, label: 'Slightly dependent' }, { value: 2, label: 'Fairly dependent' }, { value: 1, label: 'Very dependent' }],
    },
    {
      id: 'meq4', number: 4, text: 'Assuming adequate environmental conditions, how easy do you find getting up in the morning?', type: 'single_choice',
      options: [{ value: 1, label: 'Not at all easy' }, { value: 2, label: 'Not very easy' }, { value: 3, label: 'Fairly easy' }, { value: 4, label: 'Very easy' }],
    },
    {
      id: 'meq5', number: 5, text: 'How alert do you feel during the first half hour after you wake up in the morning?', type: 'single_choice',
      options: [{ value: 1, label: 'Not at all alert' }, { value: 2, label: 'Slightly alert' }, { value: 3, label: 'Fairly alert' }, { value: 4, label: 'Very alert' }],
    },
    {
      id: 'meq6', number: 6, text: 'How is your appetite during the first half hour after you wake up in the morning?', type: 'single_choice',
      options: [{ value: 1, label: 'Very poor' }, { value: 2, label: 'Fairly poor' }, { value: 3, label: 'Fairly good' }, { value: 4, label: 'Very good' }],
    },
    {
      id: 'meq7', number: 7, text: 'During the first half hour after you wake up in the morning, how tired do you feel?', type: 'single_choice',
      options: [{ value: 1, label: 'Very tired' }, { value: 2, label: 'Fairly tired' }, { value: 3, label: 'Fairly refreshed' }, { value: 4, label: 'Very refreshed' }],
    },
    {
      id: 'meq8', number: 8, text: 'When you have no commitments the next day, at what time do you go to bed compared to your usual bedtime?', type: 'single_choice',
      options: [{ value: 4, label: 'Seldom or never later' }, { value: 3, label: 'Less than one hour later' }, { value: 2, label: '1–2 hours later' }, { value: 1, label: 'More than two hours later' }],
    },
    {
      id: 'meq9', number: 9, text: 'A friend suggests you exercise together between 7:00–8:00 AM twice a week. Bearing in mind only your "feeling best" rhythm, how do you think you would perform?', type: 'single_choice',
      options: [{ value: 4, label: 'Would be in good form' }, { value: 3, label: 'Would be in reasonable form' }, { value: 2, label: 'Would find it difficult' }, { value: 1, label: 'Would find it very difficult' }],
    },
    {
      id: 'meq10', number: 10, text: 'At what time in the evening do you feel tired and in need of sleep?', type: 'single_choice',
      options: [{ value: 5, label: '8:00–9:00 PM' }, { value: 4, label: '9:00–10:15 PM' }, { value: 3, label: '10:15 PM–12:45 AM' }, { value: 2, label: '12:45–2:00 AM' }, { value: 1, label: '2:00–3:00 AM' }],
    },
    {
      id: 'meq11', number: 11, text: 'You want to be at your peak for a 2-hour mentally exhausting test. Which testing time would you choose?', type: 'single_choice',
      options: [{ value: 6, label: '8:00–10:00 AM' }, { value: 4, label: '11:00 AM–1:00 PM' }, { value: 2, label: '3:00–5:00 PM' }, { value: 0, label: '7:00–9:00 PM' }],
    },
    {
      id: 'meq12', number: 12, text: 'If you went to bed at 11:00 PM, at what level of tiredness would you be?', type: 'single_choice',
      options: [{ value: 0, label: 'Not at all tired' }, { value: 2, label: 'A little tired' }, { value: 3, label: 'Fairly tired' }, { value: 5, label: 'Very tired' }],
    },
    {
      id: 'meq13', number: 13, text: 'You have gone to bed several hours later than usual, but there is no need to get up at any particular time the next morning. Which is most likely?', type: 'single_choice',
      options: [{ value: 4, label: 'Will wake up at usual time and will NOT fall asleep again' }, { value: 3, label: 'Will wake up at usual time and will doze thereafter' }, { value: 2, label: 'Will wake up at usual time but will fall asleep again' }, { value: 1, label: 'Will NOT wake up until later than usual' }],
    },
    {
      id: 'meq14', number: 14, text: 'One night you have to remain awake between 4:00–6:00 AM for a night watch. You have no commitments the next day. Which suits you best?', type: 'single_choice',
      options: [{ value: 1, label: 'Would NOT go to bed until watch was over' }, { value: 2, label: 'Would take a nap before and sleep after' }, { value: 3, label: 'Would take a good sleep before and nap after' }, { value: 4, label: 'Would take ALL sleep before watch' }],
    },
    {
      id: 'meq15', number: 15, text: 'You have to do two hours of hard physical work. Considering only your "feeling best" rhythm, which time would you choose?', type: 'single_choice',
      options: [{ value: 4, label: '8:00–10:00 AM' }, { value: 3, label: '11:00 AM–1:00 PM' }, { value: 2, label: '3:00–5:00 PM' }, { value: 1, label: '7:00–9:00 PM' }],
    },
    {
      id: 'meq16', number: 16, text: 'A friend suggests you exercise together between 10:00–11:00 PM twice a week. How well do you think you would perform?', type: 'single_choice',
      options: [{ value: 1, label: 'Would be in good form' }, { value: 2, label: 'Would be in reasonable form' }, { value: 3, label: 'Would find it difficult' }, { value: 4, label: 'Would find it very difficult' }],
    },
    {
      id: 'meq17', number: 17, text: 'Suppose you can choose your own work hours. You work a 5-hour day and are paid based on results. At approximately what time would you choose to begin?', type: 'single_choice',
      options: [{ value: 5, label: '5 hours starting at 4:00–8:00 AM' }, { value: 4, label: '5 hours starting at 8:00–9:00 AM' }, { value: 3, label: '5 hours starting at 9:00 AM–2:00 PM' }, { value: 2, label: '5 hours starting at 2:00–5:00 PM' }, { value: 1, label: '5 hours starting at 5:00 PM–4:00 AM' }],
    },
    {
      id: 'meq18', number: 18, text: 'At what time of the day do you think you reach your "feeling best" peak?', type: 'single_choice',
      options: [{ value: 5, label: '5:00–8:00 AM' }, { value: 4, label: '8:00–10:00 AM' }, { value: 3, label: '10:00 AM–5:00 PM' }, { value: 2, label: '5:00–10:00 PM' }, { value: 1, label: '10:00 PM–5:00 AM' }],
    },
    {
      id: 'meq19', number: 19, text: 'One hears about "morning" and "evening" types of people. Which ONE of these types do you consider yourself to be?', type: 'single_choice',
      options: [{ value: 6, label: 'Definitely a morning type' }, { value: 4, label: 'More a morning type than an evening type' }, { value: 2, label: 'More an evening type than a morning type' }, { value: 0, label: 'Definitely an evening type' }],
    },
  ],
  score: (answers) =>
    [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
      .reduce((s, n) => s + (answers[`meq${n}`] ?? 0), 0),
  interpret: (score) => {
    if (score >= 70) return { label: 'Definite morning type',   color: '#F59E0B', description: 'You are a definite morning type (early bird).' };
    if (score >= 59) return { label: 'Moderate morning type',   color: '#84CC16', description: 'You have a moderate preference for mornings.' };
    if (score >= 42) return { label: 'Intermediate type',       color: '#2E7D32', description: 'You have an intermediate chronotype — neither strongly morning nor evening.' };
    if (score >= 31) return { label: 'Moderate evening type',   color: '#6366F1', description: 'You have a moderate preference for evenings.' };
    return               { label: 'Definite evening type',    color: '#7C3AED', description: 'You are a definite evening type (night owl).' };
  },
};

// ─── PSQI ─────────────────────────────────────────────────────────────────────

export const PSQI = {
  id:         'psqi',
  maxScore:   21,
  title:      'Pittsburgh Sleep Quality Index',
  shortTitle: 'PSQI',
  credit:     'Buysse, D. J., et al. (1989). Psychiatry Research, 28(2), 193–213. © University of Pittsburgh. Permission required; contact the authors for research use.',
  instructions:
    'The following questions relate to your usual sleep habits during the past month only. ' +
    'Your answers should indicate the most accurate reply for the majority of days and nights in the past month.',
  reference:
    'Buysse, D. J., et al. (1989). Psychiatry Research, 28(2), 193–213.',
  items: [
    { id: 'psqi1',  number: 1,  text: 'During the past month, what time have you usually gone to bed at night?',                                             type: 'time',         defaultValue: { hour: 23, minute: 0 } },
    { id: 'psqi2',  number: 2,  text: 'During the past month, how long (in minutes) has it usually taken you to fall asleep each night?',                    type: 'duration_min', defaultValue: 20, min: 0, max: 180, unit: 'min' },
    { id: 'psqi3',  number: 3,  text: 'During the past month, what time have you usually gotten up in the morning?',                                         type: 'time',         defaultValue: { hour: 7, minute: 0 } },
    { id: 'psqi4',  number: 4,  text: 'During the past month, how many hours of actual sleep did you get at night? (This may differ from hours spent in bed.)', type: 'number',      defaultValue: 7, min: 0, max: 24, unit: 'hrs' },
    {
      id: 'psqi5a', number: '5a', text: 'During the past month, how often have you had trouble sleeping because you cannot get to sleep within 30 minutes?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5b', number: '5b', text: 'How often have you had trouble sleeping because you wake up in the middle of the night or early morning?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5c', number: '5c', text: 'How often have you had trouble sleeping because you have to get up to use the bathroom?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5d', number: '5d', text: 'How often have you had trouble sleeping because you cannot breathe comfortably?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5e', number: '5e', text: 'How often have you had trouble sleeping because you cough or snore loudly?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5f', number: '5f', text: 'How often have you had trouble sleeping because you feel too cold?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5g', number: '5g', text: 'How often have you had trouble sleeping because you feel too hot?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5h', number: '5h', text: 'How often have you had trouble sleeping because you had bad dreams?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi5i', number: '5i', text: 'How often have you had trouble sleeping because you have pain?', type: 'frequency_4', options: FREQUENCY_4,
    },
    // Note: PSQI item 5j ('other reason, please describe') is intentionally omitted.
    // It is a free-text field that does not contribute to any of the 7 component scores
    // and would require a text_input item outside the standard scoring algorithm.
    {
      id: 'psqi6',  number: 6,   text: 'During the past month, how often have you taken medicine to help you sleep (prescribed or over the counter)?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi7',  number: 7,   text: 'During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?', type: 'frequency_4', options: FREQUENCY_4,
    },
    {
      id: 'psqi8',  number: 8,   text: 'During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?', type: 'single_choice',
      options: [{ value: 0, label: 'No problem at all' }, { value: 1, label: 'Only a very slight problem' }, { value: 2, label: 'Somewhat of a problem' }, { value: 3, label: 'A very big problem' }],
    },
    {
      id: 'psqi9',  number: 9,   text: 'During the past month, how would you rate your sleep quality overall?', type: 'single_choice',
      options: [{ value: 0, label: 'Very good' }, { value: 1, label: 'Fairly good' }, { value: 2, label: 'Fairly bad' }, { value: 3, label: 'Very bad' }],
    },
  ],
  score: (answers) => {
    // C1 — Subjective sleep quality (Q9)
    const c1 = answers['psqi9'] ?? 0;

    // C2 — Sleep latency (Q2 + Q5a)
    const sol = answers['psqi2'] ?? 0;
    const solScore = sol <= 15 ? 0 : sol <= 30 ? 1 : sol <= 60 ? 2 : 3;
    const q5a = answers['psqi5a'] ?? 0;
    const c2raw = solScore + q5a;
    const c2 = c2raw === 0 ? 0 : c2raw <= 2 ? 1 : c2raw <= 4 ? 2 : 3;

    // C3 — Sleep duration (Q4, hours)
    const sd = answers['psqi4'] ?? 7;
    const c3 = sd >= 7 ? 0 : sd >= 6 ? 1 : sd >= 5 ? 2 : 3;

    // C4 — Habitual sleep efficiency (Q1, Q3, Q4)
    const bt = answers['psqi1'] ? answers['psqi1'].hour * 60 + answers['psqi1'].minute : 23 * 60;
    const wt = answers['psqi3'] ? answers['psqi3'].hour * 60 + answers['psqi3'].minute : 7 * 60;
    let tib = wt - bt; if (tib <= 0) tib += 1440;
    const hse = tib > 0 ? (sd / (tib / 60)) * 100 : 0;
    const c4 = hse >= 85 ? 0 : hse >= 75 ? 1 : hse >= 65 ? 2 : 3;

    // C5 — Sleep disturbances (Q5b–Q5i)
    const distItems = ['psqi5b','psqi5c','psqi5d','psqi5e','psqi5f','psqi5g','psqi5h','psqi5i'];
    const distSum = distItems.reduce((s, k) => s + (answers[k] ?? 0), 0);
    const c5 = distSum === 0 ? 0 : distSum <= 9 ? 1 : distSum <= 18 ? 2 : 3;

    // C6 — Use of sleeping medication (Q6)
    const c6 = answers['psqi6'] ?? 0;

    // C7 — Daytime dysfunction (Q7 + Q8)
    const c7raw = (answers['psqi7'] ?? 0) + (answers['psqi8'] ?? 0);
    const c7 = c7raw === 0 ? 0 : c7raw <= 2 ? 1 : c7raw <= 4 ? 2 : 3;

    return c1 + c2 + c3 + c4 + c5 + c6 + c7;
  },
  interpret: (score) => {
    if (score <= 4)  return { label: 'Good sleep quality',     color: '#2E7D32', description: 'Your score suggests good overall sleep quality.' };
    if (score <= 10) return { label: 'Poor sleep quality',     color: '#F59E0B', description: 'Your score suggests poor sleep quality. Consider sleep hygiene improvements or speaking with a clinician.' };
    return               { label: 'Severe sleep difficulties', color: '#DC2626', description: 'Your score indicates severe sleep difficulties. We recommend seeking medical advice.' };
  },
};

// ─── RU-SATED ─────────────────────────────────────────────────────────────────

const RUSATED_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Always' },
];

export const RUSATED = {
  id:         'rusated',
  maxScore:   24,
  title:      'Ru-SATED Sleep Health Scale',
  shortTitle: 'RU-SATED',
  credit:     'Buysse, D. J. (2014). Sleep, 37(1), 9–17. © 2016 University of Pittsburgh. May not be used without permission.',
  instructions:
    'The following statements refer to your sleep during the past one month. Please indicate the best ' +
    'response for each statement. “Night” refers to the time you get your longest sleep of the day, which ' +
    'may not be when it is dark out. “Day” refers to the time of day when you are usually awake. ' +
    '“Sleep” refers to the longest period of sleep you have in a 24-hour day.',
  reference:
    'Buysse, D. J. (2014). Sleep, 37(1), 9–17.',
  items: [
    { id: 'rus1', number: 1, text: 'I go to sleep and wake up at about the same time every day.',                                                      type: 'single_choice', options: RUSATED_OPTIONS },
    { id: 'rus2', number: 2, text: 'I sleep 7–9 hours per night.',                                                                                      type: 'single_choice', options: RUSATED_OPTIONS },
    { id: 'rus3', number: 3, text: 'The middle of my sleep period is between 2:00 AM and 4:00 AM.',                                                       type: 'single_choice', options: RUSATED_OPTIONS },
    { id: 'rus4', number: 4, text: 'I am awake for less than 30 minutes between the time I go to bed and the time I get out of bed.',                     type: 'single_choice', options: RUSATED_OPTIONS },
    { id: 'rus5', number: 5, text: 'I stay awake all day without dozing.',                                                                                type: 'single_choice', options: RUSATED_OPTIONS },
    { id: 'rus6', number: 6, text: 'I am satisfied with my sleep.',                                                                                       type: 'single_choice', options: RUSATED_OPTIONS },
  ],
  score: (answers) =>
    [1,2,3,4,5,6].reduce((s, n) => s + (answers[`rus${n}`] ?? 0), 0),
  interpret: (score) => {
    if (score >= 17) return { label: 'Good sleep health',     color: '#2E7D32', description: 'Your score suggests good multidimensional sleep health.' };
    if (score >= 9)  return { label: 'Moderate sleep health', color: '#F59E0B', description: 'Your score suggests moderate sleep health. There may be room for improvement.' };
    return               { label: 'Poor sleep health',      color: '#DC2626', description: 'Your score suggests poor sleep health across multiple dimensions. Consider speaking with a clinician.' };
  },
};

// ─── STOP-BANG ────────────────────────────────────────────────────────────────

export const STOPBANG = {
  id:         'stopbang',
  title:      'STOP-BANG Questionnaire',
  shortTitle: 'STOP-BANG',
  credit:     'Chung, F., et al. (2016). Chest, 149(3), 631–638. © University Health Network, Toronto. Freely available for clinical and non-commercial research use (stopbang.ca).',
  instructions:
    'Please answer YES or NO to each of the following questions. ' +
    'This questionnaire screens for the risk of obstructive sleep apnoea.',
  reference:
    'Chung, F., et al. (2016). Chest, 149(3), 631–638.',
  items: [
    { id: 'sb_s', number: 'S', text: 'Do you snore loudly (louder than talking or loud enough to be heard through closed doors)?',                             type: 'yes_no' },
    { id: 'sb_t', number: 'T', text: 'Do you often feel tired, fatigued, or sleepy during the daytime?',                                                      type: 'yes_no' },
    { id: 'sb_o', number: 'O', text: 'Has anyone observed you stop breathing, or choking/gasping, during your sleep?',                                        type: 'yes_no' },
    { id: 'sb_p', number: 'P', text: 'Do you have or are you being treated for high blood pressure?',                                                         type: 'yes_no' },
    { id: 'sb_b', number: 'B', text: 'Is your BMI greater than 35 kg/m²?',                                                                                    type: 'yes_no' },
    { id: 'sb_a', number: 'A', text: 'Are you older than 50 years?',                                                                                          type: 'yes_no' },
    { id: 'sb_n', number: 'N', text: 'Is your neck circumference greater than 40 cm (measured at the level of the cricothyroid membrane)?',                   type: 'yes_no' },
    { id: 'sb_g', number: 'G', text: 'Are you male?',                                                                                                         type: 'yes_no' },
  ],
  score: (answers) =>
    ['sb_s','sb_t','sb_o','sb_p','sb_b','sb_a','sb_n','sb_g']
      .reduce((s, k) => s + (answers[k] === 'yes' ? 1 : 0), 0),
  interpret: (score) => {
    if (score <= 2) return { label: 'Low OSA risk',          color: '#2E7D32', description: 'Your score suggests a low risk for obstructive sleep apnoea.' };
    if (score <= 4) return { label: 'Intermediate OSA risk', color: '#F59E0B', description: 'Your score suggests an intermediate risk for obstructive sleep apnoea. Consider further evaluation.' };
    return              { label: 'High OSA risk',           color: '#DC2626', description: 'Your score suggests a high risk for obstructive sleep apnoea. We recommend seeking medical evaluation.' };
  },
};

// ─── MCTQ ─────────────────────────────────────────────────────────────────────

export const MCTQ = {
  id:         'mctq',
  beta:       true,
  title:      'Munich Chronotype Questionnaire',
  shortTitle: 'MCTQ',
  credit:     'Roenneberg, T., et al. (2003). Journal of Biological Rhythms, 18(1), 80–90. © Till Roenneberg, LMU Munich. Free for non-commercial research; contact thewep.org for permission.',
  instructions:
    'Please answer the following questions about your typical sleep behaviour on workdays ' +
    'and on free days (days without work, school, or early appointments). ' +
    'Answer for the most common pattern in the past four weeks.',
  reference:
    'Roenneberg, T., et al. (2003). Journal of Biological Rhythms, 18(1), 80–90.',
  items: [
    { id: 'mctq_wd',   number: 'C1', text: 'How many days per week do you work or have mandatory social commitments?',           type: 'number',      defaultValue: 5, min: 0, max: 7, unit: 'days/week' },
    { id: 'mctq_bt_w', number: 'A2', text: 'Workdays — What time do you usually go to bed? (when you turn off the lights to sleep)', type: 'time',     defaultValue: { hour: 23, minute: 0 } },
    { id: 'mctq_sl_w', number: 'A3', text: 'Workdays — How many minutes does it usually take you to fall asleep?',               type: 'duration_min', defaultValue: 15, min: 0, max: 120, unit: 'min' },
    { id: 'mctq_wt_w', number: 'A4', text: 'Workdays — What time do you usually wake up?',                                       type: 'time',         defaultValue: { hour: 7, minute: 0 } },
    { id: 'mctq_bt_f', number: 'B1', text: 'Free days — What time do you usually go to bed?',
      // Note: bedtimes before noon are treated as post-midnight (e.g. 01:00 AM).
      // This assumption covers the vast majority of sleep schedules but would
      // misinterpret a genuine late-morning bedtime (e.g. 11:00 AM shift worker).
      hint: 'If you go to bed after midnight, simply enter the time as shown — e.g. 01:30 for half past one in the morning.',
      type: 'time', defaultValue: { hour: 0, minute: 0 } },
    { id: 'mctq_sl_f', number: 'B2', text: 'Free days — How many minutes does it usually take you to fall asleep?',              type: 'duration_min', defaultValue: 15, min: 0, max: 120, unit: 'min' },
    { id: 'mctq_wt_f', number: 'B4', text: 'Free days — What time do you usually wake up?',                                      type: 'time',         defaultValue: { hour: 8, minute: 30 } },
  ],
  score: (answers) => {
    // All times converted to decimal hours (post-midnight times expressed as >24h)
    const toH = (t) => {
      if (!t) return null;
      let h = t.hour + t.minute / 60;
      return h; // caller handles wrap
    };

    const wd = answers['mctq_wd'] ?? 5;
    const fd = 7 - wd;

    // Workday sleep onset & duration
    let bt_w = toH(answers['mctq_bt_w'] ?? { hour: 23, minute: 0 });
    const sl_w = (answers['mctq_sl_w'] ?? 15) / 60;
    let so_w = bt_w + sl_w;
    let wt_w = toH(answers['mctq_wt_w'] ?? { hour: 7, minute: 0 });
    if (wt_w < so_w - 12) wt_w += 24; // handle midnight wrap
    if (wt_w <= so_w) wt_w += 24;
    const sd_w = wt_w - so_w;
    const msw = so_w + sd_w / 2;

    // Free day sleep onset & duration
    let bt_f = toH(answers['mctq_bt_f'] ?? { hour: 0, minute: 0 });
    if (bt_f < 12) bt_f += 24; // treat early-AM bedtimes as post-midnight
    const sl_f = (answers['mctq_sl_f'] ?? 15) / 60;
    let so_f = bt_f + sl_f;
    let wt_f = toH(answers['mctq_wt_f'] ?? { hour: 8, minute: 30 });
    if (wt_f < 12) wt_f += 24;
    if (wt_f <= so_f) wt_f += 24;
    const sd_f = wt_f - so_f;
    const msf = so_f + sd_f / 2;

    // Sleep debt correction
    const sd_week = wd > 0 || fd > 0 ? (sd_w * wd + sd_f * fd) / 7 : sd_f;
    const deficit = sd_week - sd_w;
    const msf_sc = deficit > 0 ? msf - deficit / 2 : msf;

    // Social jetlag
    const sjl = Math.abs(msf - msw);

    // Normalise MSFsc to 0–24 clock range
    let chronoH = msf_sc % 24;
    if (chronoH < 0) chronoH += 24;

    return { msf_sc: Math.round(chronoH * 100) / 100, sjl: Math.round(sjl * 100) / 100 };
  },
  interpret: (score) => {
    // score is { msf_sc, sjl }
    const h = typeof score === 'object' ? score.msf_sc : score;
    let label, color, description;
    if (h < 0.5)      { label = 'Extremely early chronotype'; color = '#F59E0B'; description = `Your mid-sleep on free days (corrected) is at ${fmtH(h)}, indicating an extremely early chronotype.`; }
    else if (h < 2.5) { label = 'Early chronotype';           color = '#84CC16'; description = `Your mid-sleep on free days (corrected) is at ${fmtH(h)}, indicating an early chronotype.`; }
    else if (h < 3.5) { label = 'Intermediate chronotype';    color = '#2E7D32'; description = `Your mid-sleep on free days (corrected) is at ${fmtH(h)}, indicating an intermediate chronotype.`; }
    else if (h < 5.5) { label = 'Late chronotype';            color = '#6366F1'; description = `Your mid-sleep on free days (corrected) is at ${fmtH(h)}, indicating a late chronotype.`; }
    else               { label = 'Extremely late chronotype'; color = '#7C3AED'; description = `Your mid-sleep on free days (corrected) is at ${fmtH(h)}, indicating an extremely late chronotype.`; }

    if (typeof score === 'object' && score.sjl !== undefined) {
      const sjlStr = score.sjl < 1 ? 'low' : score.sjl < 2 ? 'moderate' : 'high';
      description += ` Your social jetlag is ${score.sjl.toFixed(1)} h (${sjlStr}).`;
    }
    return { label, color, description };
  },
};

// Helper used inside MCTQ interpret
function fmtH(h) {
  const hh = Math.floor(h % 24);
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

// ─── Registry ──────────────────────────────────────────────────────────────────

export const QUESTIONNAIRES = [ESS, ISI, DBAS16, MEQ, PSQI, RUSATED, STOPBANG, MCTQ];

export const getQuestionnaire = (id) => QUESTIONNAIRES.find((q) => q.id === id) ?? null;
