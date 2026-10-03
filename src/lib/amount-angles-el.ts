/** Angles des pages par montant (el) — À RÉDIGER (RECETTE §6.2). Stub provisoire. */
import type { AngleFn } from './amount-types';
import { AMOUNTS } from '../i18n/routes';
const stub: AngleFn = (c) => ({ title: `${c.amount} stub ${c.F.year}`, description: 'stub', h1: `${c.gross}`, intro: c.net, resume: c.net, sections: [], faqs: [] });
export const ANGLES_EL: Record<number, AngleFn> = Object.fromEntries(AMOUNTS.map((a) => [a, stub]));
