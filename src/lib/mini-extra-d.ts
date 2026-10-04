/** Mini-simulateurs supplémentaires du lot « d » (RECETTE §9.3). Même forme que lib/mini-specs.ts. */
import type { MiniSpec } from './mini-types';
import { roadTax, roadCategoryFor, PARAMS as P } from './engine/gr';
import { formatMoney } from './format';

type L = string;
const T = <A,>(l: L, el: A, en: A) => (l === 'en' ? en : el);
const $2 = (x: number, l: L) => formatMoney(x, 2, l);

export const EXTRA_D: Record<string, (l: string) => MiniSpec> = {
  /* Remplace la version générique : pour une voiture particulière la taxe est indivisible
   * (ν. 2948/2001 art. 20 par. 2α). Le simulateur ne propose donc aucun « douzième à payer » :
   * il montre la somme due, l'épargne mensuelle qui la couvre et le coût réel par mois roulé. */
  roadmonth: (l) => ({ title: T(l, 'Τα τέλη σας ως μηνιαίο κόστος', 'Your road tax as a monthly cost'), cta: T(l, 'Πλήρης υπολογιστής τελών', 'Full road tax calculator'),
    inputs: [
      { id: 'y', label: T(l, 'Έτος πρώτης ταξινόμησης', 'Year first registered'), def: 2021, max: P.year, plain: true },
      { id: 'c', label: T(l, 'CO₂ (g/km) ή κυβικά για ταξινόμηση έως 2010', 'CO₂ (g/km), or cc if registered up to 2010'), def: 150, max: 20000 },
      { id: 'm', label: T(l, 'Μήνες που θα κινηθεί το αυτοκίνητο', 'Months the car will be driven'), def: 12, max: 12 },
    ],
    run: ({ y, c, m }) => {
      const r = roadTax({ category: roadCategoryFor(y), cc: c, co2: c });
      const months = Math.max(1, Math.min(12, Math.round(m || 12)));
      return {
        head: [T(l, 'Οφείλονται για όλο το έτος', 'Due for the whole year'), $2(r.amount, l)],
        rows: [
          [T(l, 'Να βάζετε στην άκρη τον μήνα', 'Set aside each month'), $2(r.amount / 12, l)],
          [T(l, `Πραγματικό κόστος ανά μήνα χρήσης (${months})`, `Real cost per month driven (${months})`), $2(r.amount / months, l)],
        ],
        note: T(l, 'Τα τέλη ιδιωτικού επιβατικού δεν μοιράζονται σε μήνες: μόνο η ακινησία για όλο το έτος, δηλωμένη πριν από την 1η Ιανουαρίου, τα μηδενίζει.', 'Private car road tax is not split by month: only taking the car off the road for the whole year, declared before 1 January, removes it.'),
      };
    } }),
};
