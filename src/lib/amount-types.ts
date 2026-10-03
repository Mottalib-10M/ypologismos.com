import type { AmountCtx } from './amount-context';
/** Un angle propre par montant et par langue (RECETTE §6.2) : titre, description, chapeau citable,
 *  sections rédigées à la main (HTML simple : <p>, <ul>, <strong>, <a>) et FAQ propre. */
export interface Angle {
  title: string; description: string; h1: string; intro: string; resume: string;
  sections: Array<{ h2: string; html: string }>;
  faqs: Array<{ q: string; a: string }>;
}
export type AngleFn = (c: AmountCtx) => Angle;
