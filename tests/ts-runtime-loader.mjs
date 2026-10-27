import { existsSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function findModule(path) {
  if (extname(path)) return existsSync(path) ? path : null;

  for (const candidate of [
    `${path}.ts`,
    `${path}.tsx`,
    `${path}.js`,
    `${path}.mjs`,
    resolve(path, "index.ts"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function resolveModule(specifier, context, nextResolve) {
  let candidate;
  if (specifier.startsWith("@/")) {
    candidate = findModule(resolve(process.cwd(), "src", specifier.slice(2)));
  } else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentPath = dirname(fileURLToPath(context.parentURL));
    candidate = findModule(resolve(parentPath, specifier));
  }

  if (candidate) {
    return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export { resolveModule as resolve };
