export interface MachineProps {
  label?: string;
  stillAt?: number;
  class?: string;
}

export interface RunnerLabels {
  startLabel?: string;
  gameOverLabel?: string;
  restartLabel?: string;
  scoreLabel?: string;
  bestLabel?: string;
  newRecordLabel?: string;
  enterFullscreenLabel?: string;
  exitFullscreenLabel?: string;
  muteLabel?: string;
  unmuteLabel?: string;
}

export type RunnerStatus = 'idle' | 'extending' | 'countdown' | 'running' | 'over';

export interface RunnerSnapshot {
  status: RunnerStatus;
  passed: number;
  isNewRecord: boolean;
}

export interface RunnerProps extends RunnerLabels {
  onstatechange?: (snapshot: RunnerSnapshot) => void;
  label?: string;
  autoStart?: boolean;
  baseWidth?: number;
  class?: string;
}

export interface BrokenTrackProps extends MachineProps, RunnerLabels {
  playable?: boolean;
  onstatechange?: (snapshot: RunnerSnapshot) => void;
}
