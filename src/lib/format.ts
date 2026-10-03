/**
 * Formatage monétaire/numérique localisé, une locale par langue (RECETTE §4) :
 * « 1.234 € » et « 13,37 % » en grec, « €1,234 » et « 13.37 % » en anglais.
 * Les pages et les composants passent leur langue ; sans argument, le grec.
 */
import { LOCALE_TAG, LOCALE_BY_LANG, CURRENCY } from '../data/site-config';

export type Lang = 'el' | 'en';

const cache = new Map<string, Intl.NumberFormat>();
function nf(tag: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const k = tag + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(tag, opts));
  return cache.get(k)!;
}
const tagOf = (lang?: string) => (lang === 'en' || lang === 'el' ? LOCALE_BY_LANG[lang] : LOCALE_TAG);

/** Montant en euros, entier par défaut (RECETTE §4.1 : pas de centimes à l'écran).
 *  Groupement forcé : « 1.234 € » en grec comme « €1,234 » en anglais. */
export function formatMoney(value: number, decimals = 0, lang?: string): string {
  return nf(tagOf(lang), { style: 'currency', currency: CURRENCY, minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
}
export function formatNumber(value: number, decimals = 0, lang?: string): string {
  return nf(tagOf(lang), { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
}
/** Valeur citée d'un barème : décimales utiles seulement (31,4 · 9,76). */
export function formatDecimal(value: number, max = 2, lang?: string): string {
  return nf(tagOf(lang), { maximumFractionDigits: max, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
}
/** Taux : `value` en fraction (0.0976 → « 9,76 % »). Espace insécable avant % dans les deux langues. */
export function formatPercent(value: number, decimals = 1, lang?: string): string {
  return nf(tagOf(lang), { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value).replace(/(\d)\s?%/, '$1 %');
}
/** Taux avec les seules décimales utiles (0.0245 → « 2,45 % », 0.12 → « 12 % »). */
export function pct(value: number, lang?: string): string {
  return `${formatDecimal(value * 100, 2, lang)} %`;
}
export function parseLocaleNumber(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, '');
  const lastComma = cleaned.lastIndexOf(','), lastDot = cleaned.lastIndexOf('.');
  let s = cleaned;
  if (lastComma > lastDot) s = cleaned.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) s = cleaned.replace(/\./g, '');
  else s = cleaned.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
/** Date écrite dans la langue de la page, fuseau UTC forcé ; l'ISO reste dans `datetime`. */
export function displayDate(iso: string, langTag: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(langTag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
