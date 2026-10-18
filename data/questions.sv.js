/**
 * Swedish translations of this app's daily diary. This is an app translation,
 * not a validated Swedish Consensus Sleep Diary instrument. Keep IDs, response
 * values, numeric definitions and all clinical research instruments unchanged.
 */
export const MORNING_QUESTIONS_SV = [
  { id: 'mq1', text: 'Vilken tid lade du dig i sängen i går kväll?' },
  { id: 'mq2', text: 'Vilken tid försökte du somna?' },
  { id: 'mq3', text: 'Hur lång tid tog det att somna?' },
  { id: 'mq4', text: 'Vaknade du under natten?' },
  { id: 'mq4b', text: 'Hur många gånger vaknade du?', unit: 'gånger' },
  { id: 'mq5', text: 'Hur länge var du vaken sammanlagt under natten?' },
  { id: 'mq6', text: 'Vilken tid vaknade du för sista gången?' },
  { id: 'mq7', text: 'Vilken tid steg du upp för dagen?' },
  { id: 'mq8', text: 'Vaknade du tidigare än du hade planerat?' },
  { id: 'mq8b', text: 'Hur mycket tidigare vaknade du?' },
  {
    id: 'mq9', text: 'Hur många glas alkohol drack du i går?',
    hint: '1 glas = 355 ml öl, 150 ml vin eller 45 ml sprit', unit: 'glas',
  },
  { id: 'mq10', text: 'Använde du något för att underlätta sömnen (läkemedel, kosttillskott eller liknande)?' },
  { id: 'mq10b', text: 'Vad använde du för att lättare kunna sova?' },
  {
    id: 'mq11', text: 'Hur bedömer du kvaliteten på din sömn?',
    options: [
      { value: 1, label: 'Mycket dålig' },
      { value: 2, label: 'Dålig' },
      { value: 3, label: 'Varken bra eller dålig' },
      { value: 4, label: 'Bra' },
      { value: 5, label: 'Mycket bra' },
    ],
  },
  {
    id: 'mq12', text: 'Hur utvilad kände du dig när du vaknade för dagen?',
    options: [
      { value: 1, label: 'Inte alls utvilad' },
      { value: 2, label: 'Lite utvilad' },
      { value: 3, label: 'Ganska utvilad' },
      { value: 4, label: 'Väl utvilad' },
      { value: 5, label: 'Mycket väl utvilad' },
    ],
  },
  { id: 'mq13', text: 'Kommentarer (valfritt)', placeholder: 'Anteckningar om din sömn i natt …' },
];

export const EVENING_QUESTIONS_SV = [
  { id: 'eq1', text: 'Tog du en tupplur i dag?' },
  { id: 'eq1b', text: 'Hur länge sov du under tuppluren?' },
  { id: 'eq2', text: 'Hur många koffeinhaltiga drycker drack du i dag?', unit: 'drycker' },
  { id: 'eq3', text: 'Motionerade du i dag?' },
  { id: 'eq4', text: 'Använde du något läkemedel för att lättare kunna sova?' },
  { id: 'eq4b', text: 'Vilket läkemedel använder du för att lättare kunna sova?' },
  { id: 'eq5', text: 'Kommentarer (valfritt)', placeholder: 'Anteckningar om din dag …' },
];
