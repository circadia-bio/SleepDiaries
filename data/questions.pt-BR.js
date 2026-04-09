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
  { id: 'mq1',  text: 'Que horas você foi para a cama ontem à noite?' },
  { id: 'mq2',  text: 'Que horas você tentou dormir?' },
  { id: 'mq3',  text: 'Quanto tempo você levou para adormecer?' },
  { id: 'mq4',  text: 'Você acordou durante a noite?' },
  { id: 'mq4b', text: 'Quantas vezes você acordou?', unit: 'vezes' },
  { id: 'mq5',  text: 'Quanto tempo no total você ficou acordado(a) durante a noite?' },
  { id: 'mq6',  text: 'Que horas você acordou de vez?' },
  { id: 'mq7',  text: 'Que horas você se levantou da cama?' },
  { id: 'mq8',  text: 'Você acordou mais cedo do que planejava?' },
  { id: 'mq8b', text: 'Quanto mais cedo você acordou?' },
  { id: 'mq9',  text: 'Quantas doses de álcool você consumiu ontem?', unit: 'doses' },
  { id: 'mq10', text: 'Você usou algum auxiliar de sono (medicamento, suplemento, etc.)?' },
  { id: 'mq10b',text: 'O que você usou para ajudar a dormir?' },
  {
    id: 'mq11',
    text: 'Como você avalia a qualidade do seu sono?',
    options: [
      { value: 1, label: 'Muito ruim' },
      { value: 2, label: 'Ruim' },
      { value: 3, label: 'Regular' },
      { value: 4, label: 'Bom' },
      { value: 5, label: 'Muito bom' },
    ],
  },
  {
    id: 'mq12',
    text: 'Como você se sentiu ao acordar?',
    options: [
      { value: 1, label: 'Nada descansado(a)' },
      { value: 2, label: 'Pouco descansado(a)' },
      { value: 3, label: 'Mais ou menos descansado(a)' },
      { value: 4, label: 'Descansado(a)' },
      { value: 5, label: 'Muito descansado(a)' },
    ],
  },
  { id: 'mq13', text: 'Comentários (opcional)', placeholder: 'Observações sobre seu sono esta noite...' },
];

export const EVENING_QUESTIONS_PT_BR = [
  { id: 'eq1',  text: 'Você tirou uma soneca hoje?' },
  { id: 'eq1b', text: 'Quanto tempo durou a soneca?' },
  { id: 'eq2',  text: 'Quantas bebidas com cafeína você tomou hoje?', unit: 'bebidas' },
  { id: 'eq3',  text: 'Você se exercitou hoje?' },
  { id: 'eq4',  text: 'Você usou algum medicamento para ajudar a dormir?' },
  { id: 'eq4b', text: 'Que medicamento você usa para ajudar a dormir?' },
  { id: 'eq5',  text: 'Comentários (opcional)', placeholder: 'Observações sobre seu dia...' },
];
