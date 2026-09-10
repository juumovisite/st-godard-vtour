# Église Saint-Godard de Rouen — visite virtuelle 360°

Plateforme JUUMO (Next.js 16 + KRpano + Prismic), au format de Sainte Jeanne d'Arc.

- Prod : https://saintgodard.juumo.fr (projet Vercel `st-godard-vtour`, auto-deploy sur `main`)
- Prismic : `eglise-saint-godard` (fr-fr master + en-us), types `scene` et `infospot`
- Espace client : https://espace.juumo.fr (textes, vue d'arrivée, tags, audio)
- Mode modification dans la visite : panneau partagé juumo-edit (`bridge.js` dans `public/vtour/tour.html`, `edit.js` dans le layout)
- Matomo : matomo.juumo.fr, site 20

## Développement

```bash
npm install
npm run dev
```

Variables : `NEXT_PUBLIC_PRISMIC_REPOSITORY` (défaut `eglise-saint-godard`), `ANTHROPIC_API_KEY` (guide Juumi), `RESEND_API_KEY` + `CIERGE_FROM_EMAIL` (cierge).

## Contenu

Aucun contenu client dans le code : scènes (titre, description courte et longue, catégorie, époque, badge, audio, vidéo, vue d'arrivée) et points d'information (`infospot`) vivent dans Prismic. Le SEO SSR par scène est dans `src/config/seo-scenes.ts` (faits de la base de connaissances du guide uniquement).

Migration depuis l'ancien repo `st-godard-vtour` : `scripts/migrate-from-st-godard-vtour.py`.
