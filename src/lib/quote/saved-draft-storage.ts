import { MAX_DRAFTS, parseBackup, savedDraftSchema, serializeBackup, type SavedQuoteDraft } from "./saved-draft";
export const DRAFTS_KEY = "ai-car-upgrade-demo-drafts-v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem">;
export function readDrafts(storage: DraftStorage): SavedQuoteDraft[] {
  const raw = storage.getItem(DRAFTS_KEY);
  return raw === null ? [] : parseBackup(raw);
}
/** Single-key replacement is atomic. Callers must not update UI on failed writes. */
export function writeDrafts(storage: DraftStorage, drafts: SavedQuoteDraft[]): void {
  storage.setItem(DRAFTS_KEY, serializeBackup(drafts));
}
export function addDraft(storage: DraftStorage, draft: SavedQuoteDraft): SavedQuoteDraft[] {
  const current = readDrafts(storage);
  const valid = savedDraftSchema.parse(draft);
  if (current.length >= MAX_DRAFTS || current.some((d) => d.id === valid.id)) throw new Error("Draft limit or duplicate ID");
  const next = [valid, ...current];
  writeDrafts(storage, next);
  return next;
}
export function removeDraft(storage: DraftStorage, id: string): SavedQuoteDraft[] {
  const next = readDrafts(storage).filter((draft) => draft.id !== id);
  writeDrafts(storage, next);
  return next;
}
/** Imports are additive copies: never overwrite existing drafts or silently discard conflicts. */
export function importDrafts(storage: DraftStorage, raw: string): SavedQuoteDraft[] {
  const imported = parseBackup(raw);
  const current = readDrafts(storage);
  if (current.length + imported.length > MAX_DRAFTS) throw new Error("Draft limit");
  const now = new Date().toISOString();
  const next = [...imported.map((draft) => ({ ...draft, id: crypto.randomUUID(), updatedAt: now })), ...current];
  writeDrafts(storage, next);
  return next;
}
export function duplicateDraft(storage: DraftStorage, draft: SavedQuoteDraft): SavedQuoteDraft[] {
  const now = new Date().toISOString();
  return addDraft(storage, { ...savedDraftSchema.parse(draft), id: crypto.randomUUID(), createdAt: now, updatedAt: now });
}
