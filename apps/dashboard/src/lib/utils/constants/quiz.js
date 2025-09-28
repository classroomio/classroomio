import cloneDeep from 'lodash/cloneDeep';

export const themeImages = {
  standard: {
    card: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/standard-quiz-card.svg',
    editor:
      'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/standard-quiz-editor.svg',
    play: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/standard-quiz-play.svg'
  },
  mainland: {
    card: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/mainstream-quiz-card.svg',
    editor:
      'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/mainstream-quiz-editor.svg',
    play: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/mainstream-quiz-play.svg'
  }
};

export const defOption = {
  id: 1,
  label: '',
  options: []
};

export const optionImage = {
  circle: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/circle.svg',
  spade: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/spade.svg',
  square: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/square.svg',
  pentagon: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/pentagon.svg',
  hexagon: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/hexagon.svg',
  triangle: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/triangle.svg'
};

export const allOptions = [
  {
    id: 'circle',
    label: '',
    isCorrect: false
  },
  {
    id: 'triangle',
    label: '',
    isCorrect: false
  },
  {
    id: 'spade',
    label: '',
    isCorrect: false
  },
  {
    id: 'square',
    label: '',
    isCorrect: false
  },
  {
    id: 'pentagon',
    label: '',
    isCorrect: false
  },
  {
    id: 'hexagon',
    label: '',
    isCorrect: false
  }
];
export const booleanOptions = [
  {
    id: 'triangle',
    label: 'True',
    image: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/triangle.svg'
  },
  {
    id: 'square',
    label: 'False',
    image: 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/quizes/square.svg'
  }
];
export const allThemes = [
  {
    id: 'standard',
    label: 'Standard'
  },
  {
    id: 'mainland',
    label: 'Mainland Bridge'
  }
];

export const defQuestion = {
  id: new Date().getTime(),
  title: '',
  type: 'multichoice',
  options: [],
  timelimit: '10s'
};

export const STEPS = {
  CONNECT_TO_PLAY: 'CONNECT_TO_PLAY',
  WAIT_FOR_PLAYERS: 'WAIT_FOR_PLAYERS',
  SHOW_NEXT_QUESTION: 'SHOW_NEXT_QUESTION',
  SCOREBOARD: 'SCOREBOARD',
  PODIUM: 'PODIUM'
};
