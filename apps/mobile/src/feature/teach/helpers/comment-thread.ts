type ThreadNode = { id: number; parentId: number | null };

/** Orders a depth-sorted comment list so each reply follows its parent: newest threads first, replies oldest first. */
export function inThreadOrder<Node extends ThreadNode>(nodes: Node[]) {
  const ids = new Set(nodes.map((node) => node.id));
  const childrenByParent = new Map<number, Node[]>();
  const roots: Node[] = [];

  for (const node of nodes) {
    if (node.parentId === null || !ids.has(node.parentId)) {
      roots.push(node);
      continue;
    }

    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const ordered: Node[] = [];
  const visit = (node: Node) => {
    ordered.push(node);
    const children = [...(childrenByParent.get(node.id) ?? [])].sort((first, second) => first.id - second.id);
    children.forEach(visit);
  };
  roots.forEach(visit);

  return ordered;
}
