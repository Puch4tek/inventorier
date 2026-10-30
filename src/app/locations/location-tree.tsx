import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

export async function LocationTree({ locations }: LocationTreeProps) {
  const nodes = buildLocationTree(locations);
  const rows = flattenLocationTree(nodes);
  const t = await getTranslations("organization.locations");

  return (
    <section className="panel-card mt-5 overflow-hidden transition hover:bg-app-surface-subtle sm:mt-10">
      <div className="divide-y divide-app-border">
        {rows.map(({ node, level, parentName }) => (
          <Link
            key={node.id}
            href={`/locations/${node.id}`}
            className="block px-4 py-3 transition sm:px-8 sm:py-5"
          >
            <div
              className="flex items-center justify-between gap-3"
              style={{ marginLeft: `${Math.min(level, 3) * 1.5}rem` }}
            >
              <div className="min-w-0">
                {parentName ? (
                  <p className={level > 3 ? "mb-1 break-words text-xs text-app-muted" : "sr-only"}>
                    {t("parent", { name: parentName })}
                  </p>
                ) : null}
                <h2 className="truncate font-semibold">
                  {level > 0 ? (
                    <span className="mr-2 text-app-subtle" aria-hidden="true">
                      ↳
                    </span>
                  ) : null}
                  {node.name}
                </h2>
                <p className="mt-1 truncate text-xs text-app-muted sm:text-sm">
                  {node.description || t("noDescription")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-app-muted sm:flex-row sm:gap-4 sm:text-sm">
                <span>{t("itemsCount", { count: node.itemCount })}</span>
                <span>{t("childrenCount", { count: node.childCount })}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
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

function flattenLocationTree(
  nodes: LocationNode[],
  level = 0,
  parentName?: string,
): { node: LocationNode; level: number; parentName?: string }[] {
  return nodes.flatMap((node) => [
    { node, level, parentName },
    ...flattenLocationTree(node.children, level + 1, node.name),
  ]);
}
