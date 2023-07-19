import cloneDeep from 'lodash/cloneDeep';

export const themeImages = {
  standard: {
    card: 'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/standard-quiz-card.svg',
    editor:
      'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/standard-quiz-editor.svg',
    play: 'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/standard-quiz-play.svg',
  },
  mainland: {
    play: 'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/mainstream-quiz-play.svg',
  },
};

export const defOption = {
  id: 1,
  label: '',
  options: [],
};
export const optionImage = {
  circle:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/circle.svg',
  spade:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/spade.svg',
  square:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/square.svg',
  pentagon:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/pentagon.svg',
  hexagon:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/hexagon.svg',
  triangle:
    'https://koxqonvbkeakwvmdegcf.supabase.co/storage/v1/object/public/avatars/quizes/triangle.svg',
};

export const allOptions = [
  {
    id: 'circle',
    label: '',
    isCorrect: false,
  },
  {
    id: 'triangle',
    label: '',
    isCorrect: false,
  },
  {
    id: 'spade',
    label: '',
    isCorrect: false,
  },
  {
    id: 'square',
    label: '',
    isCorrect: false,
  },
  {
    id: 'pentagon',
    label: '',
    isCorrect: false,
  },
  {
    id: 'hexagon',
    label: '',
    isCorrect: false,
  },
];
export const booleanOptions = [
  {
    id: 'triangle',
    label: 'True',
    isCorrect: false,
  },
  {
    id: 'square',
    label: 'False',
    isCorrect: false,
  },
];
export const allThemes = [
  {
    id: 'standard',
    label: 'Standard',
  },
  {
    id: 'mainland',
    label: 'Mainland Bridge',
  },
];

export const defQuestion = {
  id: new Date().getTime(),
  title: '',
  type: 'multichoice',
  options: [],
  timelimit: '10s',
};

export const STEPS = {
  CONNECT_TO_PLAY: 'CONNECT_TO_PLAY',
  WAIT_FOR_PLAYERS: 'WAIT_FOR_PLAYERS',
  SHOW_NEXT_QUESTION: 'SHOW_NEXT_QUESTION',
  SCOREBOARD: 'SCOREBOARD',
  PODIUM: 'PODIUM',
};

export const STUDENTS_PLAY_STEPS = {
  PIN_SETUP: 'PIN_SETUP',
  QUESTION: 'QUESTION',
  SCOREBOARD: 'SCOREBOARD',
  PODIUM: 'PODIUM',
};
