/**
 * Calculateurs complets des pages d'impôts annuels (RECETTE §17) : déclaration, impôt sur le
 * revenu 2025 → 2026, droit de mutation. Moteur : `engine/foroi.ts` et `engine/gr.ts`.
 */
import { incomeTax, PARAMS as P, type Age } from './engine/gr';
import { taxReturn, transferTax, businessTax, type BuyerStatus } from './engine/foroi';
import { formatMoney, pct } from './format';
import type { CalcSpec, CalcValues, CalcField } from './calc-specs';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $ = (x: number, l: L) => formatMoney(x, 0, l);
const n = (v: CalcValues, k: string) => Number(v[k]) || 0;
const s = (v: CalcValues, k: string) => String(v[k]);
const methodLabel = (l: L) => T(l, 'Πώς υπολογίζουμε (μεθοδολογία)', 'How we calculate (methodology)');
const footer = (l: L) => T(l, `Συντελεστές από τον ΚΦΕ και τον Κώδικα Φορολογίας Περιουσίας, όπως ισχύουν το ${P.year} · ο υπολογισμός γίνεται στον browser σας, τίποτα δεν αποστέλλεται.`, `Rates from the Greek Income Tax Code and Property Tax Code as in force in ${P.year} · calculated in your browser, nothing is sent.`);
const kids = (l: L): CalcField => ({ id: 'kids', label: T(l, 'Εξαρτώμενα τέκνα', 'Dependent children'), kind: 'select', def: '0', options: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: k === 6 ? T(l, '6 ή περισσότερα', '6 or more') : String(k) })) });
const age = (l: L): CalcField => ({ id: 'age', label: T(l, 'Ηλικία', 'Age'), kind: 'select', def: 'over30', options: [{ value: 'u25', label: T(l, 'έως 25 ετών', 'up to 25') }, { value: '26_30', label: T(l, '26 έως 30 ετών', '26 to 30') }, { value: 'over30', label: T(l, '31 ετών και άνω', '31 or older') }] });
const C = { tax: '#b91c1c', rent: '#a16207', card: '#7c3aed', paid: '#15803d' };

export const CALCS_FOROI: Record<string, (l: L) => CalcSpec> = {
  taxreturn: (l) => ({
    fields: [
      { id: 'sal', label: T(l, 'Φορολογητέο από μισθούς ή σύνταξη', 'Taxable salary or pension income'), kind: 'number', def: 18000, unit: '€', max: 10_000_000, help: T(l, 'Μικτά μείον εισφορές, όπως στη βεβαίωση αποδοχών.', 'Gross minus contributions, as on your annual earnings statement.') },
      { id: 'wh', label: T(l, 'Φόρος που παρακρατήθηκε', 'Tax already withheld'), kind: 'number', def: 1843, unit: '€', max: 10_000_000, help: T(l, 'Από τη βεβαίωση του εργοδότη ή του φορέα.', 'From your employer’s or pension fund’s statement.') },
      { id: 'rent', label: T(l, 'Ενοίκια που εισπράξατε τον χρόνο', 'Rent received in the year'), kind: 'number', def: 6000, unit: '€', max: 10_000_000 },
      { id: 'card', label: T(l, 'Δαπάνες με κάρτα ή e-banking', 'Spending by card or e-banking'), kind: 'number', def: 6000, unit: '€', max: 10_000_000 },
      kids(l), age(l),
    ],
    run: (v) => {
      const r = taxReturn({ salaryTaxable: n(v, 'sal'), withheld: n(v, 'wh'), rent: n(v, 'rent'), cardSpent: n(v, 'card'), children: n(v, 'kids'), age: s(v, 'age') as Age });
      const refund = r.refund > 0;
      return {
        headLabel: refund ? T(l, 'Επιστροφή φόρου', 'Tax refund') : T(l, 'Φόρος να πληρώσετε', 'Tax left to pay'), head: $(refund ? r.refund : r.toPay, l),
        sub: refund ? T(l, 'Η παρακράτηση ξεπέρασε τον φόρο του έτους.', 'More was withheld than the year’s tax.') : T(l, `${P.tax_return.installments} δόσεις των ${$(r.installment, l)} ή ${$(r.lumpSum[0].pay, l)} εφάπαξ με έκπτωση ${pct(r.lumpSum[0].rate, l)}`, `${P.tax_return.installments} instalments of ${$(r.installment, l)} or ${$(r.lumpSum[0].pay, l)} in one go with a ${pct(r.lumpSum[0].rate, l)} discount`),
        bar: [{ label: T(l, 'Φόρος μισθών', 'Tax on pay'), value: r.salaryTax, color: C.tax }, { label: T(l, 'Φόρος ενοικίων', 'Tax on rent'), value: r.rentTax, color: C.rent }, { label: T(l, 'Πρόστιμο κάρτας', 'Card penalty'), value: r.card.penalty, color: C.card }],
        rows: [
          { label: T(l, 'Φόρος κλίμακας μισθών', 'Scale tax on pay'), value: $(r.salaryScale, l) },
          { label: T(l, 'Μείωση φόρου άρθρου 16', 'Article 16 reduction'), value: `−${$(r.credit, l)}` },
          { label: T(l, `Φόρος ενοικίων (στο ${pct(1 - P.rental_tax.expense_deduction, l)} του ποσού)`, `Rent tax (on ${pct(1 - P.rental_tax.expense_deduction, l)} of the rent)`), value: $(r.rentTax, l) },
          { label: T(l, `Πρόστιμο ${pct(P.tax_return.card_penalty_rate, l)} για ${$(r.card.shortfall, l)} δαπάνες που λείπουν`, `${pct(P.tax_return.card_penalty_rate, l)} penalty on ${$(r.card.shortfall, l)} missing spending`), value: $(r.card.penalty, l) },
          { label: T(l, 'Συνολικός φόρος έτους', 'Total tax for the year'), value: $(r.total, l), strong: true },
          { label: T(l, 'Μείον παρακράτηση', 'Less tax withheld'), value: `−${$(r.withheld, l)}` },
        ],
        note: T(l, `Εισοδήματα του ${P.year}, δήλωση που υποβάλλεται από ${P.tax_return.filing_from} έως ${P.tax_return.filing_to} ${P.year + 1}. Δεν περιλαμβάνονται επιχειρηματικά εισοδήματα, τεκμήρια και ειδικές απαλλαγές.`, `Income earned in ${P.year}, return filed from ${P.tax_return.filing_from_en} to ${P.tax_return.filing_to_en} ${P.year + 1}. Business income, deemed-income tests and special exemptions are not modelled.`),
      };
    }, footer: footer(l), methodLabel: methodLabel(l), barLabel: T(l, 'Από τι αποτελείται ο φόρος', 'What the tax is made of'),
  }),

  incometax: (l) => ({
    fields: [
      { id: 'ty', label: T(l, 'Είδος εισοδήματος', 'Type of income'), kind: 'select', def: 'sal', wide: true, options: [{ value: 'sal', label: T(l, 'Μισθός ή σύνταξη', 'Salary or pension') }, { value: 'bus', label: T(l, 'Ελεύθερο επάγγελμα', 'Self-employed') }] },
      { id: 'i', label: T(l, 'Φορολογητέο εισόδημα τον χρόνο', 'Annual taxable income'), kind: 'number', def: 24000, unit: '€', max: 10_000_000, wide: true, help: T(l, 'Μισθός ή σύνταξη μετά τις εισφορές, ή καθαρά κέρδη του ελεύθερου επαγγελματία.', 'Salary or pension after contributions, or the self-employed net profit.') },
      kids(l), age(l),
      { id: 'st', label: T(l, 'Στα 3 πρώτα έτη, με τζίρο έως 10.000 €;', 'First 3 years, turnover up to €10,000?'), kind: 'toggle', def: '0', options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }], show: (v) => s(v, 'ty') === 'bus' },
    ],
    run: (v) => {
      const i = n(v, 'i'), k = n(v, 'kids'), a = s(v, 'age') as Age;
      const bus = s(v, 'ty') === 'bus';
      const t = incomeTax(i, k, a);
      const b = businessTax(i, k, a, s(v, 'st') === '1');
      const tax = bus ? b.tax : t.tax;
      return {
        headLabel: T(l, `Φόρος εισοδήματος ${P.year}`, `Income tax ${P.year}`), head: $(tax, l),
        sub: T(l, `${$(tax / 12, l)} τον μήνα · μέσος συντελεστής ${pct(i > 0 ? tax / i : 0, l)}`, `${$(tax / 12, l)} a month · average rate ${pct(i > 0 ? tax / i : 0, l)}`),
        bar: [{ label: T(l, 'Φόρος', 'Tax'), value: tax, color: C.tax }, { label: T(l, 'Μένει', 'You keep'), value: Math.max(0, i - tax), color: C.paid }],
        rows: bus ? [
          { label: T(l, 'Φόρος κλίμακας', 'Scale tax'), value: $(b.scale, l) },
          ...(b.starterCut > 0 ? [{ label: T(l, 'Μισός συντελεστής 1ου κλιμακίου', 'Halved first-band rate'), value: `−${$(b.starterCut, l)}` }] : []),
          { label: T(l, 'Μείωση άρθρου 16', 'Article 16 reduction'), value: T(l, 'δεν ισχύει', 'not available') },
          { label: T(l, 'Ο ίδιος φόρος ως μισθωτός', 'Same income as an employee'), value: $(b.asSalary, l) },
          { label: T(l, 'Οριακός συντελεστής', 'Marginal rate'), value: pct(b.marginal, l), strong: true },
        ] : [
          { label: T(l, 'Φόρος κλίμακας', 'Scale tax'), value: $(t.scale, l) },
          { label: T(l, 'Μείωση φόρου άρθρου 16', 'Article 16 reduction'), value: `−${$(t.credit, l)}` },
          { label: T(l, 'Ο ίδιος φόρος ως ελεύθερος επαγγελματίας', 'Same income if self-employed'), value: $(b.scale, l) },
          { label: T(l, 'Οριακός συντελεστής', 'Marginal rate'), value: pct(t.marginal, l), strong: true },
        ],
        note: bus ? T(l, 'Δεν περιλαμβάνεται το ελάχιστο τεκμαρτό εισόδημα του άρθρου 28Α ούτε μισθός μαζί με τα κέρδη.', 'Not included: the article 28A minimum deemed income, or salary on top of the profit.') : T(l, 'Ίδια κλίμακα για μισθούς και συντάξεις· οι εισφορές έχουν ήδη αφαιρεθεί από το ποσό.', 'Same scale for salaries and pensions; contributions are already deducted from the amount.'),
      };
    }, footer: footer(l), methodLabel: methodLabel(l), barLabel: T(l, 'Φόρος και εισόδημα που μένει', 'Tax and income left'),
  }),

  transfer: (l) => ({
    fields: [
      { id: 'p', label: T(l, 'Τίμημα συμβολαίου', 'Contract price'), kind: 'number', def: 180000, unit: '€', max: 100_000_000 },
      { id: 'o', label: T(l, 'Αντικειμενική αξία', 'Objective (zone) value'), kind: 'number', def: 150000, unit: '€', max: 100_000_000, help: T(l, 'Από το φύλλο υπολογισμού του συμβολαιογράφου ή του μηχανικού.', 'From the notary’s or engineer’s value sheet.') },
      { id: 'f', label: T(l, 'Πρώτη κατοικία;', 'First home?'), kind: 'toggle', def: '0', options: [{ value: '0', label: T(l, 'Όχι', 'No') }, { value: '1', label: T(l, 'Ναι', 'Yes') }] },
      { id: 't', label: T(l, 'Ακίνητο', 'Property'), kind: 'toggle', def: 'home', options: [{ value: 'home', label: T(l, 'Κατοικία', 'Home') }, { value: 'plot', label: T(l, 'Οικόπεδο', 'Plot') }], show: (v) => s(v, 'f') === '1' },
      { id: 'st', label: T(l, 'Οικογενειακή κατάσταση', 'Family status'), kind: 'select', def: 'single', options: [{ value: 'single', label: T(l, 'Άγαμος', 'Single') }, { value: 'married', label: T(l, 'Έγγαμος ή σύμφωνο', 'Married or civil partnership') }, { value: 'married_disabled', label: T(l, 'Έγγαμος με αναπηρία 67 %+', 'Married, 67%+ disability') }], show: (v) => s(v, 'f') === '1' },
      { ...kids(l), id: 'k', show: (v) => s(v, 'f') === '1' },
    ],
    run: (v) => {
      const first = s(v, 'f') === '1';
      const r = transferTax({ price: n(v, 'p'), objective: n(v, 'o'), firstHome: first, status: s(v, 'st') as BuyerStatus, children: n(v, 'k'), plot: s(v, 't') === 'plot' });
      return {
        headLabel: T(l, 'Φόρος μεταβίβασης', 'Property transfer tax'), head: $(r.total, l),
        sub: T(l, `Πραγματικός συντελεστής ${pct(r.effective, l)} επί ${$(r.value, l)}`, `Effective rate ${pct(r.effective, l)} on ${$(r.value, l)}`),
        rows: [
          { label: T(l, 'Φορολογητέα αξία (η μεγαλύτερη)', 'Taxable value (the higher one)'), value: $(r.value, l) },
          ...(first ? [{ label: T(l, 'Απαλλαγή πρώτης κατοικίας έως', 'First-home exemption up to'), value: $(r.limit, l) }] : []),
          { label: T(l, 'Ποσό που φορολογείται', 'Amount taxed'), value: $(r.taxable, l) },
          { label: T(l, `Φόρος ${pct(P.transfer_tax.rate, l)}`, `Tax at ${pct(P.transfer_tax.rate, l)}`), value: $(r.main, l) },
          { label: T(l, `Υπέρ δήμων ${pct(P.transfer_tax.municipal_surcharge, l)} του φόρου`, `Municipal ${pct(P.transfer_tax.municipal_surcharge, l)} of the tax`), value: $(r.municipal, l) },
          { label: T(l, 'Σύνολο που πληρώνει ο αγοραστής', 'Total paid by the buyer'), value: $(r.total, l), strong: true },
        ],
        note: T(l, 'Μεταβίβαση έναντι τιμήματος από ιδιώτη. Σε νεόδμητα με ΦΠΑ και σε γονική παροχή ή κληρονομιά ισχύουν άλλοι κανόνες.', 'Purchase from a private seller. New builds subject to VAT, gifts and inheritance follow other rules.'),
      };
    }, footer: footer(l), methodLabel: methodLabel(l),
  }),
};
