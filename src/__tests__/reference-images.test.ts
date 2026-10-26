import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { fitmentReferences } from '@/lib/catalog/reference';
it('provides original reference images for all45 configurations without private paths', () => {
 expect(fitmentReferences.flatMap(r=>r.images)).toHaveLength(46);
 for (const r of fitmentReferences) for (const image of r.images) {
  expect(image.src).toMatch(new RegExp(`^/reference-images/${r.id.toLowerCase()}-(dashboard|rear-connectors)\\.jpg$`));
  const file = path.join(process.cwd(),'public',image.src);
  expect(existsSync(file)).toBe(true);
  const data = readFileSync(file);
  expect(data[0]).toBe(0xff); expect(data[1]).toBe(0xd8);
  expect(image.width).toBeGreaterThan(0); expect(image.width).toBeLessThanOrEqual(240);
  expect(image.height).toBeGreaterThan(0); expect(image.height).toBeLessThanOrEqual(180);
  expect(Object.keys(image).sort()).toEqual(['height','kind','sharedReference','src','width']);
 }
 expect(fitmentReferences.find(r=>r.id==='CP-004')!.images).toHaveLength(2);
 expect(fitmentReferences.filter(r=>r.images.some(i=>i.sharedReference)).map(r=>r.id)).toEqual(['CP-026','CP-027']);
});
it('stores the two owner camera assets as real PNG files, never screenshot placeholders', () => {
 for (const filename of ['botslab-2ch.png','botslab-g980-4ch.png']) {
  const bytes=readFileSync(path.join(process.cwd(),'public/products',filename));
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(660);
  expect([700,710]).toContain(bytes.readUInt32BE(20));
 }
});
