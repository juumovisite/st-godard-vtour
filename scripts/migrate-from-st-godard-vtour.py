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

# Traductions EN fidèles des textes FR existants (titre, catégorie, époque, style, élément).
# Aucun fait ajouté : c'est une traduction, pas une réécriture.
EN = {
    "parvis-entree":       ("Main Square – Entrance", "The main square offers a majestic view of the Gothic façade of Saint-Godard."),
    "parvis-entree-sud":   ("South Square", "View from the south side of the square, revealing the buttresses and the architectural details of the side façade."),
    "parvis-nord":         ("North Square", "The north side of the square gives access to the details of the exterior architecture and its ornamental sculptures."),
    "parvis-sud-loin":     ("South Square – Distant View", "A distant view from the south lets you appreciate the whole building within its urban surroundings."),
    "parvis-sud-proche":   ("South Square – Close View", "A close view of the south façade, highlighting the details of its sculptures and ornaments."),
    "vue-cathedrale":      ("Cathedral View", "A panoramic view over the whole church, offering a unique perspective on its Gothic silhouette."),
    "vue-donjon":          ("Keep View", "A view from the keep, looking down on the church and its surroundings from an elevated vantage point."),
    "entree":              ("Entrance", "The entrance reveals the main nave and its Gothic vaults rising towards the light."),
    "orgue":               ("Organ", "The great organ, a remarkable instrument dominating the west gallery."),
    "orgue-choeur":        ("Organ and Choir", "A view linking the great organ to the choir, showing the full depth of the central nave."),
    "autel":               ("Altar", "The main altar, centre of the liturgy, surrounded by its sacred ornaments."),
    "choeur-autel":        ("Choir – Altar", "The choir and its altar, a sacred space surrounded by carved wooden stalls and luminous stained glass."),
    "choeur-autel1":       ("Choir – Side View", "A side view of the choir revealing the details of the stained glass and the interior architecture."),
    "choeur-autel2":       ("Choir – Rear View", "A perspective from the back of the choir, overlooking the whole liturgical space."),
    "aile-nord-autel":     ("North Aisle – Altar", "The altar of the north aisle, dedicated to a patron saint, adorned with remarkable paintings and sculptures."),
    "aile-nord-centre":    ("North Aisle – Centre", "The centre of the north aisle with its pillars and its arches, characteristic of the Gothic style."),
    "aile-sud-autel":      ("South Aisle – Altar", "The side altar of the south aisle, with a richly decorated altarpiece and colourful stained glass."),
    "aile-sud-autel2":     ("South Aisle – Second Altar", "A second devotional space in the south aisle, reflecting the richness of the side chapels."),
    "aile-sud-baptistere": ("Baptistery", "The baptismal font, a place of baptism for centuries, adorned with sculptures."),
    "aile-sud-centre":     ("South Aisle – Centre", "The centre of the south aisle offers a perspective on the columns and vaults of this side aisle."),
    "aile-sud-fond":       ("South Aisle – Far End", "The far end of the south aisle, a place of contemplation bathed in the light filtered through the stained glass."),
    "crypte":              ("Crypt", "The crypt, the oldest part of the building, with its low vaults and squat columns."),
}
EN_CATEGORIE = {"Extérieur": "Exterior", "Intérieur": "Interior", "Crypte": "Crypt"}
EN_TEXT = {
    # époque
    "XIVe siècle": "14th century", "XVe siècle": "15th century", "XVIIe siècle": "17th century",
    "XIVe-XVIIe siècle": "14th–17th century", "XIe siècle": "11th century", "Médiéval": "Medieval",
    # style
    "Gothique": "Gothic", "Gothique flamboyant": "Flamboyant Gothic", "Baroque": "Baroque", "Roman": "Romanesque",
    # élément remarquable
    "Portail sculpté": "Carved portal", "Contreforts": "Buttresses", "Sculptures": "Sculptures",
    "Vue d'ensemble": "Overall view", "Ornements": "Ornaments", "Panorama": "Panorama", "Vue aérienne": "Aerial view",
    "Voûtes d'ogives": "Rib vaults", "Buffet d'orgue": "Organ case", "Perspective de la nef": "Nave perspective",
    "Retable": "Altarpiece", "Stalles sculptées": "Carved stalls", "Vitraux": "Stained glass",
    "Déambulatoire": "Ambulatory", "Peintures murales": "Wall paintings", "Piliers": "Pillars",
    "Chapelle latérale": "Side chapel", "Fonts baptismaux": "Baptismal font", "Colonnes": "Columns",
    "Voûtes romanes": "Romanesque vaults",
}


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


def clean_data(d: dict) -> dict:
    """Champs de l'ancien doc → data du nouveau doc (mêmes noms de champs)."""
    out = {}
    for k in ("title", "nom_scene_krpano", "description", "categorie", "epoque", "style_architectural",
              "element_remarquable", "badge", "ordre", "description_longue", "video_url"):
        v = d.get(k)
        if v not in (None, "", []):
            out[k] = v
    # Médias : la Migration API accepte une URL externe pour les fichiers → réimport dans le nouveau repo
    af = d.get("audio_file") or {}
    if af.get("url"):
        out["audio_file"] = {"link_type": "Media", "url": af["url"]}
    img = d.get("image_apercu") or {}
    if img.get("url"):
        out["image_apercu"] = {"url": img["url"]}
    return out


def en_data(uid: str, fr: dict) -> dict:
    title, desc = EN[uid]
    out = dict(fr)
    out["title"] = title
    out["description"] = [{"type": "paragraph", "text": desc, "spans": []}]
    out.pop("description_longue", None)  # la longue FR (répétitive) n'est pas reprise en EN
    if fr.get("categorie"):
        out["categorie"] = EN_CATEGORIE.get(fr["categorie"], fr["categorie"])
    for k in ("epoque", "style_architectural", "element_remarquable"):
        if fr.get(k):
            out[k] = EN_TEXT.get(fr[k], fr[k])
    return out


def call(method: str, path: str, body, tok: str):
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
        fr = clean_data(d["data"])
        fr["ordre"] = i
        uid = d["uid"]
        if uid not in EN:
            sys.exit(f"Traduction EN manquante pour {uid}")
        plan.append((uid, fr, en_data(uid, fr)))
        print(f"  [{i:2}] {uid:22} fr={fr['title']!r:34} en={EN[uid][0]!r}  audio={'oui' if 'audio_file' in fr else 'non'}")

    if not LIVE:
        print("\nDry-run : rien n'a été écrit. Relancer avec --live pour créer les docs et publier.")
        return

    tok = token()
    created = {}
    for uid, fr, en in plan:
        status, res = call("POST", "/documents", {"type": "scene", "uid": uid, "lang": "fr-fr", "title": fr["title"], "data": fr}, tok)
        if status not in (200, 201):
            sys.exit(f"Échec création fr {uid} : {status} {res}")
        created[uid] = res.get("id")
        print(f"  fr ok {uid} → {created[uid]}")
        time.sleep(0.4)
    for uid, fr, en in plan:
        body = {"type": "scene", "uid": uid, "lang": "en-us", "title": en["title"], "data": en, "alternate_language_id": created[uid]}
        status, res = call("POST", "/documents", body, tok)
        if status not in (200, 201):
            sys.exit(f"Échec création en {uid} : {status} {res}")
        print(f"  en ok {uid} → {res.get('id')}")
        time.sleep(0.4)

    if PUBLISH:
        status, res = call("POST", "/migration-release/publish", {}, tok)
        print(f"publish release : {status} {res if status >= 300 else 'ok'}")
    else:
        print("Release non publiée (--no-publish) : publier à la main dans Prismic.")


if __name__ == "__main__":
    main()
