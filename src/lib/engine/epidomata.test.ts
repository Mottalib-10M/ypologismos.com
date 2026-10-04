import { describe, it, expect } from 'vitest';
import {
  equivalenceScale, childBenefit, childBenefitLimits, birthAllowance, housingBenefit, heatingAllowance, heatingAdvanceNew, heatingLimits,
  unemploymentBenefit, unemploymentMonths, rentRefund, rentRefundIncomeLimit, maternitySpecial, studentHousing, widowPension,
} from './epidomata';
import { PARAMS as P } from './gr';

describe('επίδομα παιδιού Α21: τα 12 παραδείγματα της ΟΠΕΚΑ', () => {
  for (const ex of P.child_benefit.official_examples) {
    it(`${ex.parents} γονείς, ${ex.children} παιδιά, ${ex.income} € → ${ex.monthly} € τον μήνα`, () => {
      expect(childBenefit({ income: ex.income, parents: ex.parents, children: ex.children }).monthly).toBe(ex.monthly);
    });
  }
  it('κλίμακα ισοδυναμίας: 1 + 1/2 + 1/4 ανά παιδί, μονογονεϊκή 1 + 1/2 + 1/4', () => {
    expect(equivalenceScale(2, 2)).toBe(2);
    expect(equivalenceScale(1, 1)).toBe(1.5);
    expect(equivalenceScale(1, 3)).toBe(2);
  });
  it('πάνω από 15.000 € ισοδύναμο: τίποτα', () => {
    expect(childBenefit({ income: 31000, children: 2 }).monthly).toBe(0);
    expect(childBenefit({ income: 31000, children: 2 }).category).toBe(-1);
  });
  it('δόση δύο μηνών και όρια της οικογένειας', () => {
    expect(childBenefit({ income: 12000, children: 2 }).installment).toBe(280);
    expect(childBenefitLimits(2, 2)).toEqual([12000, 20000, 30000]);
  });
});

describe('επίδομα γέννησης', () => {
  it('2.400 / 2.700 / 3.000 / 3.500 € σε δύο δόσεις', () => {
    expect([1, 2, 3, 4, 6].map((r) => birthAllowance(r).amount)).toEqual([2400, 2700, 3000, 3500, 3500]);
    expect(birthAllowance(2).installment).toBe(1350);
  });
});

describe('επίδομα στέγασης: πίνακας της ΚΥΑ', () => {
  it('70 / 105 / 140 / 175 / 210 €', () => {
    expect([1, 2, 3, 4, 5, 6].map((m) => housingBenefit({ members: m, rent: 500 }).gross)).toEqual([70, 105, 140, 175, 210, 210]);
  });
  it('μονογονεϊκή με ένα ανήλικο: 140 € και όριο 14.000 €', () => {
    const h = housingBenefit({ members: 2, singleParent: true, rent: 500 });
    expect(h.gross).toBe(140);
    expect(h.incomeLimit).toBe(14000);
  });
  it('ποτέ πάνω από το ενοίκιο', () => {
    expect(housingBenefit({ members: 3, rent: 120 }).amount).toBe(120);
  });
  it('όρια εισοδήματος, ακινήτων, καταθέσεων', () => {
    const h = housingBenefit({ members: 4, rent: 400 });
    expect([h.incomeLimit, h.propertyLimit, h.depositsLimit]).toEqual([17500, 165000, 17500]);
    expect(housingBenefit({ members: 1, rent: 300, income: 7001 }).amount).toBe(0);
  });
});

describe('επίδομα θέρμανσης 2025-2026', () => {
  it('Αθήνα, πετρέλαιο, χωρίς παιδιά: ΣΟ-Μ 0,25 → 75 € ανεβαίνει στο ελάχιστο 100 €', () => {
    expect(heatingAllowance({ fuel: 'oil', som: 0.25 }).amount).toBe(100);
  });
  it('Θεσσαλονίκη, φυσικό αέριο, 2 παιδιά: 325 × 1,4 × 0,48', () => {
    expect(heatingAllowance({ fuel: 'gas', som: 0.48, children: 2 }).amount).toBeCloseTo(325 * 1.4 * 0.48, 6);
  });
  it('Μέτσοβο, πετρέλαιο, 2 παιδιά: ΣΟ-Μ 1,03 → +25 %', () => {
    expect(heatingAllowance({ fuel: 'oil', som: 1.03, children: 2 }).amount).toBeCloseTo(300 * 1.4 * 1.03 * 1.25, 6);
  });
  it('ΣΟ-Μ ≥ 1,2: δύο αναγνώσεις, ίδια οροφή 1.200 €', () => {
    const r = heatingAllowance({ fuel: 'oil', som: 1.34 });
    expect(r.amount).toBeCloseTo(300 * 1.34 * 1.5, 6);
    expect(r.amountHigh).toBeCloseTo(300 * 1.34 * 1.25 * 1.25, 6);
    expect(heatingAllowance({ fuel: 'electricity', som: 1.6, children: 3 }).amount).toBe(1200);
  });
  it('αγορές κάτω από το διπλάσιο: το μισό των αγορών, ελάχιστο 100 €', () => {
    const r = heatingAllowance({ fuel: 'oil', som: 0.8, purchases: 300 });
    expect(r.final).toBe(150);
    expect(heatingAllowance({ fuel: 'oil', som: 0.8, purchases: 50 }).final).toBe(100);
  });
  it('προκαταβολή νέου δικαιούχου: 50 % × αναφορά × ΣΚ, ελάχιστο 80 €', () => {
    expect(heatingAdvanceNew('oil', 0.43)).toBe(80);
    expect(heatingAdvanceNew('oil', 1.22, 1)).toBeCloseTo(0.5 * 300 * 1.22 * 1.2, 6);
  });
  it('όρια: 16.000 / 24.000 + 5.000 ανά παιδί, μονογονεϊκή 29.000', () => {
    expect(heatingLimits('single').income).toBe(16000);
    expect(heatingLimits('couple', 2).income).toBe(34000);
    expect(heatingLimits('singleParent', 2).income).toBe(34000);
    expect(heatingLimits('couple', 2).property).toBe(340000);
  });
});

describe('επίδομα ανεργίας: εγκύκλιος ΔΥΠΑ 2026', () => {
  it('565 € βασικό, 621,50 € με ένα μέλος, 904 € με έξι', () => {
    expect(unemploymentBenefit({ days: 250 }).base).toBeCloseTo(565, 6);
    expect(unemploymentBenefit({ days: 250, dependants: 1 }).monthly).toBeCloseTo(621.5, 6);
    expect(unemploymentBenefit({ days: 250, dependants: 6 }).monthly).toBeCloseTo(904, 6);
  });
  it('χαμηλές αποδοχές: 423,75 € και 282,50 €', () => {
    expect(unemploymentBenefit({ days: 200, avgPay: 400 }).base).toBeCloseTo(423.75, 6);
    expect(unemploymentBenefit({ days: 200, avgPay: 246.54 }).base).toBeCloseTo(282.5, 6);
    expect(unemploymentBenefit({ days: 200, avgPay: 493.09 }).base).toBeCloseTo(565, 6);
  });
  it('διάρκεια 5 / 6 / 8 / 10 / 12 μήνες', () => {
    expect([124, 125, 150, 180, 220, 250].map((d) => unemploymentMonths(d))).toEqual([0, 5, 6, 8, 10, 12]);
    expect(unemploymentMonths(210, 49)).toBe(12);
    expect(unemploymentMonths(130, 30, 4050)).toBe(12);
  });
});

describe('επιστροφή ενοικίου: παραδείγματα της ΑΑΔΕ', () => {
  for (const ex of P.rent_refund.official_examples) {
    it(`${ex.rent} € τον χρόνο, ${ex.children} παιδιά → ${ex.refund} €`, () => {
      expect(rentRefund({ annualRent: ex.rent, children: ex.children }).amount).toBeCloseTo(ex.refund, 6);
    });
  }
  it('φοιτητική κατοικία: 300 € × 4 μήνες → 100 €', () => {
    expect(rentRefund({ annualRent: 1200, student: true }).amount).toBe(100);
  });
  it('όρια 2026: 25.000 / 35.000 + 5.000 / 39.000', () => {
    expect(rentRefundIncomeLimit('single')).toBe(25000);
    expect(rentRefundIncomeLimit('couple', 2)).toBe(45000);
    expect(rentRefundIncomeLimit('singleParent', 2)).toBe(44000);
    expect(rentRefundIncomeLimit('couple', 2, 2025)).toBe(36000);
  });
});

describe('μητρότητα, φοιτητικό, χηρεία', () => {
  it('ειδική παροχή: 9 × κατώτατος, μισό σε μερική', () => {
    expect(maternitySpecial('full').total).toBe(P.minimum_wage.monthly * 9);
    expect(maternitySpecial('part').monthly).toBe(P.minimum_wage.monthly / 2);
    expect(maternitySpecial('full', 9).father).toBe(7);
  });
  it('φοιτητικό: 1.500 / 2.000 / 2.500 €, όριο 30.000 + 3.000 μετά το πρώτο παιδί', () => {
    expect(studentHousing({ regional: false, shared: false }).amount).toBe(1500);
    expect(studentHousing({ regional: true, shared: false }).amount).toBe(2000);
    expect(studentHousing({ regional: true, shared: true }).amount).toBe(2500);
    expect(studentHousing({ regional: false, shared: false, children: 3, income: 36000 }).ok).toBe(true);
    expect(studentHousing({ regional: false, shared: false, children: 1, income: 30001 }).amount).toBe(0);
  });
  it('χηρεία: 70 % σύζυγος, 25 % παιδί, οροφή 100 %', () => {
    expect(widowPension({ pension: 1000 }).spouse).toBe(700);
    expect(widowPension({ pension: 1000, children: 1 }).total).toBe(950);
    expect(widowPension({ pension: 1000, children: 2 }).total).toBe(1000);
    expect(widowPension({ pension: 1000, children: 2, orphans: true }).total).toBe(1000);
  });
  it('χηρεία: κάτω των 55 χωρίς παιδιά, 3 χρόνια· μισή μετά αν εργάζεται', () => {
    expect(widowPension({ pension: 1000, age: 48 }).lifetime).toBe(false);
    expect(widowPension({ pension: 1000, age: 60, works: true }).after3).toBe(350);
  });
});
