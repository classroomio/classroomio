export const STATUS = {
  PENDING: 0,
  IN_PROGRESS: 1,
  GRADED: 2,
};

export const SELECTABLE_STATUS = [
  {
    label: 'Submitted',
    value: STATUS.PENDING,
  },
  {
    label: 'In progress',
    value: STATUS.IN_PROGRESS,
  },
  {
    label: 'Graded',
    value: STATUS.GRADED,
  },
];
