/**
 * data/questions.pt-BR.js — Portuguese (Brazil) question text
 *
 * Mirrors the structure of questions.js but only carries the translatable
 * fields: text, options[].label, placeholder, unit.
 *
 * The questionnaire screen merges these overrides at runtime when the locale
 * is pt-BR (or pt), so IDs, types, defaults, and conditional logic stay
 * in the single source of truth (questions.js).
 */

export const MORNING_QUESTIONS_PT_BR = [
  { id: 'mq1',  text: 'A que horas foi para a cama ontem à noite?' },
  { id: 'mq2',  text: 'A que horas tentou adormecer?' },
  { id: 'mq3',  text: 'Quanto tempo demorou a adormecer?' },
  { id: 'mq4',  text: 'Acordou durante a noite?' },
  { id: 'mq4b', text: 'Quantas vezes acordou?', unit: 'vezes' },
  { id: 'mq5',  text: 'Quanto tempo esteve acordado(a) durante a noite no total?' },
  { id: 'mq6',  text: 'A que horas acordou definitivamente?' },
  { id: 'mq7',  text: 'A que horas se levantou da cama?' },
  { id: 'mq8',  text: 'Acordou mais cedo do que planeava?' },
  { id: 'mq8b', text: 'Quanto mais cedo acordou?' },
  { id: 'mq9',  text: 'Quantas bebidas alcoólicas consumiu ontem?', unit: 'bebidas' },
  { id: 'mq10', text: 'Usou algum auxiliar de sono (medicamento, suplemento, etc.)?' },
  { id: 'mq10b',text: 'O que usou para o(a) ajudar a dormir?' },
  {
    id: 'mq11',
    text: 'Como avalia a qualidade do seu sono?',
    options: [
      { value: 1, label: 'Muito mau' },
      { value: 2, label: 'Mau' },
      { value: 3, label: 'Razoável' },
      { value: 4, label: 'Bom' },
      { value: 5, label: 'Muito bom' },
    ],
  },
  {
    id: 'mq12',
    text: 'Como se sentiu ao acordar?',
    options: [
      { value: 1, label: 'Nada descansado(a)' },
      { value: 2, label: 'Pouco descansado(a)' },
      { value: 3, label: 'Razoavelmente descansado(a)' },
      { value: 4, label: 'Descansado(a)' },
      { value: 5, label: 'Muito descansado(a)' },
    ],
  },
  { id: 'mq13', text: 'Comentários (opcional)', placeholder: 'Notas sobre o seu sono desta noite...' },
];

export const EVENING_QUESTIONS_PT_BR = [
  { id: 'eq1',  text: 'Fez uma sesta hoje?' },
  { id: 'eq1b', text: 'Quanto tempo durou a sesta?' },
  { id: 'eq2',  text: 'Quantas bebidas com cafeína consumiu hoje?', unit: 'bebidas' },
  { id: 'eq3',  text: 'Fez exercício físico hoje?' },
  { id: 'eq4',  text: 'Usou algum medicamento para o(a) ajudar a dormir?' },
  { id: 'eq4b', text: 'Que medicamento usa para o(a) ajudar a dormir?' },
  { id: 'eq5',  text: 'Comentários (opcional)', placeholder: 'Notas sobre o seu dia...' },
];
