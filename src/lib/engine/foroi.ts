/**
 * Impôts hors salaire mensuel — fonctions pures, paramètres dans `data/params-2026.json`.
 *
 *  - Déclaration annuelle (φορολογική δήλωση) : salaires/pensions sur l'échelle de l'art. 15 ΚΦΕ
 *    avec la réduction de l'art. 16 (moteur gr.ts), revenus fonciers sur l'échelle autonome de
 *    l'art. 40 par. 4 après la déduction de 5 % de l'art. 39 par. 3, majoration de 22 % sur le
 *    manque de dépenses par carte (art. 15 par. 6), puis impôt retenu à la source, huit
 *    mensualités et escompte de paiement comptant (art. 67).
 *  - Comparaison 2025 → 2026 (ν. 4646/2019 contre ν. 5246/2025), contribuable sans enfant.
 *  - Droit de mutation (φόρος μεταβίβασης) : 3 % de la valeur imposable + 3 % de ce droit pour
 *    les communes (ΚΦΠ art. 25 et 27), exonération de la première résidence (art. 40 et 41).
 */
import { PARAMS as P, incomeTax, type Age } from './gr';

const pos = (x: number) => (x > 0 ? x : 0);
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
type Band = { upTo: number | null; rate: number };

/** Impôt d'une échelle progressive, tranche par tranche. */
export function bandTax(amount: number, bands: Band[]): number {
  let tax = 0, lower = 0;
  for (const b of bands) {
    const upper = b.upTo ?? Infinity;
    if (amount > lower) tax += (Math.min(amount, upper) - lower) * b.rate;
    lower = upper;
  }
  return tax;
}

/** Impôt sur les loyers d'une année (art. 39 par. 3 et 40 par. 4 ΚΦΕ). */
export function rentalTax(grossRent: number, year: 2025 | 2026 = 2026) {
  const R = P.rental_tax;
  const gross = pos(num(grossRent));
  const net = gross * (1 - R.expense_deduction);
  const bands = (year === 2025 ? R.brackets_2025 : R.brackets_2026) as Band[];
  const tax = bandTax(net, bands);
  return { gross, deduction: gross - net, net, tax, average: gross > 0 ? tax / gross : 0 };
}

/** Dépenses par carte exigées et majoration si elles manquent (art. 15 par. 6 ΚΦΕ). */
export function cardSpending(realIncome: number, declared: number) {
  const T = P.tax_return;
  const required = Math.min(pos(num(realIncome)) * T.card_spending_share, T.card_spending_cap);
  const shortfall = pos(required - pos(num(declared)));
  return { required, shortfall, penalty: shortfall * T.card_penalty_rate };
}

export interface ReturnInput {
  /** Revenu imposable annuel de salaires et pensions (brut moins cotisations). */
  salaryTaxable: number;
  /** Loyers bruts encaissés dans l'année. */
  rent?: number;
  children?: number;
  age?: Age;
  /** Impôt déjà retenu par l'employeur ou la caisse de retraite. */
  withheld?: number;
  /** Dépenses payées par carte ou virement dans l'année ; absent = objectif atteint. */
  cardSpent?: number;
}
export function taxReturn(input: ReturnInput) {
  const sal = pos(num(input.salaryTaxable));
  const t = incomeTax(sal, input.children ?? 0, input.age ?? 'over30');
  const r = rentalTax(num(input.rent));
  const card = input.cardSpent === undefined ? { required: Math.min(sal * P.tax_return.card_spending_share, P.tax_return.card_spending_cap), shortfall: 0, penalty: 0 } : cardSpending(sal, input.cardSpent);
  const total = t.tax + r.tax + card.penalty;
  const withheld = pos(num(input.withheld));
  const balance = total - withheld;
  const toPay = pos(balance);
  return {
    salaryTax: t.tax, salaryScale: t.scale, credit: t.credit, rentTax: r.tax, rentNet: r.net, card,
    total, withheld, balance, toPay, refund: pos(-balance),
    installment: toPay / P.tax_return.installments,
    lumpSum: P.tax_return.discounts.map((d) => ({ by: d.by, by_en: d.by_en, rate: d.rate, pay: toPay * (1 - d.rate), saving: toPay * d.rate })),
  };
}

/** Impôt d'un salarié sans enfant de plus de 30 ans : année 2025 (ν. 4646/2019) contre 2026. */
export function tax2025vs2026(taxable: number) {
  const O = P.tax_2025;
  const t = pos(num(taxable));
  const scale25 = bandTax(t, O.brackets as Band[]);
  const credit25 = Math.min(scale25, pos(O.credit_no_children - pos(t - O.credit_taper_threshold) * O.credit_taper_per_1000 / 1000));
  const tax25 = pos(scale25 - credit25);
  const tax26 = incomeTax(t, 0, 'over30').tax;
  return { tax25, tax26, saving: tax25 - tax26 };
}

export type BuyerStatus = 'single' | 'married' | 'married_disabled';
/** Plafond d'exonération de la première résidence (ΚΦΠ art. 41 par. 1). */
export function firstHomeLimit(status: BuyerStatus, children = 0, plot = false) {
  const c = Math.max(0, Math.floor(num(children)));
  const extra = (a: number, b: number) => Math.min(c, 2) * a + Math.max(0, c - 2) * b;
  if (plot) { const L = P.transfer_tax.first_plot; return (status === 'single' ? L.single : L.married) + extra(L.child_1_2, L.child_3_plus); }
  const L = P.transfer_tax.first_home;
  return L[status] + extra(L.child_1_2, L.child_3_plus);
}

export interface TransferInput { price: number; objective?: number; firstHome?: boolean; status?: BuyerStatus; children?: number; plot?: boolean }
/** Droit de mutation : la plus haute des deux valeurs, part exonérée de la première résidence. */
export function transferTax(input: TransferInput) {
  const X = P.transfer_tax;
  const value = Math.max(pos(num(input.price)), pos(num(input.objective)));
  const limit = input.firstHome ? firstHomeLimit(input.status ?? 'single', input.children ?? 0, input.plot) : 0;
  const taxable = pos(value - limit);
  const main = taxable * X.rate;
  const municipal = main * X.municipal_surcharge;
  return { value, limit, exempt: Math.min(value, limit), taxable, main, municipal, total: main + municipal, effective: value > 0 ? (main + municipal) / value : 0 };
}

/**
 * Bénéfice d'une activité indépendante seule (art. 29 ΚΦΕ) : échelle de l'art. 15, sans la
 * réduction de l'art. 16 ; les trois premières années d'activité, si le chiffre d'affaires ne
 * dépasse pas 10 000 €, le taux de la 1re tranche est divisé par deux (art. 29 par. 2).
 * Le cumul salaire + bénéfice n'est pas modélisé : le partage de la réduction n'est pas écrit.
 */
export function businessTax(profit: number, children = 0, age: Age = 'over30', starter = false) {
  const p = pos(num(profit));
  const t = incomeTax(p, children, age);
  const first = P.tax.brackets[0].upTo as number;
  const cut = starter ? Math.min(p, first) * t.rates[0] * P.business.starter_first_bracket_cut : 0;
  const tax = pos(t.scale - cut);
  const asSalary = t.tax;
  return { profit: p, scale: t.scale, starterCut: cut, tax, average: p > 0 ? tax / p : 0, marginal: t.marginal, asSalary, gapVsSalary: tax - asSalary };
}
