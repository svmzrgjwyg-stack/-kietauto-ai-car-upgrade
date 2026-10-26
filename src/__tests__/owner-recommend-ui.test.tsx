// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';
import { RecommendView } from '@/components/catalog/recommend-view';
import { getSeedProducts, getFitmentRecords } from '@/lib/catalog/seed';
const seedCatalog = { products: getSeedProducts(), fitment: getFitmentRecords() };
const { push, addProduct } = vi.hoisted(() => ({ push: vi.fn(), addProduct: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components/combo/combo-context', () => ({ useCombo: () => ({ vehicle:null, items:[], hydrated:true, addProduct, replaceProduct:vi.fn() }) }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('@/lib/catalog/use-catalog', () => ({ useCatalog: (catalog:unknown) => ({catalog,failed:false}) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount() { render(<NextIntlClientProvider locale="en" messages={en}><RecommendView catalog={seedCatalog} /></NextIntlClientProvider>); }
it('hides sample prices by default and exposes them only via labelled toggle', () => {
 mount(); expect(screen.getByText('Botslab 4K + 2K · 2CH')).toBeTruthy();
 expect(screen.queryByText(/V35/)).toBeNull();
 fireEvent.click(screen.getByRole('checkbox'));
 expect(screen.getAllByText(/SAMPLE · not approved retail pricing/).length).toBeGreaterThan(0);
});
it('first request quote click adds hardware only and navigates immediately', () => {
 mount(); fireEvent.click(screen.getAllByRole('button',{name:'Request quote'})[0]);
 expect(addProduct).toHaveBeenCalledWith('botslab-2ch-model-pending',false);
 expect(push).toHaveBeenCalledWith('/en/quote');
});
