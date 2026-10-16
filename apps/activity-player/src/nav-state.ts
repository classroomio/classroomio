import type { PlayerUiUnit } from './inbound';

export interface NavStep {
  identifier: string | null;
  locked: boolean;
  disabled: boolean;
}

export interface NavState {
  hasMenu: boolean;
  currentIndex: number;
  currentTitle: string | null;
  completedCount: number;
  previous: NavStep;
  next: NavStep;
}

function stepTo(unit: PlayerUiUnit | null): NavStep {
  if (!unit) return { identifier: null, locked: false, disabled: true };

  return { identifier: unit.identifier, locked: unit.locked, disabled: unit.locked };
}

/**
 * Derives the module nav from the embedder's modules. Previous and next are
 * disabled at either end and when the neighbouring module is locked.
 */
export function computeNavState(units: PlayerUiUnit[], currentIdentifier: string | null): NavState {
  const currentIndex = units.findIndex((unit) => unit.identifier === currentIdentifier);
  const previousUnit = currentIndex > 0 ? (units[currentIndex - 1] ?? null) : null;
  const nextUnit = currentIndex >= 0 && currentIndex < units.length - 1 ? (units[currentIndex + 1] ?? null) : null;

  return {
    hasMenu: units.length > 1,
    currentIndex,
    currentTitle: currentIndex >= 0 ? (units[currentIndex]?.title ?? null) : null,
    completedCount: units.filter((unit) => unit.completed).length,
    previous: stepTo(previousUnit),
    next: stepTo(nextUnit)
  };
}
