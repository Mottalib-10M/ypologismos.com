import { describe, it, expect } from 'vitest';
import { bandTax, rentalTax, cardSpending, taxReturn, tax2025vs2026, firstHomeLimit, transferTax } from './foroi';
import { incomeTax, PARAMS as P } from './gr';

describe('ενοίκια: άρθρο 40 παρ. 4 ΚΦΕ (ν. 5246/2025 άρθρο 8)', () => {
  it('κλίμακα 2026: 15 % έως 12.000, 25 % έως 24.000, 35 % έως 36.000, 45 % πάνω', () => {
    expect(bandTax(12000, P.rental_tax.brackets_2026)).toBeCloseTo(1800, 6);
    expect(bandTax(24000, P.rental_tax.brackets_2026)).toBeCloseTo(1800 + 3000, 6);
    expect(bandTax(40000, P.rental_tax.brackets_2026)).toBeCloseTo(1800 + 3000 + 4200 + 1800, 6);
  });
  it('κλίμακα 2025: 35 % από 12.000 έως 35.000', () => {
    expect(bandTax(20000, P.rental_tax.brackets_2025)).toBeCloseTo(1800 + 8000 * 0.35, 6);
  });
  it('έκπτωση 5 % πριν από την κλίμακα (άρθρο 39 παρ. 3)', () => {
    const r = rentalTax(10000);
    expect(r.net).toBeCloseTo(9500, 6);
    expect(r.tax).toBeCloseTo(1425, 6);
  });
  it('16.000 € ενοίκια: 2026 φθηνότερο από 2025 κατά 10 μονάδες στο κομμάτι πάνω από 12.000', () => {
    const net = 16000 * 0.95;
    expect(rentalTax(16000, 2025).tax - rentalTax(16000, 2026).tax).toBeCloseTo((net - 12000) * 0.1, 6);
  });
});

describe('δαπάνες με κάρτα: άρθρο 15 παρ. 6 ΚΦΕ', () => {
  it('30 % του εισοδήματος, πρόστιμο 22 % στη διαφορά', () => {
    const c = cardSpending(20000, 4000);
    expect(c.required).toBe(6000);
    expect(c.penalty).toBeCloseTo(440, 6);
  });
  it('το απαιτούμενο σταματά στις 20.000 €', () => {
    expect(cardSpending(200000, 0).required).toBe(20000);
  });
});

describe('φορολογική δήλωση', () => {
  it('μισθωτός χωρίς ενοίκια με σωστή παρακράτηση: τίποτα να πληρώσει', () => {
    const t = incomeTax(18000).tax;
    const r = taxReturn({ salaryTaxable: 18000, withheld: t });
    expect(r.toPay).toBeCloseTo(0, 6);
    expect(r.refund).toBeCloseTo(0, 6);
  });
  it('ενοίκια 6.000 € προστίθενται αυτοτελώς', () => {
    const r = taxReturn({ salaryTaxable: 18000, rent: 6000, withheld: incomeTax(18000).tax });
    expect(r.rentTax).toBeCloseTo(6000 * 0.95 * 0.15, 6);
    expect(r.toPay).toBeCloseTo(855, 6);
    expect(r.installment).toBeCloseTo(855 / 8, 6);
    expect(r.lumpSum[0].pay).toBeCloseTo(855 * 0.96, 6);
  });
  it('μεγαλύτερη παρακράτηση: επιστροφή', () => {
    const r = taxReturn({ salaryTaxable: 10000, withheld: 500 });
    expect(r.refund).toBeCloseTo(500 - incomeTax(10000).tax, 6);
  });
});

describe('2025 → 2026, χωρίς τέκνα', () => {
  it('20.000 € φορολογητέο: 900 + 2.200 − 617 το 2025, 900 + 2.000 − 617 το 2026', () => {
    const c = tax2025vs2026(20000);
    expect(c.tax25).toBeCloseTo(3100 - (777 - 160), 6);
    expect(c.tax26).toBeCloseTo(2900 - (777 - 160), 6);
    expect(c.saving).toBeCloseTo(200, 6);
  });
  it('κάτω από 10.000 € καμία διαφορά', () => {
    expect(tax2025vs2026(9000).saving).toBeCloseTo(0, 6);
  });
});

describe('φόρος μεταβίβασης: ΚΦΠ άρθρα 25, 27, 41', () => {
  it('3 % συν 3 % υπέρ δήμων = 3,09 %', () => {
    const t = transferTax({ price: 100000 });
    expect(t.main).toBeCloseTo(3000, 6);
    expect(t.municipal).toBeCloseTo(90, 6);
    expect(t.effective).toBeCloseTo(0.0309, 10);
  });
  it('φορολογείται η μεγαλύτερη από τίμημα και αντικειμενική αξία', () => {
    expect(transferTax({ price: 80000, objective: 95000 }).value).toBe(95000);
  });
  it('όρια πρώτης κατοικίας: 200.000 άγαμος, 250.000 έγγαμος + 25.000 / 25.000 / 30.000', () => {
    expect(firstHomeLimit('single')).toBe(200000);
    expect(firstHomeLimit('married', 3)).toBe(250000 + 25000 + 25000 + 30000);
    expect(firstHomeLimit('married_disabled')).toBe(275000);
    expect(firstHomeLimit('married', 1, true)).toBe(110000);
  });
  it('πρώτη κατοικία κάτω από το όριο: μηδέν· πάνω: φόρος στη διαφορά', () => {
    expect(transferTax({ price: 180000, firstHome: true }).total).toBe(0);
    expect(transferTax({ price: 230000, firstHome: true }).total).toBeCloseTo(30000 * 0.0309, 6);
  });
});

import { businessTax } from './foroi';
describe('ελεύθεροι επαγγελματίες: άρθρο 29 ΚΦΕ', () => {
  it('χωρίς τη μείωση του άρθρου 16', () => {
    const b = businessTax(20000);
    expect(b.tax).toBeCloseTo(900 + 2000, 6);
    expect(b.asSalary).toBeCloseTo(2900 - 617, 6);
  });
  it('3 πρώτα έτη: μισός συντελεστής στο 1ο κλιμάκιο', () => {
    expect(businessTax(8000, 0, 'over30', true).tax).toBeCloseTo(8000 * 0.045, 6);
  });
});
