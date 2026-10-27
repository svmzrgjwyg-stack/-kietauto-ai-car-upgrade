// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';
import { RecommendView } from '@/components/catalog/recommend-view';
import { getSeedProducts, getFitmentRecords } from '@/lib/catalog/seed';
const seedCatalog = { products: getSeedProducts(), fitment: getFitmentRecords() };
const { push, addProduct, combo } = vi.hoisted(() => ({ push: vi.fn(), addProduct: vi.fn(), combo: { items: [] as {productId: string; qty: number; includeLabor: boolean}[] } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components/combo/combo-context', () => ({ useCombo: () => ({ vehicle:null, items:combo.items, hydrated:true, addProduct, replaceProduct:vi.fn() }) }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('@/lib/catalog/use-catalog', () => ({ useCatalog: (catalog:unknown) => ({catalog,failed:false}) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); combo.items = []; });
function mount() { render(<NextIntlClientProvider locale="en" messages={en}><RecommendView catalog={seedCatalog} /></NextIntlClientProvider>); }
it('hides sample prices by default and exposes them only via labelled toggle', () => {
 mount(); expect(screen.getByText('Botslab 4K + 2K · 2CH')).toBeTruthy();
 expect(screen.queryByText(/V35/)).toBeNull();
 fireEvent.click(screen.getByText('Demo data options'));
 fireEvent.click(screen.getByRole('checkbox'));
 expect(screen.getAllByText(/SAMPLE · not approved retail pricing/).length).toBeGreaterThan(0);
});
it('add and review adds hardware only and opens package review', () => {
 mount(); fireEvent.click(screen.getAllByRole('button',{name:'Add & review'})[0]);
 expect(addProduct).toHaveBeenCalledWith('botslab-2ch-model-pending',false);
 expect(push).toHaveBeenCalledWith('/en/combo');
});
it('renders distinct owner product photos with readable alt text and uncropped responsive layout', () => {
 mount();
 const two = screen.getByRole('img', {name:'Botslab 4K + 2K · 2CH'});
 const four = screen.getByRole('img', {name:'Botslab G980 · 4CH'});
 expect(two.getAttribute('src')).toContain('botslab-2ch.png');
 expect(four.getAttribute('src')).toContain('botslab-g980-4ch.png');
 for (const photo of [two, four]) {
  expect(photo.className).toContain('object-contain');
  expect(photo.className).toContain('w-full');
  expect(photo.getAttribute('sizes')).toContain('100vw');
 }
 expect(screen.getAllByText(/Hardware only · installation excluded/).length).toBe(2);
});

it('searches localized product names and resets an empty search', () => {
 mount();
 fireEvent.change(screen.getByRole('searchbox'), {target:{value:'G980'}});
 expect(screen.getByText('Botslab G980 · 4CH')).toBeTruthy();
 expect(screen.queryByText('Botslab 4K + 2K · 2CH')).toBeNull();
 fireEvent.change(screen.getByRole('searchbox'), {target:{value:'unavailable product'}});
 expect(screen.getByText('No products match yet')).toBeTruthy();
 fireEvent.click(screen.getByRole('button', {name:'Reset search & filters'}));
 expect(screen.getAllByRole('img')).toHaveLength(2);
});
it('does not increment an existing selection when reviewing it', () => {
 combo.items = [{productId:'botslab-2ch-model-pending',qty:1,includeLabor:false}];
 mount();
 expect(screen.getByText('Selected · 1')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Review selection'}));
 expect(push).toHaveBeenCalledWith('/en/combo');
 expect(addProduct).not.toHaveBeenCalled();
});
it('does not claim a conflicting item is selected before conflict resolution', () => {
 combo.items = [{productId:'botslab-2ch-model-pending',qty:1,includeLabor:false}];
 mount();
 fireEvent.click(screen.getByRole('button',{name:'Add & review'}));
 expect(screen.getByRole('dialog')).toBeTruthy();
 expect(screen.getAllByText('Selected · 1')).toHaveLength(1);
 expect(addProduct).not.toHaveBeenCalled();
 expect(push).not.toHaveBeenCalled();
});
it('uses native collapsible photo details with visible action buttons', () => {
 mount();
 const image = screen.getByRole('img',{name:'Botslab G980 · 4CH'});
 const summary = image.closest('summary');
 expect(summary).toBeTruthy();
 expect(summary?.parentElement?.tagName).toBe('DETAILS');
 expect(screen.getAllByRole('button',{name:'Add & review'})).toHaveLength(2);
 expect(screen.getByRole('link',{name:/Review your package/}).getAttribute('href')).toBe('/en/combo');
});
it('only offers category filters that contain visible products', () => {
 mount();
 expect(screen.getByRole('button',{name:'Dashcam'})).toBeTruthy();
 const filters = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'));
 expect(filters).toHaveLength(2);
 expect(filters[0].getAttribute('aria-pressed')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Dashcam'}));
 expect(screen.getByRole('button',{name:'Dashcam'}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getAllByRole('img')).toHaveLength(2);
});
