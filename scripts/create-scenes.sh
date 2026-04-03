#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

AUTH_TOKEN=$(cat ~/.prismic | python3 -c "import sys,json; cookies=json.load(sys.stdin)['cookies']; print([c.split('=',1)[1] for c in cookies.split('; ') if c.startswith('prismic-auth=')][0])")

create_scene() {
  local uid="$1" title="$2" krpano="$3" cat="$4" desc="$5" epoque="$6" style="$7" remarquable="$8" ordre="$9"

  echo "Creating: $title..."
  curl -s -X POST "https://migration.prismic.io/documents" \
    -H "repository: st-godard-vtour" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -H "x-api-key: UgjnhNFD0n8aMaFVPPuj04ONVgasHlfa6b7XZXE1" \
    -d "{
      \"title\": \"$title\",
      \"type\": \"scene\",
      \"uid\": \"$uid\",
      \"lang\": \"en-us\",
      \"data\": {
        \"title\": \"$title\",
        \"nom_scene_krpano\": \"$krpano\",
        \"categorie\": \"$cat\",
        \"description\": [{\"type\":\"paragraph\",\"text\":\"$desc\",\"spans\":[]}],
        \"epoque\": \"$epoque\",
        \"style_architectural\": \"$style\",
        \"element_remarquable\": \"$remarquable\",
        \"ordre\": $ordre
      }
    }" 2>&1
  echo ""
  sleep 1
}

# Extérieur
create_scene "parvis-entree" "Parvis Entrée" "scene_parvis_entree" "Extérieur" \
  "Le parvis principal offre une vue majestueuse sur la façade gothique de la cathédrale Saint-Godard." \
  "XIVe siècle" "Gothique" "Portail sculpté" 1

create_scene "parvis-entree-sud" "Parvis Sud" "scene_parvis_entree_sud" "Extérieur" \
  "Vue depuis le côté sud du parvis, révélant les contreforts et les détails architecturaux de la façade latérale." \
  "XIVe siècle" "Gothique" "Contreforts" 2

create_scene "parvis-nord" "Parvis Nord" "scene_parvis_nord" "Extérieur" \
  "Le côté nord du parvis donne accès aux détails de l'architecture extérieure et aux sculptures ornementales." \
  "XIVe siècle" "Gothique" "Sculptures" 3

create_scene "parvis-sud-loin" "Parvis Sud - Vue éloignée" "scene_parvis_sud_loin" "Extérieur" \
  "Une perspective éloignée depuis le sud permet d'apprécier l'ensemble de l'édifice dans son environnement urbain." \
  "XIVe siècle" "Gothique" "Vue d'ensemble" 4

create_scene "parvis-sud-proche" "Parvis Sud - Vue rapprochée" "scene_parvis_sud_proche" "Extérieur" \
  "Vue rapprochée de la façade sud, mettant en valeur les détails des sculptures et des ornements." \
  "XIVe siècle" "Gothique" "Ornements" 5

create_scene "vue-cathedrale" "Vue Cathédrale" "scene_vue_cathedrale" "Extérieur" \
  "Vue panoramique sur l'ensemble de la cathédrale, offrant une perspective unique sur sa silhouette gothique." \
  "XIVe siècle" "Gothique" "Panorama" 6

create_scene "vue-donjon" "Vue Donjon" "scene_vue_donjon" "Extérieur" \
  "Vue depuis le donjon permettant d'observer la cathédrale et ses environs depuis un point de vue élevé." \
  "Médiéval" "Gothique" "Vue aérienne" 7

# Intérieur
create_scene "entree" "Entrée" "scene_entree" "Intérieur" \
  "L'entrée de la cathédrale dévoile la nef principale et ses voûtes gothiques s'élevant vers la lumière." \
  "XIVe siècle" "Gothique flamboyant" "Voûtes d'ogives" 10

create_scene "orgue" "Orgue" "scene_orgue" "Intérieur" \
  "Le grand orgue de la cathédrale, instrument remarquable dominant la tribune occidentale." \
  "XVIIe siècle" "Baroque" "Buffet d'orgue" 11

create_scene "orgue-choeur" "Orgue et Chœur" "scene_orgue_choeur" "Intérieur" \
  "Vue reliant le grand orgue au chœur, montrant toute la profondeur de la nef centrale." \
  "XIVe-XVIIe siècle" "Gothique" "Perspective de la nef" 12

create_scene "autel" "Autel" "scene_autel" "Intérieur" \
  "L'autel principal de la cathédrale, centre de la liturgie, entouré de ses ornements sacrés." \
  "XVe siècle" "Gothique flamboyant" "Retable" 13

create_scene "choeur-autel" "Chœur - Autel" "scene_choeur_autel" "Intérieur" \
  "Le chœur et son autel, espace sacré entouré de stalles en bois sculpté et de vitraux lumineux." \
  "XVe siècle" "Gothique flamboyant" "Stalles sculptées" 14

create_scene "choeur-autel1" "Chœur - Vue latérale" "scene_choeur_autel1" "Intérieur" \
  "Vue latérale du chœur révélant les détails des vitraux et de l'architecture intérieure." \
  "XVe siècle" "Gothique flamboyant" "Vitraux" 15

create_scene "choeur-autel2" "Chœur - Vue arrière" "scene_choeur_autel2" "Intérieur" \
  "Perspective depuis l'arrière du chœur, offrant une vue sur l'ensemble de l'espace liturgique." \
  "XVe siècle" "Gothique flamboyant" "Déambulatoire" 16

create_scene "aile-nord-autel" "Aile Nord - Autel" "scene_aile_nord_autel" "Intérieur" \
  "L'autel de l'aile nord, dédié à un saint patron, orné de peintures et de sculptures remarquables." \
  "XVe siècle" "Gothique" "Peintures murales" 17

create_scene "aile-nord-centre" "Aile Nord - Centre" "scene_aile_nord_centre" "Intérieur" \
  "Le centre de l'aile nord avec ses piliers et ses arcs-boutants caractéristiques du style gothique." \
  "XIVe siècle" "Gothique" "Piliers" 18

create_scene "aile-sud-autel" "Aile Sud - Autel" "scene_aile_sud_autel" "Intérieur" \
  "L'autel latéral de l'aile sud, présentant un retable richement décoré et des vitraux colorés." \
  "XVe siècle" "Gothique" "Retable" 19

create_scene "aile-sud-autel2" "Aile Sud - Second autel" "scene_aile_sud_autel2" "Intérieur" \
  "Un second espace de dévotion dans l'aile sud, témoignant de la richesse des chapelles latérales." \
  "XVe siècle" "Gothique" "Chapelle latérale" 20

create_scene "aile-sud-baptistere" "Baptistère" "scene_aile_sud_baptistere" "Intérieur" \
  "Les fonts baptismaux de la cathédrale, lieu de baptême depuis des siècles, ornés de sculptures." \
  "XVe siècle" "Gothique" "Fonts baptismaux" 21

create_scene "aile-sud-centre" "Aile Sud - Centre" "scene_aile_sud_centre" "Intérieur" \
  "Le centre de l'aile sud offre une perspective sur les colonnes et les voûtes de ce bas-côté." \
  "XIVe siècle" "Gothique" "Colonnes" 22

create_scene "aile-sud-fond" "Aile Sud - Fond" "scene_aile_sud_fond" "Intérieur" \
  "Le fond de l'aile sud, espace de recueillement baigné par la lumière filtrée des vitraux." \
  "XIVe siècle" "Gothique" "Vitraux" 23

# Crypte
create_scene "crypte" "Crypte" "scene_crypte" "Crypte" \
  "La crypte romane, partie la plus ancienne de l'édifice, avec ses voûtes basses et ses colonnes trapues." \
  "XIe siècle" "Roman" "Voûtes romanes" 30

echo ""
echo "✅ All scenes created!"
