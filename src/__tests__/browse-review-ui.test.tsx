// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';
import { SiteHeader } from '@/components/layout/site-header';
import { ComboView } from '@/components/combo/combo-view';
import { ComboProvider } from '@/components/combo/combo-context';
import { ReferenceSelectionProvider } from '@/components/browse/reference-selection-context';
import { REFERENCE_SELECTION_KEY, serializeReferenceSelection } from '@/lib/browse/reference-selection';
import { fitmentReferences } from '@/lib/catalog/reference';
import { getSeedProducts, getFitmentRecords } from '@/lib/catalog/seed';

vi.mock('next/navigation', () => ({ usePathname: () => '/en/combo' }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({showToast: vi.fn()}) }));
const state = vi.hoisted(() => ({ failed: false }));
vi.mock('@/lib/catalog/use-catalog', () => ({useCatalog: (catalog: unknown) => ({catalog,failed:state.failed})}));
const reference = fitmentReferences[0];
const catalog = {products:getSeedProducts(), fitment:getFitmentRecords()};
beforeEach(() => { state.failed = false; window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); vi.clearAllMocks(); });
function mount() {
 return render(<NextIntlClientProvider locale="en" messages={en}><ComboProvider><ReferenceSelectionProvider><SiteHeader /><ComboView catalog={catalog} /></ReferenceSelectionProvider></ComboProvider></NextIntlClientProvider>);
}
it('reviews a reference-only shortlist without a fabricated monetary total or quote action', () => {
 window.localStorage.setItem(REFERENCE_SELECTION_KEY,serializeReferenceSelection([reference.id]));
 const {container} = mount();
 const shortlist = screen.getByRole('region',{name:'Configurations of interest'});
 expect(within(shortlist).getByText(/Verify fitment \/ price pending/)).toBeTruthy();
 expect(within(shortlist).getByText(/not submitted/)).toBeTruthy();
 expect(screen.getByText(/No priced hardware selected/)).toBeTruthy();
 expect(container.textContent).not.toMatch(/\$|USD|Known-price subtotal/);
 expect(container.querySelector('a[href="/en/quote"]')).toBeNull();
 expect(screen.getByRole('link',{name:'Browse more'}).getAttribute('href')).toBe('/en/catalog');
});
it('keeps header count in sync when a reference is removed in review', () => {
 window.localStorage.setItem(REFERENCE_SELECTION_KEY,serializeReferenceSelection([reference.id]));
 mount();
 const header = screen.getByRole('banner');
 expect(within(header).getByText('1')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:`Remove ${reference.id}`}));
 expect(within(header).queryByText('1')).toBeNull();
 expect(screen.getByText(/Nothing selected yet/)).toBeTruthy();
 expect(JSON.parse(window.localStorage.getItem(REFERENCE_SELECTION_KEY)!)).toEqual({version:1,ids:[]});
});
it('offers guest browsing and review without an account gate and preserves route on locale switch', () => {
 const {container} = mount();
 const nav = screen.getByRole('navigation',{name:'Main navigation'});
 const links = within(nav).getAllByRole('link');
 expect(links.map(link => link.getAttribute('href'))).toEqual(['/en/vehicle','/en/catalog','/en/recommend','/en/combo']);
 expect(within(nav).getByRole('link',{name:'Combo'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getByRole('link',{name:'Switch language'}).getAttribute('href')).toBe('/vi/combo');
 expect(container.querySelector('a[href*="login"],a[href*="signin"],a[href*="register"]')).toBeNull();
 expect(screen.queryByRole('textbox')).toBeNull();
 expect(screen.getByText(/Nothing selected yet/)).toBeTruthy();
});

it('keeps local references usable when the priced catalogue is unavailable', () => {
 state.failed = true;
 window.localStorage.setItem(REFERENCE_SELECTION_KEY,serializeReferenceSelection([reference.id]));
 const {container} = mount();
 expect(screen.getByRole('alert')).toBeTruthy();
 expect(screen.getByRole('region',{name:'Configurations of interest'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:`Remove ${reference.id}`}));
 expect(screen.getByText(/Nothing selected yet/)).toBeTruthy();
 expect(container.querySelector('a[href="/en/quote"]')).toBeNull();
});
