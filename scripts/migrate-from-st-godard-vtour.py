#!/usr/bin/env python3
"""
Migration des scènes Prismic `st-godard-vtour` (ancien repo, master en-us avec
des textes FR) vers `eglise-saint-godard` (nouveau repo, master fr-fr + en-us).

- Lit les 22 docs `scene` sur le CDN public de l'ancien repo.
- Crée un doc fr-fr par scène (même uid, mêmes champs, `ordre` réindexé 1..n)
  puis un doc en-us lié par uid (titre + description traduits, cf. EN ci-dessous).
- Migration API : les writes s'accumulent dans une Migration Release, publiée
  à la fin par le script (--live). Dry-run par défaut.

Jeton d'écriture : ~/.config/prismic/eglise-saint-godard-write.token (jamais affiché).

Usage :
  python3 scripts/migrate-from-st-godard-vtour.py            # dry-run (affiche ce qui serait créé)
  python3 scripts/migrate-from-st-godard-vtour.py --live     # crée les docs + publie la release
  python3 scripts/migrate-from-st-godard-vtour.py --live --no-publish
"""
import json, os, sys, time, urllib.request, urllib.parse, pathlib

SRC_REPO = "st-godard-vtour"
DST_REPO = "eglise-saint-godard"
MIGRATION_API_KEY = os.environ.get("PRISMIC_MIGRATION_API_KEY") or "cSaZlfkQlF9C6CEAM2Del6MNX9WonlV86HPbeEJL"
LIVE = "--live" in sys.argv
PUBLISH = "--no-publish" not in sys.argv

# Contenu officiel (FR + EN) par scène : scripts/contenu-scenes.json
# (base de connaissances du guide + fiche eglises-rouen.juumo.fr). Les anciennes
# descriptions Prismic (« cathédrale », dates inventées) ne sont PAS reprises.
CONTENU = json.load(open(pathlib.Path(__file__).with_name("contenu-scenes.json"), encoding="utf8"))
EN_CATEGORIE = {"Extérieur": "Exterior", "Intérieur": "Interior", "Crypte": "Crypt"}


def token() -> str:
    p = pathlib.Path.home() / ".config/prismic" / f"{DST_REPO}-write.token"
    try:
        t = p.read_text().strip()
    except FileNotFoundError:
        t = ""
    if not t:
        sys.exit(f"Jeton absent : {p} (Prismic → Settings → API & Security → Write API)")
    print(f"jeton : {p}")
    return t


def get_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def read_source():
    api = get_json(f"https://{SRC_REPO}.cdn.prismic.io/api/v2")
    ref = api["refs"][0]["ref"]
    q = urllib.parse.quote('[[at(document.type,"scene")]]')
    res = get_json(f"https://{SRC_REPO}.cdn.prismic.io/api/v2/documents/search?ref={ref}&q={q}&pageSize=100&lang=*")
    docs = [d for d in res["results"] if d["data"].get("nom_scene_krpano") and d["data"]["nom_scene_krpano"] != "scene_taginfo"]
    docs.sort(key=lambda d: d["data"].get("ordre") or 999)
    return docs


def paragraphs(text: str):
    return [{"type": "paragraph", "text": t.strip(), "spans": []} for t in text.split("\n") if t.strip()]


def clean_data(d: dict, uid: str, lang: str = "fr") -> dict:
    """Structure de l'ancien doc (krpano, catégorie, médias) + textes officiels de contenu-scenes.json."""
    c = CONTENU[uid][lang]
    out = {
        "title": c["title"],
        "nom_scene_krpano": d["nom_scene_krpano"],
        "description": paragraphs(c["description"]),
    }
    for src, dst in (("epoque", "epoque"), ("style", "style_architectural"), ("element", "element_remarquable")):
        if c.get(src):
            out[dst] = c[src]
    cat = d.get("categorie")
    if cat:
        out["categorie"] = EN_CATEGORIE.get(cat, cat) if lang == "en" else cat
    if d.get("video_url"):
        out["video_url"] = d["video_url"]
    # Médias : la Migration API accepte une URL externe pour les fichiers → réimport dans le nouveau repo
    # audio_file : la Migration API exige un asset du repo (asset API), pas une URL externe.
    # L'audio existant (orgue-choeur) est à réuploader depuis l'espace client.
    img = d.get("image_apercu") or {}
    if img.get("url"):
        out["image_apercu"] = {"url": img["url"]}
    return out


def en_data(d: dict, uid: str, ordre: int) -> dict:
    out = clean_data(d, uid, "en")
    out["ordre"] = ordre
    return out


def call(method: str, path: str, body, tok: str):
    for attempt in range(6):
        status, res = _call_once(method, path, body, tok)
        if status != 429:
            return status, res
        wait = 5 * (attempt + 1)
        print(f"  … 429 rate limit, pause {wait}s")
        time.sleep(wait)
    return status, res


def _call_once(method: str, path: str, body, tok: str):
    req = urllib.request.Request(
        f"https://migration.prismic.io{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={
            "Authorization": f"Bearer {tok}",
            "repository": DST_REPO,
            "x-api-key": MIGRATION_API_KEY,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.load(r) if r.length != 0 else {}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


def main():
    docs = read_source()
    print(f"{len(docs)} scènes lues sur {SRC_REPO}")
    plan = []
    for i, d in enumerate(docs, 1):
        uid = d["uid"]
        if uid not in CONTENU:
            sys.exit(f"Contenu officiel manquant pour {uid} (scripts/contenu-scenes.json)")
        fr = clean_data(d["data"], uid, "fr")
        fr["ordre"] = i
        en = en_data(d["data"], uid, i)
        plan.append((uid, fr, en))
        print(f"  [{i:2}] {uid:22} fr={fr['title']!r:36} en={en['title']!r:32} {fr.get('categorie','')!s:10} audio={'oui' if 'audio_file' in fr else 'non'}")
        print(f"        {fr['description'][0]['text'][:110]}…")

    if not LIVE:
        print("\nDry-run : rien n'a été écrit. Relancer avec --live pour créer les docs et publier.")
        return

    tok = token()
    state_path = pathlib.Path(__file__).with_name(".migration-state.json")
    state = json.loads(state_path.read_text()) if state_path.exists() else {"fr": {}, "en": {}}
    created = dict(state["fr"])
    for uid, fr, en in plan:
        if uid in created:
            print(f"  fr déjà créé {uid} → {created[uid]}")
            continue
        status, res = call("POST", "/documents", {"type": "scene", "uid": uid, "lang": "fr-fr", "title": fr["title"], "data": fr}, tok)
        if status not in (200, 201) and "audio_file" in fr:
            # L'import d'un média par URL n'est pas garanti : on réessaie sans l'audio (à réuploader dans l'espace client)
            print(f"  !! {uid} refusé avec audio ({status} {str(res)[:120]}) → nouvel essai sans audio_file")
            fr.pop("audio_file"); en.pop("audio_file", None)
            status, res = call("POST", "/documents", {"type": "scene", "uid": uid, "lang": "fr-fr", "title": fr["title"], "data": fr}, tok)
        if status not in (200, 201):
            sys.exit(f"Échec création fr {uid} : {status} {res}")
        created[uid] = res.get("id")
        state["fr"][uid] = created[uid]; state_path.write_text(json.dumps(state, indent=1))
        print(f"  fr ok {uid} → {created[uid]}")
        time.sleep(1.5)
    for uid, fr, en in plan:
        if uid in state["en"]:
            print(f"  en déjà créé {uid} → {state['en'][uid]}")
            continue
        body = {"type": "scene", "uid": uid, "lang": "en-us", "title": en["title"], "data": en, "alternate_language_id": created[uid]}
        status, res = call("POST", "/documents", body, tok)
        if status not in (200, 201):
            sys.exit(f"Échec création en {uid} : {status} {res}")
        state["en"][uid] = res.get("id"); state_path.write_text(json.dumps(state, indent=1))
        print(f"  en ok {uid} → {res.get('id')}")
        time.sleep(1.5)

    if PUBLISH:
        status, res = call("POST", "/migration-release/publish", {}, tok)
        print(f"publish release : {status} {res if status >= 300 else 'ok'}")
    else:
        print("Release non publiée (--no-publish) : publier à la main dans Prismic.")


if __name__ == "__main__":
    main()
