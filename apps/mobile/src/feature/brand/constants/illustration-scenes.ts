export type IllustrationName =
  | 'courses'
  | 'calendar'
  | 'certificate'
  | 'questions'
  | 'notifications'
  | 'downloads'
  | 'grading'
  | 'offline';

/**
 * Stroke classes from the design system's Machines: `ln` face-filled hairline, `lo` open hairline, `lt` faint
 * hairline, `dash` dashed hairline, `ink` face-filled accent, `ko` open accent, `kf` accent fill, `dot` hairline fill.
 */
export type ShapeClass = 'ln' | 'lo' | 'lt' | 'dash' | 'ink' | 'ko' | 'kf' | 'dot';

export type Shape =
  | { kind: 'polygon'; cls: ShapeClass; points: string }
  | { kind: 'path'; cls: ShapeClass; d: string }
  | { kind: 'circle'; cls: ShapeClass; cx: number; cy: number; r: number }
  | { kind: 'rect'; cls: ShapeClass; x: number; y: number; width: number; height: number; rx?: number }
  | { kind: 'group'; transform: string; children: Shape[] };

/** Offsets are fractions of the scene's width and height; the scene is drawn at the motion's resting pose. */
export type SceneMotion =
  | { kind: 'bob'; distance: number; duration: number }
  | { kind: 'drop'; distance: number; duration: number }
  | { kind: 'press'; distance: number; duration: number }
  | { kind: 'swing'; angle: number; originX: number; originY: number; duration: number }
  | { kind: 'travel'; dx: number; dy: number; duration: number };

export type SceneLayer = { shapes: Shape[]; motion?: SceneMotion };

export type Scene = { width: number; height: number; layers: SceneLayer[] };

const COS = 0.8660254;
const SIN = 0.5;
const WIDTH = 180;
const HEIGHT = 140;

type Point = [number, number];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function project(origin: Point, x: number, y: number, z: number): Point {
  return [round(origin[0] + (x - y) * COS), round(origin[1] + (x + y) * SIN - z)];
}

function points(origin: Point, corners: [number, number, number][]) {
  return corners.map(([x, y, z]) => project(origin, x, y, z).join(',')).join(' ');
}

function polygon(cls: ShapeClass, origin: Point, corners: [number, number, number][]): Shape {
  return { kind: 'polygon', cls, points: points(origin, corners) };
}

function line(cls: ShapeClass, origin: Point, from: [number, number, number], to: [number, number, number]): Shape {
  const [x1, y1] = project(origin, ...from);
  const [x2, y2] = project(origin, ...to);

  return { kind: 'path', cls, d: `M${x1} ${y1} L${x2} ${y2}` };
}

/** An isometric box: the two visible side faces and the top. */
function box(
  origin: Point,
  [x, y, z]: [number, number, number],
  [w, d, h]: [number, number, number],
  cls: ShapeClass = 'ln'
): Shape[] {
  return [
    polygon(cls, origin, [
      [x, y + d, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x, y + d, z + h]
    ]),
    polygon(cls, origin, [
      [x + w, y, z],
      [x + w, y + d, z],
      [x + w, y + d, z + h],
      [x + w, y, z + h]
    ]),
    polygon(cls, origin, [
      [x, y, z + h],
      [x + w, y, z + h],
      [x + w, y + d, z + h],
      [x, y + d, z + h]
    ])
  ];
}

function matrix(a: number, b: number, c: number, d: number, [e, f]: Point) {
  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;
}

/** Local x runs along the box's x axis and local y along its y axis. */
function onTop(origin: Point, x: number, y: number, z: number, children: Shape[]): Shape {
  return { kind: 'group', transform: matrix(COS, SIN, -COS, SIN, project(origin, x, y, z)), children };
}

/** The face that looks down-left; local x runs along the box's x axis and local y runs down. */
function onLeft(origin: Point, x: number, y: number, z: number, children: Shape[]): Shape {
  return { kind: 'group', transform: matrix(COS, SIN, 0, 1, project(origin, x, y, z)), children };
}

function offset(dx: number, dy: number) {
  return { dx: Math.round((dx / WIDTH) * 1000) / 1000, dy: Math.round((dy / HEIGHT) * 1000) / 1000 };
}

function coursesScene(): Scene {
  const o: Point = [90, 52];
  const base = [
    ...box(o, [-6, -6, -16], [72, 72, 8]),
    onTop(o, -6, -6, -8, [{ kind: 'rect', cls: 'dash', x: 22, y: 22, width: 28, height: 28, rx: 2 }]),
    ...box(o, [-2, 44, -8], [22, 22, 14]),
    onLeft(o, -2, 66, 6, [{ kind: 'path', cls: 'lo', d: 'M5 5 H17 M5 9 H13' }])
  ];
  const block = [
    ...box(o, [16, 16, -8], [28, 28, 14], 'ink'),
    onLeft(o, 16, 44, 6, [{ kind: 'path', cls: 'ko', d: 'M11 3.5 L18 7 L11 10.5 Z' }])
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: block, motion: { kind: 'drop', distance: 0.16, duration: 7000 } }]
  };
}

function calendarScene(): Scene {
  const o: Point = [92, 50];
  const cells: Shape[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (row === 1 && col === 2) continue;
      cells.push({ kind: 'rect', cls: 'lo', x: 10 + col * 14, y: 14 + row * 14, width: 10, height: 10, rx: 1.5 });
    }
  }
  const base = [
    ...box(o, [-10, -10, -14], [76, 66, 12]),
    onTop(o, -10, -10, -2, [
      ...cells,
      { kind: 'rect', cls: 'dash', x: 38, y: 28, width: 10, height: 10, rx: 1.5 },
      { kind: 'path', cls: 'lt', d: 'M4 8 H72' }
    ]),
    ...box(o, [6, -12, -2], [3, 3, 9]),
    ...box(o, [44, -12, -2], [3, 3, 9])
  ];
  const tile = [
    ...box(o, [27, 17, 8], [12, 12, 4], 'ink'),
    onTop(o, 27, 17, 12, [{ kind: 'path', cls: 'ko', d: 'M3 6.5 L5.5 9 L9.5 3.5' }])
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: tile, motion: { kind: 'bob', distance: 0.05, duration: 6000 } }]
  };
}

function certificateScene(): Scene {
  const o: Point = [90, 58];
  const base = [
    ...box(o, [-8, -8, -18], [76, 64, 8]),
    ...box(o, [4, 6, -10], [48, 36, 1.5]),
    onTop(o, 4, 6, -8.5, [
      { kind: 'path', cls: 'lo', d: 'M6 6 H30 M6 11 H24 M6 16 H28' },
      { kind: 'circle', cls: 'lo', cx: 36, cy: 26, r: 5 },
      { kind: 'path', cls: 'lo', d: 'M33.5 30.5 L32 34 M38.5 30.5 L40 34' }
    ])
  ];
  const stamp = [
    ...box(o, [18, 14, 14], [20, 20, 7], 'ink'),
    ...box(o, [25, 21, 21], [6, 6, 12], 'ink'),
    ...box(o, [22, 18, 33], [12, 12, 4], 'ink')
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: stamp, motion: { kind: 'press', distance: 0.15, duration: 6000 } }]
  };
}

function questionsScene(): Scene {
  const o: Point = [84, 62];
  const card = 'M3 0 H41 Q44 0 44 3 V36 H0 V3 Q0 0 3 0 Z';
  const base = [
    ...box(o, [-4, -4, -20], [64, 52, 8]),
    ...box(o, [4, 20, -12], [48, 6, 2]),
    onLeft(o, 6, 23, 26, [
      { kind: 'path', cls: 'ln', d: card },
      { kind: 'path', cls: 'lo', d: 'M7 9 H33 M7 15 H28 M7 21 H22' }
    ])
  ];
  const question = [
    onLeft(o, 30, 8, 50, [
      {
        kind: 'path',
        cls: 'ink',
        d: 'M3 0 H25 Q28 0 28 3 V17 Q28 20 25 20 H20 L22 25 L14 20 H3 Q0 20 0 17 V3 Q0 0 3 0 Z'
      },
      { kind: 'path', cls: 'ko', d: 'M11 7 Q11 4 14 4 Q17 4 17 7 Q17 9 14 10 V12' },
      { kind: 'circle', cls: 'kf', cx: 14, cy: 15.2, r: 0.9 }
    ])
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: question, motion: { kind: 'bob', distance: 0.045, duration: 7000 } }]
  };
}

function notificationsScene(): Scene {
  const o: Point = [78, 58];
  const base = [
    ...box(o, [-6, -6, -22], [60, 60, 8]),
    ...box(o, [0, 0, -14], [6, 6, 58]),
    ...box(o, [6, 0, 38], [34, 6, 6])
  ];
  const [hx, hy] = project(o, 36, 3, 38);
  const bell: Shape[] = [
    { kind: 'path', cls: 'ko', d: `M${hx} ${hy} V${round(hy + 5)}` },
    {
      kind: 'path',
      cls: 'ink',
      d: `M${round(hx - 12)} ${round(hy + 27)} Q${round(hx - 10)} ${round(hy + 24)} ${round(hx - 10)} ${round(hy + 17)} Q${round(hx - 10)} ${round(hy + 5)} ${hx} ${round(hy + 5)} Q${round(hx + 10)} ${round(hy + 5)} ${round(hx + 10)} ${round(hy + 17)} Q${round(hx + 10)} ${round(hy + 24)} ${round(hx + 12)} ${round(hy + 27)} Z`
    },
    {
      kind: 'path',
      cls: 'ko',
      d: `M${round(hx - 12)} ${round(hy + 27)} Q${hx} ${round(hy + 31)} ${round(hx + 12)} ${round(hy + 27)}`
    },
    { kind: 'circle', cls: 'kf', cx: hx, cy: round(hy + 31.5), r: 2.4 }
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [
      { shapes: base },
      {
        shapes: bell,
        motion: { kind: 'swing', angle: 9, originX: hx / WIDTH, originY: hy / HEIGHT, duration: 6000 }
      }
    ]
  };
}

function downloadsScene(): Scene {
  const o: Point = [90, 56];
  const base = [
    ...box(o, [-10, -10, -26], [68, 60, 18]),
    polygon('lo', o, [
      [2, 2, -8],
      [46, 2, -8],
      [46, 38, -8],
      [2, 38, -8]
    ]),
    line('lt', o, [2, 2, -8], [2, 2, -16]),
    line('lt', o, [2, 2, -16], [46, 2, -16]),
    line('lt', o, [2, 2, -16], [2, 38, -16]),
    onLeft(o, -10, 50, -14, [{ kind: 'path', cls: 'lo', d: 'M28 2 H42' }])
  ];
  const [ax, ay] = project(o, 24, 20, 30);
  const arrow: Shape[] = [
    {
      kind: 'path',
      cls: 'ink',
      d: `M${round(ax - 5)} ${round(ay - 16)} H${round(ax + 5)} V${round(ay - 2)} H${round(ax + 11)} L${ax} ${round(ay + 10)} L${round(ax - 11)} ${round(ay - 2)} H${round(ax - 5)} Z`
    }
  ];
  const { dy } = offset(0, 30);

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: arrow, motion: { kind: 'travel', dx: 0, dy, duration: 6000 } }]
  };
}

function gradingScene(): Scene {
  const o: Point = [88, 58];
  const base = [
    ...box(o, [-8, -8, -22], [72, 60, 6]),
    ...box(o, [-8, -8, -16], [72, 3, 5]),
    ...box(o, [-11, -8, -16], [3, 60, 5]),
    ...box(o, [6, 6, -16], [44, 34, 1.5]),
    onTop(o, 6, 6, -14.5, [
      { kind: 'path', cls: 'lo', d: 'M6 6 H26 M6 11 H32 M6 16 H22' },
      { kind: 'path', cls: 'lo', d: 'M28 24 L31 27 L37 20' }
    ])
  ];
  const pen = [
    ...box(o, [4, 22, 26], [38, 5, 5], 'ink'),
    polygon('ink', o, [
      [42, 22, 31],
      [50, 24.5, 28.5],
      [42, 27, 31]
    ]),
    polygon('ink', o, [
      [42, 27, 26],
      [50, 24.5, 28.5],
      [42, 27, 31]
    ]),
    line('ko', o, [10, 27, 26], [10, 27, 31])
  ];

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: pen, motion: { kind: 'bob', distance: 0.05, duration: 8000 } }]
  };
}

function offlineScene(): Scene {
  const o: Point = [56, 44];
  const base = [
    ...box(o, [-6, -6, -8], [28, 24, 6]),
    ...box(o, [0, 2, -2], [14, 6, 26]),
    onLeft(o, 0, 8, 24, [{ kind: 'rect', cls: 'lo', x: 2.5, y: 3, width: 9, height: 16, rx: 1.5 }]),
    ...box(o, [72, -6, -8], [26, 26, 6]),
    ...box(o, [76, -2, -2], [18, 18, 34]),
    onLeft(o, 76, 16, 32, [{ kind: 'path', cls: 'lo', d: 'M3 5 H15 M3 11 H15 M3 17 H15 M3 23 H15' }]),
    line('dash', o, [22, 8, -8], [38, 8, -8]),
    line('dash', o, [54, 8, -8], [72, 8, -8]),
    line('lo', o, [44, 4, -8], [48, 12, -8]),
    line('lo', o, [48, 4, -8], [44, 12, -8])
  ];
  const packet = box(o, [28, 5, -8], [6, 6, 6], 'ink');
  const travel = project([0, 0], 14, 0, 0);
  const { dx, dy } = offset(travel[0], travel[1]);

  return {
    width: WIDTH,
    height: HEIGHT,
    layers: [{ shapes: base }, { shapes: packet, motion: { kind: 'travel', dx, dy, duration: 6000 } }]
  };
}

export const ILLUSTRATION_SCENES: Record<IllustrationName, Scene> = {
  courses: coursesScene(),
  calendar: calendarScene(),
  certificate: certificateScene(),
  questions: questionsScene(),
  notifications: notificationsScene(),
  downloads: downloadsScene(),
  grading: gradingScene(),
  offline: offlineScene()
};
