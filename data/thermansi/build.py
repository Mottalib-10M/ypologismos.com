#!/usr/bin/env python3
"""Jeu de données de l'επίδομα θέρμανσης 2025-2026 (RECETTE §4, script rejouable).

Entrées (extraites des annexes officielles, texte des PDF reproduits par taxheaven.gr) :
  - thermansi-SK-annexA-FEK-B-5802-2025.csv  : ΚΥΑ Α.1151/2025, Παράρτημα — ΣΚ par οικισμός
  - thermansi-SOM-annexB-FEK-B-3044-2026.csv : ΚΥΑ Α.1116/2026, Παράρτημα Β — ΣΟ-Μ par οικισμός
Sortie : src/data/thermansi.json = { "ΤΚ": [[οικισμός, ΣΚ|null, ΣΟ-Μ|null, drapeaux], …] }
drapeaux : 1 = καυσόξυλα, 2 = τηλεθέρμανση, 4 = πέλετ (annexe B ; à défaut annexe A),
8 / 16 = ΣΚ / ΣΟ-Μ absent de l'annexe, remplacé par la moyenne du ΤΚ (ΚΥΑ art. 3 par. 4).
Une même paire (ΤΚ, nom) peut apparaître plusieurs fois (deux communes) : appariement par rang.
"""
import csv, json, os, re, collections
here = os.path.dirname(os.path.abspath(__file__))
norm = lambda s: re.sub(r'\s+', '', s)  # les PDF coupent parfois un nom (« Γ ρεβενίτιον »)
f = lambda s: float(s.replace(',', '.')) if s.strip() else None
A = collections.defaultdict(list)
for r in csv.DictReader(open(os.path.join(here, 'thermansi-SK-annexA-FEK-B-5802-2025.csv'), encoding='utf-8'), delimiter=';'):
    A[(r['tk'], norm(r['oikismos']))].append(r)
out = collections.OrderedDict(); seen = collections.Counter(); n = 0
def add(tk, name, sk, som, flags):
    global n
    out.setdefault(tk, []).append([name, sk, som, flags]); n += 1
for r in csv.DictReader(open(os.path.join(here, 'thermansi-SOM-annexB-FEK-B-3044-2026.csv'), encoding='utf-8'), delimiter=';'):
    k = (r['tk'], norm(r['oikismos'])); i = seen[k]; seen[k] += 1
    a = A[k][i] if i < len(A[k]) else None
    flags = int(r['kafsoxyla'] == '1') | 2 * int(r['tilethermansi'] == '1') | 4 * int(r['pellet'] == '1')
    name = a['oikismos'] if a else r['oikismos']
    add(r['tk'], name, f(a['sk']) if a else None, f(r['so_m']), flags)
for k, rows in A.items():
    for a in rows[seen[k]:]:
        add(k[0], a['oikismos'], f(a['sk']), None, int(a['kafsoxyla'] == '1') | 4 * int(a['viomaza_pellet'] == '1'))
# ΚΥΑ Α.1151/2025 art. 3 par. 4 : un οικισμός absent d'une annexe prend la moyenne de son ΤΚ.
# Drapeaux 8 = ΣΚ moyen du ΤΚ, 16 = ΣΟ-Μ moyen du ΤΚ.
fix = lambda s: re.sub(r'(^|\s)([Α-ΩΆΈΉΊΌΎΏ]) ([α-ωάέήίόύώϊϋΐΰ])', r'\1\2\3', s)
for tk, rows in out.items():
    for j, bit in ((1, 8), (2, 16)):
        vals = [r[j] for r in rows if r[j] is not None]
        avg = round(sum(vals) / len(vals), 2) if vals else None
        for r in rows:
            if r[j] is None and avg is not None: r[j] = avg; r[3] |= bit
    for r in rows: r[0] = fix(r[0])
dst = os.path.join(here, '..', '..', 'src', 'data', 'thermansi.json')
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{n} οικισμοί, {len(out)} ΤΚ → src/data/thermansi.json')
