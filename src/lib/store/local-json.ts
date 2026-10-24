import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Local single-process test adapter, NOT durable serverless storage. */
export function localCatalogWritable(): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) return false;
  return process.env.CATALOG_STORAGE === "local" ||
    (process.env.CATALOG_STORAGE === undefined &&
      (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"));
}

export const READ_ONLY_MESSAGE = "Catalog is read-only: no durable storage provider configured. Local files are supported only for local testing.";

function filePath(name: string) {
  // Runtime-local data is deliberately excluded from deployment tracing.
  return path.join(/* turbopackIgnore: true */ process.env.CATALOG_LOCAL_DIR || path.join(process.cwd(), "data/admin"), name);
}

export async function readLocalJson<T>(name: string, seed: T): Promise<T> {
  if (!localCatalogWritable()) return structuredClone(seed);
  try {
    return JSON.parse(await fs.readFile(/* turbopackIgnore: true */ filePath(name), "utf8")) as T;
  } catch (error) {
    // Missing local overrides use seeds; corrupt/unreadable overrides must NOT silently fall back.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(seed);
    throw error;
  }
}

export async function writeLocalJson<T>(name: string, value: T): Promise<void> {
  if (!localCatalogWritable()) throw new Error(READ_ONLY_MESSAGE);
  const destination = filePath(name);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
