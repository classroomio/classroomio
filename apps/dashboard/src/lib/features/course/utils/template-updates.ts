type SyncUnit = {
  id: string;
  parentId: string | null;
  change: 'new' | 'updated';
};

export function selectUnitWithParents(units: SyncUnit[], selectedIds: Iterable<string>, unitId: string) {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const selected = new Set(selectedIds);
  selected.add(unitId);

  const visit = (id: string) => {
    const unit = unitsById.get(id);
    if (!unit?.parentId) return;

    const parent = unitsById.get(unit.parentId);
    if (!parent || parent.change !== 'new' || selected.has(parent.id)) {
      if (parent?.change === 'new') visit(parent.id);
      return;
    }

    selected.add(parent.id);
    visit(parent.id);
  };

  visit(unitId);
  return selected;
}

export function deselectUnitAndNewChildren(units: SyncUnit[], selectedIds: Iterable<string>, unitId: string) {
  const selected = new Set(selectedIds);
  selected.delete(unitId);

  const removeNewChildren = (parentId: string) => {
    for (const unit of units) {
      if (unit.parentId !== parentId || unit.change !== 'new' || !selected.has(unit.id)) continue;

      selected.delete(unit.id);
      removeNewChildren(unit.id);
    }
  };

  const unit = units.find((item) => item.id === unitId);
  if (unit?.change === 'new') removeNewChildren(unitId);

  return selected;
}
