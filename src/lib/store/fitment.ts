import { promises as fs } from "fs";
import path from "path";
import seedFitment from "../../../data/fitment.json";
import type { FitmentRecord, FitmentStatus } from "@/types";

const ADMIN_FITMENT_PATH = path.join(process.cwd(), "data/admin/fitment.json");

/** New / incomplete records must never become verified by default. */
export function normalizeFitmentRecord(
  input: Partial<FitmentRecord> & { productId: string },
): FitmentRecord {
  const allowed: FitmentStatus[] = ["verified", "unverified", "incompatible"];
  const status: FitmentStatus = allowed.includes(input.status as FitmentStatus)
    ? (input.status as FitmentStatus)
    : "unverified";

  const record: FitmentRecord = {
    productId: input.productId,
    status,
  };

  if (input.brandId) record.brandId = input.brandId;
  if (input.modelId) record.modelId = input.modelId;
  if (input.yearId) record.yearId = input.yearId;
  if (input.trimId) record.trimId = input.trimId;
  if (input.notesKey) record.notesKey = input.notesKey;

  if (status === "verified") {
    record.verifiedAt = input.verifiedAt ?? new Date().toISOString().slice(0, 10);
    record.verifiedBy = input.verifiedBy ?? "admin";
  }

  return record;
}

function sameScope(a: FitmentRecord, b: FitmentRecord): boolean {
  return (
    a.productId === b.productId &&
    (a.brandId ?? "") === (b.brandId ?? "") &&
    (a.modelId ?? "") === (b.modelId ?? "") &&
    (a.yearId ?? "") === (b.yearId ?? "") &&
    (a.trimId ?? "") === (b.trimId ?? "")
  );
}

async function ensureAdminFile(): Promise<void> {
  try {
    await fs.access(ADMIN_FITMENT_PATH);
  } catch {
    await fs.mkdir(path.dirname(ADMIN_FITMENT_PATH), { recursive: true });
    await fs.writeFile(
      ADMIN_FITMENT_PATH,
      JSON.stringify(seedFitment, null, 2),
      "utf8",
    );
  }
}

export async function listFitment(): Promise<FitmentRecord[]> {
  await ensureAdminFile();
  const raw = await fs.readFile(ADMIN_FITMENT_PATH, "utf8");
  return JSON.parse(raw) as FitmentRecord[];
}

export async function saveFitment(records: FitmentRecord[]): Promise<void> {
  await ensureAdminFile();
  await fs.writeFile(
    ADMIN_FITMENT_PATH,
    JSON.stringify(records, null, 2),
    "utf8",
  );
}

export async function upsertFitment(
  input: Partial<FitmentRecord> & { productId: string },
): Promise<FitmentRecord[]> {
  const record = normalizeFitmentRecord(input);
  const records = await listFitment();
  const idx = records.findIndex((r) => sameScope(r, record));
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await saveFitment(records);
  return records;
}

export async function removeFitment(
  input: Partial<FitmentRecord> & { productId: string },
): Promise<FitmentRecord[]> {
  const probe = normalizeFitmentRecord({ ...input, status: "unverified" });
  const records = await listFitment();
  const next = records.filter((r) => !sameScope(r, probe));
  await saveFitment(next);
  return next;
}
