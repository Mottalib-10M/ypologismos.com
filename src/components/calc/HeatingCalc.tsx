/**
 * Calculateur de l'επίδομα θέρμανσης 2025-2026 (RECETTE §2.2, §17) : le visiteur tape son code postal,
 * choisit son οικισμός, et reçoit le montant calculé avec le ΣΟ-Μ officiel de ce οικισμός
 * (ΚΥΑ Α.1116/2026, 19 435 οικισμοί). Le jeu de données complet (src/data/thermansi.json) n'est
 * chargé qu'après hydratation, comme un module du site ; premier rendu = code postal par défaut, dont
 * les lignes arrivent en props depuis le build (§17.5). Aucune donnée saisie ne quitte le navigateur.
 */
import { useEffect, useMemo, useState } from 'react';
import SelectField from '../ui/SelectField';
import { heatingAllowance, heatingAdvanceNew, heatingLimits, type Fuel, type Household } from '../../lib/engine/epidomata';
import { PARAMS as P } from '../../lib/engine/gr';
import { formatMoney, formatDecimal } from '../../lib/format';
import { readParams, updateURL } from '../../lib/url-state';

type Row = [string, number | null, number | null, number];
interface Props { lang?: string; defaultTk: string; initialRows: Row[]; methodHref?: string }
const T = <A,>(l: string, el: A, en: A) => (l === 'en' ? en : el);

export default function HeatingCalc({ lang = 'el', defaultTk, initialRows, methodHref }: Props) {
  const l = lang;
  const $ = (x: number) => formatMoney(x, 0, l);
  const [data, setData] = useState<Record<string, Row[]> | null>(null);
  const [tk, setTk] = useState(defaultTk);
  const [idx, setIdx] = useState('0');
  const [fuel, setFuel] = useState<Fuel>('oil');
  const [kids, setKids] = useState('0');
  const [hh, setHh] = useState<Household>('couple');
  useEffect(() => {
    let alive = true;
    import('../../data/thermansi.json').then((m) => { if (!alive) return; setData(m.default as unknown as Record<string, Row[]>);
      const u = readParams(window.location.search);
      const t = u.get('tk'); if (t && /^\d{5}$/.test(t)) setTk(t);
      const o = u.get('o'); if (o && /^\d+$/.test(o)) setIdx(o);
      const f = u.get('f'); if (f && f in P.heating.reference) setFuel(f as Fuel);
      const k = u.get('k'); if (k && /^[0-6]$/.test(k)) setKids(k);
      const h = u.get('h'); if (h === 'single' || h === 'couple' || h === 'singleParent') setHh(h);
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => { updateURL({ tk, o: idx, f: fuel, k: kids, h: hh }); }, [tk, idx, fuel, kids, hh]);
  const rows: Row[] | null = tk === defaultTk && !data ? initialRows : data ? data[tk] ?? null : null;
  const i = rows && Number(idx) < rows.length ? Number(idx) : 0;
  const row = rows ? rows[i] : null;
  const fuels: Array<{ value: Fuel; label: string }> = [
    { value: 'oil', label: T(l, 'Πετρέλαιο θέρμανσης, κηροζίνη, υγραέριο', 'Heating oil, kerosene, LPG') },
    { value: 'gas', label: T(l, 'Φυσικό αέριο', 'Natural gas') },
    { value: 'electricity', label: T(l, 'Ρεύμα', 'Electricity') },
    { value: 'pellet', label: T(l, 'Πέλετ', 'Pellets') },
    { value: 'wood', label: T(l, 'Καυσόξυλα', 'Firewood') },
    { value: 'district', label: T(l, 'Τηλεθέρμανση', 'District heating') },
  ];
  const out = useMemo(() => {
    if (!row || row[2] === null) return null;
    const r = heatingAllowance({ fuel, som: row[2], children: Number(kids) });
    const adv = row[1] !== null ? heatingAdvanceNew(fuel, row[1], Number(kids)) : null;
    return { r, adv };
  }, [row, fuel, kids]);
  const lim = heatingLimits(hh, Number(kids));
  const flags = row ? row[3] : 0;
  const fuelOk = fuel === 'wood' ? (flags & 1) > 0 : fuel === 'pellet' ? (flags & 4) > 0 : fuel === 'district' ? (flags & 2) > 0 : true;
  const tkValid = /^\d{5}$/.test(tk);
  return (
    <div data-chrome data-calculator="heating" className="not-prose rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="grid grid-cols-1 content-start gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-rows-subgrid row-span-3 content-start gap-y-0 sm:col-span-2">
            <label htmlFor="c-heating-tk" className="mb-1 block text-sm font-medium text-navy-700">{T(l, 'Ταχυδρομικός κώδικας', 'Postcode (TK)')}</label>
            <input id="c-heating-tk" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={tk.length > 3 ? `${tk.slice(0, 3)} ${tk.slice(3)}` : tk} aria-describedby="c-heating-tk-help"
              onChange={(e) => { setTk(e.target.value.replace(/\D/g, '').slice(0, 5)); setIdx('0'); }}
              className="tabular-nums w-full rounded-lg border border-navy-300 bg-white h-12 px-4 text-lg text-navy-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
            <p id="c-heating-tk-help" role="status" className="mt-1 text-xs text-navy-500">{!tkValid ? T(l, 'Πέντε ψηφία, όπως στον λογαριασμό ρεύματος.', 'Five digits, as on your electricity bill.') : rows ? T(l, `${rows.length} οικισμοί σε αυτόν τον ΤΚ`, `${rows.length} settlements in this postcode`) : data ? T(l, 'Ο ΤΚ δεν υπάρχει στα παραρτήματα της ΚΥΑ.', 'This postcode is not in the official annexes.') : T(l, 'Φόρτωση των συντελεστών…', 'Loading coefficients…')}</p>
          </div>
          <SelectField id="c-heating-o" label={T(l, 'Οικισμός', 'Settlement')} value={String(i)} onChange={setIdx}
            options={(rows ?? []).map((r, j) => ({ value: String(j), label: r[0] }))} />
          <SelectField id="c-heating-f" label={T(l, 'Καύσιμο', 'Fuel')} value={fuel} onChange={(v) => setFuel(v as Fuel)} options={fuels} />
          <SelectField id="c-heating-k" label={T(l, 'Εξαρτώμενα τέκνα', 'Dependent children')} value={kids} onChange={setKids} options={[0, 1, 2, 3, 4, 5, 6].map((k) => ({ value: String(k), label: String(k) }))} />
          <SelectField id="c-heating-h" label={T(l, 'Νοικοκυριό', 'Household')} value={hh} onChange={(v) => setHh(v as Household)}
            options={[{ value: 'single', label: T(l, 'Άγαμος, χήρος ή σε διάσταση', 'Single, widowed or separated') }, { value: 'couple', label: T(l, 'Έγγαμοι ή σύμφωνο συμβίωσης', 'Married or civil partners') }, { value: 'singleParent', label: T(l, 'Μονογονεϊκή οικογένεια', 'Single-parent family') }]} />
        </form>
        <div aria-live="polite" className="rounded-lg bg-accent-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-navy-700">{T(l, `Επίδομα θέρμανσης ${P.heating.season}`, `Heating allowance ${P.heating.season}`)}</p>
          <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900">{out ? (out.r.band === 2 && Math.round(out.r.amountHigh) !== Math.round(out.r.amount) ? `${$(out.r.amount)}–${$(out.r.amountHigh)}` : $(out.r.amount)) : '—'}</p>
          {row && <p className="mt-1 text-sm text-navy-700">{row[0]} · ΣΟ-Μ {formatDecimal(row[2] ?? 0, 2, l)}{row[3] & 16 ? T(l, ' (μέσος του ΤΚ)', ' (postcode average)') : ''}</p>}
          {out && <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-navy-200">
            <tr><td className="py-1.5 pr-3 text-navy-700">{T(l, 'Ποσό αναφοράς του καυσίμου', 'Reference amount for the fuel')}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{$(out.r.ref)}</td></tr>
            <tr><td className="py-1.5 pr-3 text-navy-700">{T(l, `Με τα παιδιά (+${Math.round(P.heating.child_uplift * 100)} % το καθένα) × ΣΟ-Μ`, `With children (+${Math.round(P.heating.child_uplift * 100)}% each) × weather coefficient`)}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{$(out.r.raw)}</td></tr>
            {out.r.band > 0 && <tr><td className="py-1.5 pr-3 text-navy-700">{out.r.band === 2 ? T(l, 'Ψυχρός οικισμός (ΣΟ-Μ ≥ 1,2): +25 % και επιπλέον 25 %', 'Very cold settlement (≥ 1.2): +25% and a further 25%') : T(l, 'Ψυχρός οικισμός (ΣΟ-Μ ≥ 1): +25 %', 'Cold settlement (≥ 1): +25%')}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{$(out.r.amount)}</td></tr>}
            <tr><td className="py-1.5 pr-3 text-navy-700">{T(l, 'Αγορές που χρειάζονται για ολόκληρο το ποσό', 'Purchases needed for the full amount')}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{$(out.r.needed)}{fuel === 'oil' ? T(l, ` (≈ ${formatDecimal(Math.round(out.r.litres), 0, l)} λίτρα)`, ` (≈ ${formatDecimal(Math.round(out.r.litres), 0, l)} litres)`) : ''}</td></tr>
            {out.adv !== null && <tr><td className="py-1.5 pr-3 text-navy-700">{T(l, 'Προκαταβολή Δεκεμβρίου για νέο δικαιούχο (ΣΚ)', 'December advance for a new claimant (climate coefficient)')}</td><td className="tabular-nums py-1.5 text-right text-navy-900">{$(out.adv)}</td></tr>}
            <tr><td className="py-1.5 pr-3 font-medium text-navy-900">{T(l, 'Όριο εισοδήματος / ακίνητης περιουσίας', 'Income / property limit')}</td><td className="tabular-nums py-1.5 text-right font-semibold text-navy-900">{$(lim.income)} / {$(lim.property)}</td></tr>
          </tbody></table>}
          <p className="mt-3 text-xs text-navy-700">{!fuelOk ? T(l, 'Αυτός ο οικισμός δεν είναι επιλέξιμος για το καύσιμο που διαλέξατε, σύμφωνα με το παράρτημα της ΚΥΑ.', 'This settlement is not eligible for the chosen fuel under the annex to the decision.')
            : out && out.r.band === 2 ? T(l, 'Η ΚΥΑ δεν διευκρινίζει αν το δεύτερο 25 % υπολογίζεται στο αρχικό ή στο ήδη προσαυξημένο ποσό· δείχνουμε και τα δύο.', 'The decision does not say whether the second 25% applies to the original or the increased amount; both are shown.')
            : T(l, 'Ελάχιστο 100 €, μέγιστο 800 € (1.000 € ή 1.200 € σε ψυχρούς οικισμούς). Με αγορές κάτω από το διπλάσιο, το επίδομα είναι το μισό των αγορών.', 'Minimum €100, maximum €800 (€1,000 or €1,200 in cold settlements). With purchases below twice the amount, the allowance is half of what you bought.')}</p>
          {methodHref && <p className="mt-2 text-xs text-navy-700"><a className="font-medium text-accent-700 underline" href={methodHref}>{T(l, 'Πώς υπολογίζουμε (μεθοδολογία)', 'How we calculate (methodology)')}</a></p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-navy-600">{T(l, 'Συντελεστές ΣΟ-Μ και ΣΚ από τα παραρτήματα των ΚΥΑ Α.1151/2025 και Α.1116/2026 · ο υπολογισμός γίνεται στον browser σας, τίποτα δεν αποστέλλεται.', 'Coefficients from the annexes to decisions A.1151/2025 and A.1116/2026 · calculated in your browser, nothing is sent.')}</p>
    </div>
  );
}
