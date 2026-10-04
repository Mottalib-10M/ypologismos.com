/** Mini-simulateurs du lot « g » : impôts annuels (RECETTE §9.3). Moteur : engine/foroi.ts. */
import { PARAMS as P } from './engine/gr';
import { rentalTax, cardSpending, tax2025vs2026, firstHomeLimit, transferTax, businessTax, type BuyerStatus } from './engine/foroi';
import { formatMoney, pct } from './format';
import type { MiniSpec } from './mini-types';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const kids = (l: L, def = 0) => ({ id: 'k', label: T(l, 'Τέκνα', 'Children'), def, options: [0, 1, 2, 3, 4, 5].map((k) => ({ value: String(k), label: String(k) })) });
const STATUS: BuyerStatus[] = ['single', 'married', 'married_disabled'];

export const EXTRA_G: Record<string, (l: string) => MiniSpec> = {
  /** Dépenses par carte manquantes et majoration de 22 %. */
  cardgap: (l) => ({ title: T(l, 'Φτάνουν οι δαπάνες σας με κάρτα;', 'Is your card spending enough?'), cta: T(l, 'Πλήρης υπολογισμός δήλωσης', 'Full tax return calculator'),
    inputs: [{ id: 'i', label: T(l, 'Πραγματικό εισόδημα τον χρόνο', 'Actual income per year'), def: 20000, unit: '€', max: 10_000_000 }, { id: 's', label: T(l, 'Δαπάνες με κάρτα', 'Card spending'), def: 4000, unit: '€', max: 10_000_000 }],
    run: ({ i, s }) => { const c = cardSpending(i, s);
      return { head: [T(l, 'Επιπλέον φόρος', 'Extra tax'), $(c.penalty, l)], rows: [[T(l, 'Απαιτούμενες δαπάνες', 'Spending required'), $(c.required, l)], [T(l, 'Λείπουν', 'Missing'), $(c.shortfall, l)], [T(l, 'Συντελεστής προστίμου', 'Penalty rate'), pct(P.tax_return.card_penalty_rate, l)]] }; } }),

  /** Loyers : échelle 2025 contre échelle 2026. */
  rentscale: (l) => ({ title: T(l, 'Ο φόρος των ενοικίων σας, 2025 και 2026', 'Your rent tax, 2025 and 2026'), cta: T(l, 'Πλήρης υπολογισμός δήλωσης', 'Full tax return calculator'),
    inputs: [{ id: 'r', label: T(l, 'Ενοίκια τον χρόνο', 'Rent per year'), def: 18000, unit: '€', max: 10_000_000 }],
    run: ({ r }) => { const a = rentalTax(r, 2026), b = rentalTax(r, 2025);
      return { head: [T(l, `Φόρος ενοικίων ${P.year}`, `Rent tax ${P.year}`), $(a.tax, l)], rows: [[T(l, 'Με την κλίμακα του 2025', 'On the 2025 scale'), $(b.tax, l)], [T(l, 'Διαφορά', 'Difference'), $(b.tax - a.tax, l)], [T(l, 'Μέσος συντελεστής', 'Average rate'), pct(a.average, l)]] }; } }),

  /** Escompte de paiement comptant contre huit mensualités. */
  lumpsum: (l) => ({ title: T(l, 'Εφάπαξ ή σε δόσεις;', 'Pay at once or in instalments?'), cta: T(l, 'Πλήρης υπολογισμός δήλωσης', 'Full tax return calculator'),
    inputs: [{ id: 'f', label: T(l, 'Φόρος της δήλωσης', 'Tax on the return'), def: 1200, unit: '€', max: 10_000_000 }],
    run: ({ f }) => { const D = P.tax_return.discounts;
      return { head: [T(l, `Εφάπαξ με δήλωση έως ${D[0].by}`, `Lump sum, filed by ${D[0].by_en}`), $(f * (1 - D[0].rate), l)], rows: [[T(l, `Δήλωση έως ${D[1].by}`, `Filed by ${D[1].by_en}`), $(f * (1 - D[1].rate), l)], [T(l, `Δήλωση έως ${D[2].by}`, `Filed by ${D[2].by_en}`), $(f * (1 - D[2].rate), l)], [T(l, `${P.tax_return.installments} δόσεις των`, `${P.tax_return.installments} instalments of`), $(f / P.tax_return.installments, l)]] }; } }),

  /** Gain de la nouvelle échelle pour un salarié sans enfant. */
  tax2526: (l) => ({ title: T(l, 'Πόσο κερδίζετε από την κλίμακα του 2026', 'What the 2026 scale saves you'), cta: T(l, 'Υπολογισμός φόρου εισοδήματος', 'Income tax calculator'),
    inputs: [{ id: 'i', label: T(l, 'Φορολογητέο εισόδημα', 'Taxable income'), def: 30000, unit: '€', max: 10_000_000 }],
    run: ({ i }) => { const c = tax2025vs2026(i);
      return { head: [T(l, 'Λιγότερος φόρος τον χρόνο', 'Less tax per year'), $(c.saving, l)], rows: [[T(l, 'Φόρος 2025', '2025 tax'), $(c.tax25, l)], [T(l, `Φόρος ${P.year}`, `${P.year} tax`), $(c.tax26, l)], [T(l, 'Τον μήνα', 'Per month'), $(c.saving / 12, l)]], note: T(l, 'Χωρίς τέκνα, άνω των 30.', 'No children, over 30.') }; } }),

  /** Plafond d'exonération de la première résidence. */
  firsthome: (l) => ({ title: T(l, 'Μέχρι πόσο αγοράζετε χωρίς φόρο μεταβίβασης', 'How much you can buy free of transfer tax'), cta: T(l, 'Πλήρης υπολογισμός φόρου μεταβίβασης', 'Full transfer tax calculator'),
    inputs: [{ id: 's', label: T(l, 'Κατάσταση', 'Status'), def: 1, options: [{ value: '0', label: T(l, 'Άγαμος', 'Single') }, { value: '1', label: T(l, 'Έγγαμος', 'Married') }, { value: '2', label: T(l, 'Έγγαμος, αναπηρία 67 %+', 'Married, 67%+ disability') }] }, kids(l, 2)],
    run: ({ s, k }) => { const st = STATUS[s] ?? 'single'; const lim = firstHomeLimit(st, k); const over = transferTax({ price: lim + 50000, firstHome: true, status: st, children: k });
      return { head: [T(l, 'Όριο απαλλαγής κατοικίας', 'Home exemption limit'), $(lim, l)], rows: [[T(l, 'Όριο για οικόπεδο', 'Limit for a plot'), $(firstHomeLimit(st, k, true), l)], [T(l, 'Φόρος αν πληρώσετε 50.000 € παραπάνω', 'Tax if you pay €50,000 more'), $(over.total, l)]] }; } }),

  /** Droit de mutation simple sur une valeur. */
  transfervalue: (l) => ({ title: T(l, 'Φόρος μεταβίβασης για ένα ποσό', 'Transfer tax on a given value'), cta: T(l, 'Πλήρης υπολογισμός φόρου μεταβίβασης', 'Full transfer tax calculator'),
    inputs: [{ id: 'v', label: T(l, 'Φορολογητέα αξία', 'Taxable value'), def: 120000, unit: '€', max: 100_000_000 }],
    run: ({ v }) => { const t = transferTax({ price: v });
      return { head: [T(l, 'Φόρος μεταβίβασης', 'Transfer tax'), $(t.total, l)], rows: [[T(l, `Φόρος ${pct(P.transfer_tax.rate, l)}`, `Tax at ${pct(P.transfer_tax.rate, l)}`), $(t.main, l)], [T(l, 'Υπέρ δήμων', 'Municipal share'), $(t.municipal, l)], [T(l, 'Πραγματικός συντελεστής', 'Effective rate'), pct(t.effective, l)]] }; } }),

  /** Même revenu, salarié contre indépendant (art. 16 contre art. 29). */
  busvssal: (l) => ({ title: T(l, 'Το ίδιο εισόδημα ως μισθωτός και ως ελεύθερος επαγγελματίας', 'The same income as an employee and self-employed'), cta: T(l, 'Υπολογισμός φόρου εισοδήματος', 'Income tax calculator'),
    inputs: [{ id: 'i', label: T(l, 'Φορολογητέο εισόδημα', 'Taxable income'), def: 15000, unit: '€', max: 10_000_000 }, kids(l)],
    run: ({ i, k }) => { const b = businessTax(i, k);
      return { head: [T(l, 'Επιπλέον φόρος ως ελεύθερος επαγγελματίας', 'Extra tax if self-employed'), $(b.gapVsSalary, l)], rows: [[T(l, 'Ως μισθωτός ή συνταξιούχος', 'As an employee or pensioner'), $(b.asSalary, l)], [T(l, 'Ως ελεύθερος επαγγελματίας', 'As self-employed'), $(b.tax, l)]] }; } }),

  /** Trois premières années d'activité : taux de la 1re tranche divisé par deux. */
  starter: (l) => ({ title: T(l, 'Η έκπτωση των τριών πρώτων ετών δραστηριότητας', 'The first-three-years relief for new businesses'), cta: T(l, 'Υπολογισμός φόρου εισοδήματος', 'Income tax calculator'),
    inputs: [{ id: 'i', label: T(l, 'Καθαρά κέρδη', 'Net profit'), def: 8000, unit: '€', max: 10_000_000 }],
    run: ({ i }) => { const a = businessTax(i, 0, 'over30', true), b = businessTax(i);
      return { head: [T(l, 'Φόρος στα 3 πρώτα έτη', 'Tax in the first 3 years'), $(a.tax, l)], rows: [[T(l, 'Χωρίς την έκπτωση', 'Without the relief'), $(b.tax, l)], [T(l, 'Όφελος τον χρόνο', 'Saving per year'), $(a.starterCut, l)]], note: T(l, `Μόνο αν ο ετήσιος τζίρος δεν ξεπερνά ${$(P.business.starter_gross_limit, l)}.`, `Only if annual turnover stays at or below ${$(P.business.starter_gross_limit, l)}.`) }; } }),
};
