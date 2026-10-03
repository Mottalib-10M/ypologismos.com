import { describe, it, expect } from 'vitest';
import {
  salary, grossForNet, incomeTax, bracketRates, taxCredit, minimumWage, bonusNet,
  christmasBonus, easterBonus, leaveAllowance, severance, severanceMonths, noticeMonths, extra2012Months,
  roadTax, roadCategoryFor, enfia, enfiaAgeFactor, enfiaBasicRate, replacementRate, nationalPension, pension, parentalBenefit, PARAMS as P,
} from './gr';

describe('μισθός: παραδείγματα του Υπουργείου Εργασίας (κατώτατος 1.4.2026)', () => {
  // Ανακοίνωση ypergasias.gov.gr, 1-4-2026 : καθαρές μηνιαίες απολαβές, εργαζόμενος άνω των 30.
  for (const ex of P.minimum_wage.official_examples) {
    it(`${ex.gross} € μικτά, ${ex.children} τέκνα → ${ex.net} € καθαρά (±2 €)`, () => {
      const s = salary({ gross: ex.gross, children: ex.children });
      expect(Math.abs(s.net - ex.net)).toBeLessThanOrEqual(2);
    });
  }
  it('920 € χωρίς τέκνα: λογαριασμός βήμα προς βήμα', () => {
    const s = salary({ gross: 920 });
    expect(s.annualGross).toBe(12880);
    expect(s.efkaAnnual).toBeCloseTo(1722.06, 2);
    expect(s.taxableAnnual).toBeCloseTo(11157.94, 2);
    expect(s.scaleAnnual).toBeCloseTo(900 + 1157.94 * 0.2, 2);
    expect(s.creditAnnual).toBe(777);
    expect(Math.round(s.net)).toBe(772);
  });
  it('920 € με δύο τέκνα: η μείωση μηδενίζει τον φόρο', () => {
    expect(salary({ gross: 920, children: 2 }).taxAnnual).toBe(0);
  });
});

describe('κλίμακα 2026 (ν. 5246/2025)', () => {
  it('γενική κλίμακα 9-20-26-34-39-44 %', () => {
    expect(bracketRates(0)).toEqual([0.09, 0.2, 0.26, 0.34, 0.39, 0.44]);
    expect(incomeTax(60000).scale).toBeCloseTo(900 + 2000 + 2600 + 3400 + 7800, 2);
  });
  it('τέκνα: 2ο κλιμάκιο 18/16/9 %, 3ο 24/22/20/18 %, 0 % στα δύο πρώτα από 4 τέκνα', () => {
    expect(bracketRates(1).slice(0, 3)).toEqual([0.09, 0.18, 0.24]);
    expect(bracketRates(2).slice(0, 3)).toEqual([0.09, 0.16, 0.22]);
    expect(bracketRates(3).slice(0, 3)).toEqual([0.09, 0.09, 0.2]);
    expect(bracketRates(4).slice(0, 3)).toEqual([0, 0, 0.18]);
    expect(bracketRates(6)[2]).toBeCloseTo(0.14, 10);
  });
  it('νέοι: 0 % έως 25 ετών, 9 % από 26 έως 30 στα δύο πρώτα κλιμάκια', () => {
    expect(bracketRates(0, 'u25').slice(0, 3)).toEqual([0, 0, 0.26]);
    expect(bracketRates(0, '26_30').slice(0, 3)).toEqual([0.09, 0.09, 0.26]);
    expect(bracketRates(4, '26_30').slice(0, 2)).toEqual([0, 0]);
    expect(incomeTax(18000, 0, 'u25').tax).toBe(0);
  });
  it('μείωση φόρου άρθρου 16: 777 € μειούμενη 20 € ανά 1.000 € πάνω από 12.000 €', () => {
    expect(taxCredit(12000)).toBe(777);
    expect(taxCredit(22000)).toBe(577);
    expect(taxCredit(60000)).toBe(0);
    expect(taxCredit(30000, 5)).toBe(1780);
    expect(taxCredit(10000, 7)).toBe(1780 + 440);
  });
});

describe('ΕΦΚΑ, πλαφόν και κόστος εργοδότη', () => {
  it('13,37 % εργαζομένου, 21,79 % εργοδότη', () => {
    const s = salary({ gross: 2000 });
    expect(s.efka).toBeCloseTo(267.4, 2);
    expect(s.employer).toBeCloseTo(435.8, 2);
  });
  it('πλαφόν 7.761,94 €: καμία εισφορά πάνω από το όριο', () => {
    expect(salary({ gross: 10000 }).efka).toBeCloseTo(salary({ gross: P.efka.ceiling_monthly }).efka, 2);
    expect(salary({ gross: 10000 }).capped).toBe(true);
  });
  it('12 ή 14 καταβολές: ίδιο ετήσιο → ίδιο καθαρό ετήσιο', () => {
    const a = salary({ gross: 1400, payments: 14 }), b = salary({ gross: 1400 * 14 / 12, payments: 12 });
    expect(a.netAnnual).toBeCloseTo(b.netAnnual, 4);
  });
  it('αντίστροφος υπολογισμός καθαρά → μικτά', () => {
    const g = grossForNet(1200, { children: 1 });
    expect(salary({ gross: g, children: 1 }).net).toBeCloseTo(1200, 1);
  });
  it('κατώτατος με τριετίες: 920 / 1.012 / 1.104 / 1.196 €', () => {
    expect([0, 1, 2, 3, 5].map(minimumWage)).toEqual([920, 1012, 1104, 1196, 1196]);
  });
  it('καθαρό δώρο στον μέσο συντελεστή του έτους', () => {
    const b = bonusNet(1000, { gross: 1000 });
    expect(b.efka).toBeCloseTo(133.7, 2);
    expect(b.net).toBeLessThan(1000 - 133.7);
  });
});

describe('δώρα και επίδομα αδείας (Επιθεώρηση Εργασίας)', () => {
  it('δώρο Χριστουγέννων ολόκληρο = μισθός + 4,1666 %', () => {
    const d = christmasBonus({ pay: 1200 });
    expect(d.full).toBe(true);
    expect(d.amount).toBeCloseTo(1200 * 1.041666, 2);
  });
  it('δώρο Χριστουγέννων αναλογικό: 2/25 ανά 19 ημέρες', () => {
    const d = christmasBonus({ pay: 1000, days: 95 });
    expect(d.base).toBeCloseTo(1000 * 2 / 25 * 5, 6);
  });
  it('δώρο Χριστουγέννων ημερομισθίου: 25 ημερομίσθια', () => {
    expect(christmasBonus({ pay: 41.09, daily: true }).base).toBeCloseTo(41.09 * 25, 6);
  });
  it('δώρο Πάσχα ολόκληρο = μισός μισθός + 4,1666 %, αναλογία 1/15 ανά 8 ημέρες', () => {
    expect(easterBonus({ pay: 1000 }).amount).toBeCloseTo(500 * 1.041666, 2);
    expect(easterBonus({ pay: 1000, days: 40 }).base).toBeCloseTo(500 / 15 * 5, 6);
    expect(easterBonus({ pay: 41.09, daily: true }).base).toBeCloseTo(41.09 * 15, 6);
  });
  it('επίδομα αδείας: έως μισός μισθός ή 13 ημερομίσθια', () => {
    expect(leaveAllowance({ pay: 1400 }).amount).toBe(700);
    expect(leaveAllowance({ pay: 1400, months: 6 }).amount).toBe(350);
    expect(leaveAllowance({ pay: 41.09, daily: true }).amount).toBeCloseTo(41.09 * 13, 6);
  });
});

describe('αποζημίωση απόλυσης', () => {
  it('πίνακας ν. 4093/2012: 0 πριν τον 1ο χρόνο, 2 μισθοί από 1 έτος, 12 από 16 έτη', () => {
    expect([0, 1, 3, 4, 6, 8, 10, 11, 15, 16, 30].map(severanceMonths)).toEqual([0, 2, 2, 3, 4, 5, 6, 7, 11, 12, 12]);
  });
  it('προειδοποίηση 1-2-3-4 μήνες', () => {
    expect([0, 1, 2, 5, 10, 20].map(noticeMonths)).toEqual([0, 1, 2, 3, 4, 4]);
  });
  it('1.500 €, 8 έτη, χωρίς προειδοποίηση: 5 μισθοί + 1/6', () => {
    const s = severance({ pay: 1500, years: 8 });
    expect(s.base).toBe(7500);
    expect(s.total).toBeCloseTo(7500 * 7 / 6, 2);
  });
  it('με έγγραφη προειδοποίηση: το μισό', () => {
    expect(severance({ pay: 1500, years: 8, notice: true }).total).toBeCloseTo(7500 * 7 / 12, 2);
  });
  it('επιπλέον αποζημίωση για 17+ έτη στις 12-11-2012, με μισθό έως 2.000 €', () => {
    expect([16, 17, 20, 28, 35].map(extra2012Months)).toEqual([0, 1, 4, 12, 12]);
    const s = severance({ pay: 3000, years: 30, yearsAt2012: 20 });
    expect(s.extra).toBe(2000 * 4);
    expect(s.base).toBe(3000 * 12);
  });
  it('εργατοτεχνίτης: 22 ημερομίσθια = μηνιαίος μισθός', () => {
    expect(severance({ pay: 50, daily: true, years: 5 }).monthly).toBe(1100);
  });
  it('ανώτατο όριο: 8 × ημερομίσθιο ανειδίκευτου × 30', () => {
    const s = severance({ pay: 20000, years: 16 });
    expect(s.cap).toBeCloseTo(8 * 41.09 * 30, 6);
    expect(s.capped).toBe(true);
    expect(s.base).toBeCloseTo(8 * 41.09 * 30 * 12, 4);
  });
});

describe('τέλη κυκλοφορίας (ν. 2948/2001 άρθρο 20)', () => {
  it('WLTP 130 g/km → 130 × 0,64 = 83,20 €', () => {
    expect(roadTax({ category: 'co2_wltp', co2: 130 }).amount).toBeCloseTo(83.2, 2);
  });
  it('WLTP έως 122 g/km: μηδέν, 281+ g: 2,85 €/g', () => {
    expect(roadTax({ category: 'co2_wltp', co2: 122 }).amount).toBe(0);
    expect(roadTax({ category: 'co2_wltp', co2: 300 }).amount).toBeCloseTo(855, 2);
  });
  it('NEDC 2010-2020: 120 g → 0,98 €/g, 141 g → 1,85 €/g', () => {
    expect(roadTax({ category: 'co2_nedc', co2: 120 }).amount).toBeCloseTo(117.6, 2);
    expect(roadTax({ category: 'co2_nedc', co2: 141 }).amount).toBeCloseTo(260.85, 2);
  });
  it('κυβισμός: 1.600 cc → 250 / 265 / 280 € ανάλογα με το έτος', () => {
    expect(roadTax({ category: 'cc_until_2000', cc: 1600 }).amount).toBe(250);
    expect(roadTax({ category: 'cc_2001_2005', cc: 1600 }).amount).toBe(265);
    expect(roadTax({ category: 'cc_from_2006', cc: 1600 }).amount).toBe(280);
    expect(roadTax({ category: 'cc_from_2006', cc: 4500 }).amount).toBe(1380);
    expect(roadTax({ category: 'cc_from_2006', cc: 1357 }).amount).toBe(135);
  });
  it('ηλεκτρικά: απαλλαγή', () => {
    expect(roadTax({ category: 'electric' }).amount).toBe(0);
  });
  it('κατηγορία από την ημερομηνία πρώτης ταξινόμησης', () => {
    expect(roadCategoryFor(1999)).toBe('cc_until_2000');
    expect(roadCategoryFor(2004)).toBe('cc_2001_2005');
    expect(roadCategoryFor(2010, 10)).toBe('cc_from_2006');
    expect(roadCategoryFor(2010, 11)).toBe('co2_nedc');
    expect(roadCategoryFor(2021, 1)).toBe('co2_wltp');
  });
});

describe('ΕΝΦΙΑ (ΚΦΠ άρθρα 11, 13, 10, 17)', () => {
  it('βασικός φόρος ανά τιμή ζώνης και συντελεστής παλαιότητας', () => {
    expect(enfiaBasicRate(1400).rate).toBe(2.8);
    expect(enfiaBasicRate(5200).rate).toBe(16.2);
    expect(enfiaAgeFactor(2024).factor).toBe(1.25);
    expect(enfiaAgeFactor(1990).factor).toBe(1);
    expect(enfiaAgeFactor(1928).factor).toBe(0.8);
    expect(enfiaAgeFactor(1920).factor).toBe(0.6);
  });
  it('διαμέρισμα 80 m², ζώνη 1.400 €, 1995, 3ος όροφος, μία πρόσοψη', () => {
    const r = enfia({ sqm: 80, zonePrice: 1400, buildYear: 1995, floor: 'f2_3', facades: 1 });
    const main = 80 * 2.8 * 1.0 * 1.01 * 1.01;
    expect(r.mainBuilding).toBeCloseTo(main, 6);
    expect(r.estimatedValue).toBe(112000);
    expect(r.valueReductionRate).toBe(0.25);
    expect(r.total).toBeCloseTo(main * 0.75, 6);
  });
  it('ασφαλισμένη κατοικία −20 %, μικρός οικισμός −50 % το 2026', () => {
    const base = enfia({ sqm: 100, zonePrice: 700, buildYear: 1980 });
    const both = enfia({ sqm: 100, zonePrice: 700, buildYear: 1980, insured: true, smallSettlement: true });
    expect(both.total).toBeCloseTo(base.total * 0.8 * 0.5, 6);
  });
  it('προσαύξηση πάνω από 500.000 € και φόρος αξίας πάνω από 300.000 €', () => {
    const r = enfia({ sqm: 150, zonePrice: 5000, buildYear: 2010, totalValue: 750000 });
    expect(r.surchargeRate).toBe(0.1);
    expect(r.valueReductionRate).toBe(0);
    expect(r.rightTax).toBeCloseTo(100000 * 0.002 + 100000 * 0.003 + 100000 * 0.004 + 50000 * 0.005, 6);
  });
});

describe('σύνταξη (ν. 4387/2016)', () => {
  it('ποσοστό αναπλήρωσης: 15 έτη 11,55 %, 40 έτη 49,77 %', () => {
    expect(replacementRate(15)).toBeCloseTo(0.1155, 6);
    expect(replacementRate(40)).toBeCloseTo(15 * 0.0077 + 3 * (0.0084 + 0.009 + 0.0096 + 0.0103 + 0.0121 + 0.0198 + 0.025) + 4 * 0.0255, 6);
  });
  it('εθνική σύνταξη: πλήρης από 20 έτη, −2 % ανά έτος έως τα 15', () => {
    expect(nationalPension(20)).toBeCloseTo(P.pension.national_full, 6);
    expect(nationalPension(15)).toBeCloseTo(P.pension.national_full * 0.9, 6);
    expect(nationalPension(25, 20)).toBeCloseTo(P.pension.national_full * 0.5, 6);
  });
  it('σύνολο = ανταποδοτική + εθνική', () => {
    const p = pension({ years: 35, avgEarnings: 1500 });
    expect(p.total).toBeCloseTo(p.contributory + p.national, 6);
    expect(p.eligible).toBe(true);
  });
});

describe('επίδομα γονικής άδειας', () => {
  it('2 μήνες × κατώτατος μισθός + 1/6', () => {
    const g = parentalBenefit();
    expect(g.months).toBe(2);
    expect(g.total).toBeCloseTo(920 * 2 * 7 / 6, 4);
  });
});
