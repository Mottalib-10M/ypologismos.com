/** Mini-simulateurs supplémentaires du lot « b » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import type { MiniSpec } from './mini-types';
import { salary, incomeTax, taxCredit, bracketRates, PARAMS as P, type Age } from './engine/gr';
import { formatMoney, pct } from './format';

/*
 * Valeurs vérifiées hors du fichier de paramètres (lues le 2026-10-03), exportées pour que les pages
 * du lot les citent depuis un seul endroit au lieu de les écrire en dur.
 */
/** Ancienne κλίμακα (année fiscale 2025), avant le ν. 5246/2025 : taxheaven.gr/klimakes?year=2025
 *  (catégorie « Μισθωτοί / Συνταξιούχοι »). La réduction de l'art. 16 y était la même qu'en 2026. */
export const SCALE_2025 = [
  { upTo: 10000, rate: 0.09 }, { upTo: 20000, rate: 0.22 }, { upTo: 30000, rate: 0.28 }, { upTo: 40000, rate: 0.36 }, { upTo: null, rate: 0.44 },
] as const;
export const SCALE_2025_SOURCE = { el: { name: 'Taxheaven: κλίμακα φορολογίας μισθωτών, φορολογικό έτος 2025', url: 'https://www.taxheaven.gr/klimakes?year=2025' }, en: { name: 'Taxheaven: income tax scale for employees, tax year 2025', url: 'https://www.taxheaven.gr/klimakes?year=2025' } };
/** Art. 60 ΚΦΕ par. 4 : retenue de 20 % sur les arriérés et les rémunérations additionnelles hors paie
 *  régulière ; 5 % sur les salariés journaliers à durée déterminée de moins d'un an. Par. 5 : versement
 *  au plus tard à la fin du deuxième mois. taxheaven.gr/law/4172/2013/article/60/view */
export const ART60 = { extra: 0.2, shortDaily: 0.05, remitMonths: 2 };
export const ART60_SOURCE = { el: { name: 'Άρθρο 60 ΚΦΕ (ν. 4172/2013): παρακράτηση φόρου μισθωτών', url: 'https://www.taxheaven.gr/law/4172/2013/article/60/view' }, en: { name: 'Article 60 of the Income Tax Code (Law 4172/2013): payroll withholding', url: 'https://www.taxheaven.gr/law/4172/2013/article/60/view' } };
/** e-ΕΦΚΑ, circulaire 38/2024 (source `efka_rates`) : santé 6,10 % = en nature 5,45 % (1,65 salarié,
 *  3,80 employeur) + en espèces 0,65 % (0,40 salarié, 0,25 employeur) ; baisse de 0,5 point chacun au
 *  1-1-2025 ; ΚΠΚ 103 (sans ΙΚΑ-ΤΕΑΜ) 10,37 / 18,79 ; ΚΠΚ 105 (pénibles, ΙΚΑ-ΤΕΑΜ) 16,82 / 23,94. */
export const EFKA_DETAIL = {
  eeKind: 0.0165, eeCash: 0.004, erKind: 0.038, erCash: 0.0025, cut2025: 0.005,
  kpk103: { kpk: 103, ee: 0.1037, er: 0.1879 }, kpk105: { kpk: 105, ee: 0.1682, er: 0.2394 },
};

/** Art. 15 par. 1Α ΚΦΕ (ν. 5246/2025 art. 3) : revenu réel ≤ 6 000 € et présumé ≤ 9 500 € (source `tax_scale`). */
export const ART15_1A = { real: 6000, presumed: 9500 };

/** Art. 11 ΚΦΕ : enfant à charge = célibataire mineur (≤ 18 ans), ou ≤ 25 ans étudiant, inscrit au chômage
 *  (ΔΥΠΑ, ex-ΟΑΕΔ) ou au service militaire ; handicap ≥ 67 % sans limite d'âge ; pas à charge si son revenu
 *  imposable annuel dépasse 3 000 € (cohabitant). taxheaven.gr/law/4172/2013/article/11/view */
export const ART11 = { incomeLimit: 3000, disability: 0.67 };
export const ART11_SOURCE = { el: { name: 'Άρθρο 11 ΚΦΕ (ν. 4172/2013): εξαρτώμενα μέλη', url: 'https://www.taxheaven.gr/law/4172/2013/article/11/view' }, en: { name: 'Article 11 of the Income Tax Code (Law 4172/2013): dependent members', url: 'https://www.taxheaven.gr/law/4172/2013/article/11/view' } };

/** Art. 29 par. 1 ΚΦΕ : les bénéfices d'activité indépendante s'ajoutent aux salaires pour l'échelle, sans la
 *  réduction de l'art. 16 ; en cas de salaire, la réduction est celle qui correspond à la part salariale. */
export const ART29_SOURCE = { el: { name: 'Άρθρο 29 ΚΦΕ (ν. 4172/2013): φόρος επιχειρηματικής δραστηριότητας', url: 'https://www.taxheaven.gr/law/4172/2013/article/29/view' }, en: { name: 'Article 29 of the Income Tax Code (Law 4172/2013): tax on business income', url: 'https://www.taxheaven.gr/law/4172/2013/article/29/view' } };

/** Impôt 2025 (ancienne échelle, sans enfants) après la réduction de l'art. 16, inchangée en 2026. */
export function tax2025(taxable: number): number {
  let tax = 0, lower = 0;
  for (const b of SCALE_2025) { const u = b.upTo ?? Infinity; if (taxable > lower) tax += (Math.min(taxable, u) - lower) * b.rate; lower = u; }
  return Math.max(0, tax - Math.min(tax, taxCredit(taxable, 0)));
}
export function marginal2025(taxable: number): number {
  for (const b of SCALE_2025) if (b.upTo === null || taxable <= b.upTo) return b.rate;
  return SCALE_2025[SCALE_2025.length - 1].rate;
}
/** Revenu imposable où la réduction de l'art. 16 tombe à zéro (null : pas de dégressivité). */
export function creditZeroAt(children: number): number | null {
  const T = P.tax;
  if (children >= T.credit_no_taper_from_children) return null;
  return T.credit_taper_threshold + T.credit_by_children[children] / T.credit_taper_per_1000 * 1000;
}

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const gross = (l: L, def = 1500, id = 'g', label?: string) => ({ id, label: label ?? T(l, 'Μικτός μηνιαίος μισθός', 'Monthly gross salary'), def, unit: '€', max: 1_000_000 });
const kids = (l: L, def = 0, max = 6, label?: string) => ({ id: 'k', label: label ?? T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), def, options: Array.from({ length: max + 1 }, (_, k) => ({ value: String(k), label: String(k) })) });
const full = (l: L) => T(l, 'Πλήρης υπολογισμός μισθού', 'Full salary calculator');
const AGE: Age[] = ['u25', '26_30', 'over30'];

export const EXTRA_B: Record<string, (l: string) => MiniSpec> = {
  scalecompare: (l) => ({ title: T(l, 'Παλιά και νέα κλίμακα στο εισόδημά σας', 'Old and new scale on your income'), cta: full(l),
    inputs: [{ id: 'i', label: T(l, 'Φορολογητέο εισόδημα τον χρόνο', 'Annual taxable income'), def: 25000, unit: '€', max: 10_000_000 }],
    run: ({ i }) => { const now = incomeTax(i).tax, before = tax2025(i);
      return { head: [T(l, `Λιγότερος φόρος το ${P.year}`, `Less tax in ${P.year}`), $(before - now, l)], rows: [[T(l, 'Φόρος με την κλίμακα του 2025', 'Tax on the 2025 scale'), $(before, l)], [T(l, `Φόρος με την κλίμακα του ${P.year}`, `Tax on the ${P.year} scale`), $(now, l)], [T(l, 'Οριακός συντελεστής πριν / τώρα', 'Marginal rate before / now'), `${pct(marginal2025(i), l)} / ${pct(incomeTax(i).marginal, l)}`]], note: T(l, 'Χωρίς εξαρτώμενα τέκνα, άνω των 30 ετών.', 'No dependent children, over 30.') }; } }),
  youthage: (l) => ({ title: T(l, 'Ο ίδιος μισθός σε τρεις ηλικίες', 'The same salary at three ages'), cta: full(l),
    inputs: [gross(l, 1600), kids(l, 0, 4)],
    run: ({ g, k }) => { const [a, b, c] = AGE.map((age) => salary({ gross: g, children: k, age }));
      return { head: [T(l, 'Καθαρά έως 25 ετών', 'Net up to age 25'), $(a.net, l)], rows: [[T(l, 'Καθαρά 26-30 ετών', 'Net at 26-30'), $(b.net, l)], [T(l, 'Καθαρά από 31 ετών', 'Net from 31'), $(c.net, l)], [T(l, 'Ετήσιος φόρος: έως 25 / 26-30 / 31+', 'Annual tax: to 25 / 26-30 / 31+'), `${$(a.taxAnnual, l)} / ${$(b.taxAnnual, l)} / ${$(c.taxAnnual, l)}`]] }; } }),
  kidsstep: (l) => ({ title: T(l, 'Πόσο φόρο γλιτώνει το επόμενο παιδί', 'What the next child saves in tax'), cta: full(l),
    inputs: [gross(l, 2000), kids(l, 1, 5, T(l, 'Τέκνα σήμερα', 'Children today'))],
    run: ({ g, k }) => { const a = salary({ gross: g, children: k }), b = salary({ gross: g, children: k + 1 }); const r = bracketRates(k + 1);
      return { head: [T(l, 'Λιγότερος φόρος τον χρόνο', 'Less tax per year'), $(a.taxAnnual - b.taxAnnual, l)], rows: [[T(l, 'Ετήσιος φόρος σήμερα', 'Annual tax today'), $(a.taxAnnual, l)], [T(l, 'Με ένα παιδί ακόμη', 'With one more child'), $(b.taxAnnual, l)], [T(l, 'Συντελεστές 1ου / 2ου / 3ου κλιμακίου', '1st / 2nd / 3rd bracket rates'), `${pct(r[0], l)} / ${pct(r[1], l)} / ${pct(r[2], l)}`]] }; } }),
  creditfade: (l) => ({ title: T(l, 'Πού μηδενίζεται η μείωση φόρου σας', 'Where your tax reduction runs out'), cta: full(l),
    inputs: [kids(l, 0), { id: 'i', label: T(l, 'Φορολογητέο εισόδημα τον χρόνο', 'Annual taxable income'), def: 30000, unit: '€', max: 10_000_000 }],
    run: ({ k, i }) => { const z = creditZeroAt(k); const full0 = taxCredit(0, k), now = taxCredit(i, k);
      return { head: [T(l, 'Η μείωση μηδενίζεται στα', 'The reduction reaches zero at'), z === null ? T(l, 'ποτέ (5+ τέκνα)', 'never (5+ children)') : $(z, l)], rows: [[T(l, 'Πλήρης μείωση', 'Full reduction'), $(full0, l)], [T(l, 'Μείωση στο εισόδημά σας', 'Reduction at your income'), $(now, l)], [T(l, 'Χάθηκε λόγω εισοδήματος', 'Lost because of income'), $(full0 - now, l)]] }; } }),
  efkasplit: (l) => ({ title: T(l, 'Πού πηγαίνει η εισφορά σας', 'Where your contribution goes'), cta: T(l, 'Κόστος εργοδότη', 'Employer cost'),
    inputs: [gross(l, 1500)],
    run: ({ g }) => { const base = Math.min(g, P.efka.ceiling_monthly); const s = salary({ gross: g }); const health = base * P.efka.employee_health;
      return { head: [T(l, 'Υγεία (εργαζόμενος) τον μήνα', 'Health share (employee) per month'), $(health, l)], rows: [[T(l, 'Παροχές σε είδος', 'Benefits in kind'), $(base * EFKA_DETAIL.eeKind, l)], [T(l, 'Παροχές σε χρήμα', 'Cash benefits'), $(base * EFKA_DETAIL.eeCash, l)], [T(l, 'Υπόλοιποι κλάδοι (σύνταξη κ.λπ.)', 'Other branches (pension etc.)'), $(s.efka - health, l)]] }; } }),
  twojobs: (l) => ({ title: T(l, 'Δύο εργοδότες: τι θα βρείτε στην εκκαθάριση', 'Two employers: what the tax return will show'), cta: full(l),
    inputs: [gross(l, 1200, 'a', T(l, 'Μικτά στον 1ο εργοδότη', 'Gross from employer 1')), gross(l, 700, 'b', T(l, 'Μικτά στον 2ο εργοδότη', 'Gross from employer 2'))],
    run: ({ a, b }) => { const x = salary({ gross: a }), y = salary({ gross: b }); const real = incomeTax(x.taxableAnnual + y.taxableAnnual).tax; const diff = real - x.taxAnnual - y.taxAnnual;
      return { head: [diff >= 0 ? T(l, 'Επιπλέον φόρος στην εκκαθάριση', 'Extra tax due on the return') : T(l, 'Επιστροφή στην εκκαθάριση', 'Refund on the return'), $(Math.abs(diff), l)], rows: [[T(l, 'ΦΜΥ 1ου εργοδότη τον χρόνο', 'Withheld by employer 1 per year'), $(x.taxAnnual, l)], [T(l, 'ΦΜΥ 2ου εργοδότη τον χρόνο', 'Withheld by employer 2 per year'), $(y.taxAnnual, l)], [T(l, 'Πραγματικός ετήσιος φόρος', 'Actual annual tax'), $(real, l)]], note: T(l, '14 καταβολές σε κάθε εργοδότη, άνω των 30, χωρίς τέκνα.', '14 payments from each employer, over 30, no children.') }; } }),
};
