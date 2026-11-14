export const TRACK_EXTENSION = 220;
export const TRACK_START = 14;
export const TRACK_END = 246 + TRACK_EXTENSION;
export const BOARD_LENGTH = 260 + TRACK_EXTENSION;
export const RAIL_HEIGHT = 6;
export const CUBE_SIZE = 20;
export const CUBE_HEIGHT = 18;
export const CUBE_START = 24;
export const CUBE_LANE = 35;
export const PILLAR_LANE = 41;
export const PILLAR_WIDTH = 8;
export const ENTER_RAMP = 24;
export const LEAVE_RAMP = 10;

const ORIGIN_X = 0;
const ORIGINAL_VIEW_TOP = -29;
const GAME_VIEW_TOP = -60;
export const ORIGINAL_VIEW_WIDTH = 339;
const ORIGINAL_VIEW_HEIGHT = 222;
const VIEW_LEFT = -96;

export interface RunnerView {
  box: string;
  width: number;
  height: number;
  centerX: number;
  rightEdge: number;
}

/** Returns the viewBox that frames the board once its track has grown by `extension` units. */
export function viewFor(extension: number): RunnerView {
  const progress = extension / TRACK_EXTENSION;
  const top = ORIGINAL_VIEW_TOP + (GAME_VIEW_TOP - ORIGINAL_VIEW_TOP) * progress;
  const width = ORIGINAL_VIEW_WIDTH + extension * Math.cos(Math.PI / 6);
  const height = ORIGINAL_VIEW_HEIGHT + (ORIGINAL_VIEW_TOP - top) + extension * 0.5;

  return {
    box: `${VIEW_LEFT} ${top.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`,
    width,
    height,
    centerX: VIEW_LEFT + width / 2,
    rightEdge: VIEW_LEFT + width
  };
}

const ORIGIN_Y = -8;
const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = 0.5;

export interface BoxFaces {
  top: string;
  left: string;
  right: string;
}

/**
 * Projects a point on the board into the machine's 30-degree isometric view.
 * `along` runs down the track, `across` runs toward the viewer's left, `lift` is height above the board.
 */
export function projectPoint(along: number, across: number, lift: number) {
  const x = ORIGIN_X + (along - across) * COS_30;
  const y = ORIGIN_Y + (along + across) * SIN_30 - lift;

  return { x, y };
}

function pointList(corners: Array<[number, number, number]>) {
  return corners
    .map(([along, across, lift]) => {
      const { x, y } = projectPoint(along, across, lift);

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Returns the top, left and right faces of a box as SVG point lists, in the machine's isometric view. */
export function projectBox(
  along: number,
  length: number,
  across: number,
  width: number,
  lift: number,
  height: number
): BoxFaces {
  const alongEnd = along + length;
  const acrossEnd = across + width;
  const topLift = lift + height;

  return {
    top: pointList([
      [along, across, topLift],
      [alongEnd, across, topLift],
      [alongEnd, acrossEnd, topLift],
      [along, acrossEnd, topLift]
    ]),
    left: pointList([
      [along, acrossEnd, lift],
      [alongEnd, acrossEnd, lift],
      [alongEnd, acrossEnd, topLift],
      [along, acrossEnd, topLift]
    ]),
    right: pointList([
      [alongEnd, across, lift],
      [alongEnd, acrossEnd, lift],
      [alongEnd, acrossEnd, topLift],
      [alongEnd, across, topLift]
    ])
  };
}

/** How much of an obstacle has risen out of the board, from 0 at either end of the rail to 1 in the middle. */
export function obstacleRise(obstacle: Obstacle) {
  const entering = Math.min(1, Math.max(0, (TRACK_END - obstacle.x) / ENTER_RAMP));
  const leaving = Math.min(1, Math.max(0, (obstacle.x + obstacle.width - TRACK_START) / LEAVE_RAMP));

  return Math.min(entering, leaving);
}

const GRAVITY = 1400;
const JUMP_HEIGHT = 44;
const JUMP_SPEED = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT);
const AIR_TIME = (2 * JUMP_SPEED) / GRAVITY;
const START_SPEED = 150;
const MAX_SPEED = 300;
const ACCELERATION = 4;
const HIT_FORGIVENESS = 3;

export type { RunnerStatus } from './types';

export interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  cleared: boolean;
}

export interface RunnerState {
  lift: number;
  velocity: number;
  airTime: number;
  rotation: number;
  distance: number;
  passed: number;
  speed: number;
  nextObstacleId: number;
  untilNextObstacle: number;
  obstacles: Obstacle[];
}

export function createRunnerState(): RunnerState {
  return {
    lift: 0,
    velocity: 0,
    airTime: 0,
    rotation: 0,
    distance: 0,
    passed: 0,
    speed: START_SPEED,
    nextObstacleId: 0,
    untilNextObstacle: 0.9,
    obstacles: []
  };
}

export function jump(state: RunnerState) {
  if (state.lift > 0) return;

  state.velocity = JUMP_SPEED;
  state.airTime = 0;
}

function spawnObstacle(state: RunnerState) {
  const isBeam = Math.random() < 0.25;
  const width = isBeam ? 26 + Math.random() * 8 : 8 + Math.random() * 6;
  const height = isBeam ? 10 : 16 + Math.random() * 14;

  state.obstacles.push({ id: state.nextObstacleId, x: TRACK_END, width, height, cleared: false });
  state.nextObstacleId += 1;

  const minGap = (AIR_TIME + 0.35) * 1;
  state.untilNextObstacle = minGap + Math.random() * 0.9;
}

function hitsCube(state: RunnerState, obstacle: Obstacle) {
  const cubeLeft = CUBE_START + HIT_FORGIVENESS;
  const cubeRight = CUBE_START + CUBE_SIZE - HIT_FORGIVENESS;
  const cubeBottom = state.lift + HIT_FORGIVENESS;

  const overlapsHorizontally = cubeRight > obstacle.x && cubeLeft < obstacle.x + obstacle.width;
  const overlapsVertically = cubeBottom < obstacle.height;

  return overlapsHorizontally && overlapsVertically;
}

/**
 * Advances the game by `elapsed` seconds and mutates `state` in place.
 * Returns true when the cube has hit an obstacle.
 */
export function stepRunner(state: RunnerState, elapsed: number): boolean {
  state.speed = Math.min(MAX_SPEED, state.speed + ACCELERATION * elapsed);
  state.distance += state.speed * elapsed;

  if (state.lift > 0 || state.velocity > 0) {
    state.velocity -= GRAVITY * elapsed;
    state.lift = Math.max(0, state.lift + state.velocity * elapsed);
    state.airTime += elapsed;
    state.rotation = Math.min(90, (state.airTime / AIR_TIME) * 90);

    if (state.lift === 0) {
      state.velocity = 0;
      state.rotation = 0;
    }
  }

  state.untilNextObstacle -= elapsed;
  if (state.untilNextObstacle <= 0) spawnObstacle(state);

  for (const obstacle of state.obstacles) {
    obstacle.x -= state.speed * elapsed;
  }

  const crashed = state.obstacles.some((obstacle) => hitsCube(state, obstacle));
  if (crashed) return true;

  for (const obstacle of state.obstacles) {
    if (obstacle.cleared || obstacle.x + obstacle.width >= CUBE_START) continue;

    obstacle.cleared = true;
    state.passed += 1;
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > TRACK_START);

  return false;
}

const BEST_SCORE_KEY = 'cio-track-runner-best';

export function readBestScore(): number {
  try {
    const stored = Number(window.localStorage.getItem(BEST_SCORE_KEY));

    return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(score: number) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    return;
  }
}

const MUTED_KEY = 'cio-track-runner-muted';

export function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeMuted(isMuted: boolean) {
  try {
    window.localStorage.setItem(MUTED_KEY, isMuted ? '1' : '0');
  } catch {
    return;
  }
}
