/** Contexte chiffré d'une page « Χ € μικτά σε καθαρά » : tout vient du moteur, formaté dans la langue. */
import { salary, incomeTax, christmasBonus, easterBonus, leaveAllowance, severance, PARAMS as P } from './engine/gr';
import { formatMoney, pct } from './format';
import { facts, type Facts } from './facts';

export interface AmountCtx {
  F: Facts; lang: 'el' | 'en'; amount: number;
  gross: string; net: string; efka: string; tax: string; netAnnual: string; netPer12: string; taxAnnual: string; cost: string; costAnnual: string; employer: string;
  marginal: string; average: string; netShare: string; taxable: string;
  net1kid: string; net2kids: string; net3kids: string; netU25: string; net2630: string; net12: string;
  xmas: string; easter: string; leave: string; severance8: string;
  vsMin: string; vsAvg: string;
  raw: { net: number; netAnnual: number; taxAnnual: number; cost: number; taxable: number; marginal: number };
  $: (x: number) => string;
}
export function amountCtx(amount: number, lang: 'el' | 'en'): AmountCtx {
  const $ = (x: number) => formatMoney(x, 0, lang);
  const s = salary({ gross: amount });
  return {
    F: facts(lang), lang, amount,
    gross: $(amount), net: $(s.net), efka: $(s.efka), tax: $(s.tax), netAnnual: $(s.netAnnual), netPer12: $(s.netPer12), taxAnnual: $(s.taxAnnual), cost: $(s.cost), costAnnual: $(s.costAnnual), employer: $(s.employer),
    marginal: pct(s.marginal, lang), average: pct(s.averageTax, lang), netShare: pct(s.net / amount, lang), taxable: $(s.taxableAnnual),
    net1kid: $(salary({ gross: amount, children: 1 }).net), net2kids: $(salary({ gross: amount, children: 2 }).net), net3kids: $(salary({ gross: amount, children: 3 }).net),
    netU25: $(salary({ gross: amount, age: 'u25' }).net), net2630: $(salary({ gross: amount, age: '26_30' }).net), net12: $(salary({ gross: amount * 14 / 12, payments: 12 }).net),
    xmas: $(christmasBonus({ pay: amount }).amount), easter: $(easterBonus({ pay: amount }).amount), leave: $(leaveAllowance({ pay: amount }).amount), severance8: $(severance({ pay: amount, years: 8 }).total),
    vsMin: pct(amount / P.minimum_wage.monthly - 1, lang), vsAvg: pct(amount / P.minimum_wage.average_wage_2025, lang),
    raw: { net: s.net, netAnnual: s.netAnnual, taxAnnual: s.taxAnnual, cost: s.cost, taxable: s.taxableAnnual, marginal: s.marginal },
    $,
  };
}
export { incomeTax };
