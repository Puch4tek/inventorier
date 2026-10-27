type LocationNode = {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  itemCount: number;
  childCount: number;
  children: LocationNode[];
};

type LocationTreeProps = {
  locations: Array<{
    id: number;
    name: string;
    description: string | null;
    parentId: number | null;
    _count: {
      items: number;
      children: number;
    };
  }>;
};

export function LocationTree({ locations }: LocationTreeProps) {
  const nodes = buildLocationTree(locations);

  return (
    <div className="mt-10 space-y-3">
      {nodes.map((node) => (
        <LocationTreeItem key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}

function LocationTreeItem({
  node,
  level,
}: {
  node: LocationNode;
  level: number;
}) {
  return (
    <div>
      <article
        className="rounded-2xl border border-app-border bg-app-surface p-5 shadow-card"
        style={{ marginLeft: `${level * 2}rem` }}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              {level > 0 ? (
                <span className="text-app-subtle" aria-hidden="true">
                  ↳
                </span>
              ) : null}
              <Link
                href={`/locations/${node.id}`}
                className="text-lg font-semibold tracking-[-0.02em] hover:underline"
              >
                {node.name}
              </Link>
            </div>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              {node.description || "Brak opisu"}
            </p>
          </div>
          <div className="flex gap-4 text-xs text-app-muted">
            <span>Przedmioty: {node.itemCount}</span>
            <span>Podlokalizacje: {node.childCount}</span>
          </div>
        </div>
      </article>

      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <LocationTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildLocationTree(locations: LocationTreeProps["locations"]) {
  const nodes = new Map<number, LocationNode>();

  for (const location of locations) {
    nodes.set(location.id, {
      id: location.id,
      name: location.name,
      description: location.description,
      parentId: location.parentId,
      itemCount: location._count.items,
      childCount: location._count.children,
      children: [],
    });
  }

  const roots: LocationNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
import Link from "next/link";
