/** Mini-simulateurs supplémentaires du lot « f » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import { severance, nationalPension, PARAMS as P } from './engine/gr';
import { formatMoney, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);
/** Valeurs vérifiées hors fichier de paramètres (à y reporter) :
 *  Επιθεώρηση Εργασίας, αποζημίωση απόλυσης : 40 % / 50 % de l'indemnité en cas de départ à la retraite ;
 *  ν. 4387/2016 art. 7 par. 3 : −1/200 de la pension nationale par mois manquant (pension réduite). */
export const RETIRE_SHARE_AUX = 0.4;
export const RETIRE_SHARE_NO_AUX = 0.5;
export const REDUCED_NATIONAL_PER_MONTH = 1 / 200;
const sevCta = (l: L) => T(l, 'Πλήρης υπολογιστής αποζημίωσης', 'Full severance calculator');
const penCta = (l: L) => T(l, 'Πλήρης υπολογιστής σύνταξης', 'Full pension calculator');
const yrs = (l: L, def: number) => ({ id: 'y', label: T(l, 'Συμπληρωμένα έτη στον εργοδότη', 'Full years with the employer'), def, max: 60 });
const pay = (l: L, def: number) => ({ id: 'g', label: T(l, 'Τακτικές μηνιαίες αποδοχές', 'Regular monthly pay'), def, unit: '€', max: 1_000_000 });

export const EXTRA_F: Record<string, (l: L) => MiniSpec> = {
  /** Plafond de l'art. 5 ν. 3198/1955 : 8 × salaire journalier de l'ouvrier non qualifié × 30. */
  sevcap: (l) => ({ title: T(l, 'Σας αφορά το ανώτατο όριο του μισθού;', 'Does the pay cap apply to you?'), cta: sevCta(l),
    inputs: [pay(l, 11000), yrs(l, 16)],
    run: ({ g, y }) => { const s = severance({ pay: g, years: y }); const free = s.monthly * s.months * (1 + P.severance.holiday_uplift);
      return { head: [T(l, 'Αποζημίωση με το όριο', 'Severance with the cap'), $(s.total, l)],
        rows: [[T(l, 'Ανώτατος μισθός υπολογισμού', 'Highest pay counted'), $2(s.cap, l)], [T(l, 'Χωρίς όριο θα ήταν', 'Without the cap it would be'), $(free, l)], [T(l, 'Διαφορά λόγω ορίου', 'Lost to the cap'), $(Math.max(0, free - s.total), l)]] }; } }),
  /** Καταβολή σε δόσεις (Επιθεώρηση Εργασίας, άρθρο 74 ν. 3863/2010). */
  sevinstal: (l) => ({ title: T(l, 'Πώς μπορεί να σας πληρωθεί σε δόσεις', 'How the employer may pay it in instalments'), cta: sevCta(l),
    inputs: [pay(l, 1500), yrs(l, 12)],
    run: ({ g, y }) => { const s = severance({ pay: g, years: y }); const two = 2 * s.monthlyCapped; const first = Math.min(s.total, two); const rest = Math.max(0, s.total - first); const n = two > 0 ? Math.ceil(rest / two - 1e-9) : 0;
      return { head: [T(l, 'Συνολική αποζημίωση', 'Total severance'), $(s.total, l)],
        rows: [[T(l, 'Κατά την απόλυση (2 μισθοί)', 'At dismissal (2 months’ pay)'), $(first, l)], [T(l, 'Υπόλοιπο', 'Remainder'), $(rest, l)], [T(l, 'Διμηνιαίες δόσεις το πολύ', 'Two-monthly instalments, at most'), String(n)]],
        note: T(l, 'Οι δόσεις επιτρέπονται όταν η αποζημίωση ξεπερνά δύο μηνιαίους μισθούς· καθεμία είναι τουλάχιστον δύο μισθοί.', 'Instalments are allowed only above two months’ pay; each one is at least two months’ pay.') }; } }),
  /** Αποχώρηση με συνταξιοδότηση : 40 % (με επικουρική) ή 50 % (χωρίς) της αποζημίωσης άτακτης καταγγελίας. */
  sevretire: (l) => ({ title: T(l, 'Αποχώρηση για σύνταξη: τι μένει από την αποζημίωση', 'Leaving to retire: what is left of the severance'), cta: sevCta(l),
    inputs: [pay(l, 2600), yrs(l, 30), { id: 'z', label: T(l, 'Έτη στις 12.11.2012', 'Years on 12.11.2012'), def: 17, max: 60 }],
    run: ({ g, y, z }) => { const s = severance({ pay: g, years: y, yearsAt2012: z }); const full = s.monthlyCapped * (s.months + s.extraMonths) * (1 + P.severance.holiday_uplift);
      return { head: [T(l, `Με επικουρική ασφάλιση (${pct(RETIRE_SHARE_AUX, l)})`, `With auxiliary insurance (${pct(RETIRE_SHARE_AUX, l)})`), $(full * RETIRE_SHARE_AUX, l)],
        rows: [[T(l, `Χωρίς επικουρική (${pct(RETIRE_SHARE_NO_AUX, l)})`, `Without auxiliary (${pct(RETIRE_SHARE_NO_AUX, l)})`), $(full * RETIRE_SHARE_NO_AUX, l)], [T(l, 'Πλήρης αποζημίωση (βάση)', 'Full severance (base)'), $(full, l)], [T(l, 'Μισθοί που μετρούν', 'Months counted'), String(s.months + s.extraMonths)]],
        note: T(l, `Στην αποχώρηση για σύνταξη το όριο των ${$(P.severance.extra_2012_salary_cap, l)} στους επιπλέον μισθούς δεν εφαρμόζεται.`, `When leaving to retire, the ${$(P.severance.extra_2012_salary_cap, l)} limit on the extra months does not apply.`) }; } }),
  /** Μειωμένη σύνταξη : −1/200 της εθνικής σύνταξης ανά μήνα πριν από το όριο πλήρους σύνταξης. */
  earlyret: (l) => ({ title: T(l, 'Πόση εθνική σύνταξη χάνετε αν φύγετε νωρίτερα', 'How much national pension an early exit costs'), cta: penCta(l),
    inputs: [{ id: 'y', label: T(l, 'Έτη ασφάλισης', 'Years of insurance'), def: 25, max: 60 }, { id: 'm', label: T(l, 'Μήνες πριν από τα 67', 'Months before age 67'), def: 24, max: (P.pension.full_age - P.pension.reduced_age) * 12 }],
    run: ({ y, m }) => { const nat = nationalPension(y); const cut = Math.min(1, m * REDUCED_NATIONAL_PER_MONTH);
      return { head: [T(l, 'Εθνική σύνταξη μειωμένη', 'Reduced national pension'), $2(nat * (1 - cut), l)],
        rows: [[T(l, 'Χωρίς μείωση', 'Without the cut'), $2(nat, l)], [T(l, 'Μείωση', 'Cut'), pct(cut, l)], [T(l, 'Λιγότερα τον μήνα', 'Less per month'), $2(nat * cut, l)]],
        note: T(l, 'Μόνο η εθνική σύνταξη· το ανταποδοτικό μέρος δεν υπολογίζεται εδώ.', 'National pension only; the contributory part is not computed here.') }; } }),
};
