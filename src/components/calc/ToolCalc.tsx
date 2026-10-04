/**
 * Calculateur complet d'une page outil (RECETTE §5, §17) : champs, carte de résultat, barre de
 * répartition, détail ligne par ligne et lien partageable. Le contenu vient de `lib/calc-specs.ts`
 * (un sujet = une entrée, calculée par `lib/engine/gr.ts`). Premier rendu = valeurs par défaut
 * du build ; les paramètres d'un lien partagé ne sont lus qu'après hydratation (§17.5).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import StackedBar from '../ui/StackedBar';
import { getCalc, type CalcValues } from '../../lib/calc-specs';
import { readParams, updateURL } from '../../lib/url-state';

interface Props { kind: string; lang?: string; defaults?: Record<string, number | string>; methodHref?: string; compact?: boolean }

export default function ToolCalc({ kind, lang = 'el', defaults = {}, methodHref, compact = false }: Props) {
  const spec = getCalc(kind, lang);
  const initial: CalcValues = Object.fromEntries(spec.fields.map((f) => [f.id, f.id in defaults ? defaults[f.id] : f.def])) as CalcValues;
  const [v, setV] = useState<CalcValues>(initial);
  useEffect(() => {
    const u = readParams(window.location.search);
    if (!u.toString()) return;
    setV((o) => {
      const n = { ...o };
      for (const f of spec.fields) {
        const x = u.get(f.id);
        if (x === null) continue;
        if (f.kind === 'number') { const p = parseFloat(x); if (!isNaN(p)) n[f.id] = Math.min(p, f.max ?? 10_000_000); }
        else if (f.options?.some((o2) => o2.value === x)) n[f.id] = x;
      }
      return n;
    });
  }, []);
  useEffect(() => { updateURL(v); }, [v]);
  const out = useMemo(() => spec.run(v), [v, spec]);
  const set = (id: string) => (x: number | string) => setV((o) => ({ ...o, [id]: x }));
  const shown = spec.fields.filter((f) => !f.show || f.show(v));
  return (
    <div data-chrome data-calculator={kind} className="not-prose rounded-xl border border-navy-200 bg-white p-4 sm:p-6">
      <div className={`grid gap-6 ${compact ? '' : 'lg:grid-cols-2'}`}>
        <form className="grid grid-cols-1 content-start gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          {shown.map((f) => {
            const cls = f.wide ? 'sm:col-span-2' : '';
            if (f.kind === 'number') return <NumberField key={f.id} id={`c-${kind}-${f.id}`} label={f.label} value={Number(v[f.id])} onChange={set(f.id)} unit={f.unit} max={f.max} decimals={f.decimals} plain={f.plain} help={f.help} lang={lang} className={cls} />;
            if (f.kind === 'toggle') return <Toggle key={f.id} id={`c-${kind}-${f.id}`} label={f.label} value={String(v[f.id])} onChange={set(f.id)} options={f.options ?? []} className={cls} />;
            return <SelectField key={f.id} id={`c-${kind}-${f.id}`} label={f.label} value={String(v[f.id])} onChange={set(f.id)} options={f.options ?? []} help={f.help} className={cls} />;
          })}
        </form>
        <div aria-live="polite" className="rounded-lg bg-accent-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-navy-700">{out.headLabel}</p>
          <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900">{out.head}</p>
          {out.sub && <p className="mt-1 text-sm text-navy-700">{out.sub}</p>}
          {out.bar && out.bar.length > 0 && <div className="mt-4"><StackedBar total={Math.max(out.bar.reduce((s, b) => s + b.value, 0), 1)} ariaPrefix={spec.barLabel ?? out.headLabel} segments={out.bar} /></div>}
          <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-navy-200">
            {out.rows.map((r) => <tr key={r.label}><td className={`py-1.5 pr-3 ${r.strong ? 'font-medium text-navy-900' : 'text-navy-700'}`}>{r.label}</td><td className={`tabular-nums py-1.5 text-right ${r.strong ? 'font-semibold' : ''} text-navy-900`}>{r.value}</td></tr>)}
          </tbody></table>
          {out.note && <p className="mt-3 text-xs text-navy-700">{out.note}</p>}
          {methodHref && <p className="mt-2 text-xs text-navy-700"><a className="font-medium text-accent-700 underline" href={methodHref}>{spec.methodLabel}</a></p>}
        </div>
      </div>
      <p className="mt-4 text-xs text-navy-600">{spec.footer}</p>
    </div>
  );
}
