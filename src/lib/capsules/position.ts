/** Position des capsules dans le panorama (degrés KRpano). Aucune dépendance : utilisé aussi par le script de conversion. */
export type Point = { ath: number; atv: number };

const ECART_MINI = 14; // degrés entre une capsule et tout autre hotspot

export const ecart = (a: Point, b: Point) =>
  Math.hypot((((a.ath - b.ath + 540) % 360 + 360) % 360 - 180) * Math.cos((a.atv * Math.PI) / 180), a.atv - b.atv);

/** Position libre la plus proche de la position voulue. */
export function placeLibre(voulue: Point, autres: Point[]): Point {
  const essais: Point[] = [];
  for (const dv of [0, -10, 10, -20, 20]) for (const dh of [0, 18, -18, 36, -36, 54, -54]) {
    essais.push({ ath: voulue.ath + dh, atv: voulue.atv + dv });
  }
  essais.sort((a, b) => ecart(a, voulue) - ecart(b, voulue));
  return essais.find((e) => autres.every((o) => ecart(e, o) >= ECART_MINI)) ?? voulue;
}

/** Hotspots (ath/atv) de chaque scène d'un tour.xml. */
export function hotspotsDepuisTour(xml: string): Record<string, Point[]> {
  const res: Record<string, Point[]> = {};
  for (const m of xml.matchAll(/<scene\s[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/scene>/g)) {
    res[m[1]] = [...m[2].matchAll(/<hotspot\s[^>]*>/g)].flatMap((h) => {
      const ath = h[0].match(/\sath="([-\d.]+)"/)?.[1];
      const atv = h[0].match(/\satv="([-\d.]+)"/)?.[1];
      return ath && atv ? [{ ath: Number(ath), atv: Number(atv) }] : [];
    });
  }
  return res;
}

/** Vue d'arrivée (hlookat/vlookat du premier <view>) de chaque scène d'un tour.xml. Attribut absent = 0 ; scène sans <view> = absente. */
export function vuesDepuisTour(xml: string): Record<string, Point> {
  const res: Record<string, Point> = {};
  for (const m of xml.matchAll(/<scene\s[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/scene>/g)) {
    const vue = m[2].match(/<view\s[^>]*>/)?.[0];
    if (!vue) continue;
    const attr = (nom: string) => Number(vue.match(new RegExp(`\\s${nom}="([-\\d.]+)"`))?.[1] ?? 0);
    res[m[1]] = { ath: attr("hlookat"), atv: attr("vlookat") };
  }
  return res;
}
