import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { avecPrealign, lirePrealign, prealignDuFragment, prealignsDuTour, scenesDuTour, tourAvecPrealign, validerPrealign, ZERO } from "./prealign";

const TOUR = readFileSync("public/vtour/tour.xml", "utf8");

/** Lignes qui diffèrent entre deux textes de même nombre de lignes. */
const lignesChangees = (a: string, b: string) => {
  const la = a.split("\n"), lb = b.split("\n");
  expect(lb.length).toBe(la.length);
  return la.map((l, i) => [l, lb[i]] as const).filter(([x, y]) => x !== y);
};

describe("prealign", () => {
  it("lit tilt|pan|roll (2e = pan)", () => {
    expect(lirePrealign("-3|6|2.5")).toEqual({ tilt: -3, pan: 6, roll: 2.5 });
    expect(lirePrealign("")).toBeNull();
    expect(lirePrealign("a|b|c")).toBeNull();
  });

  it("pose, remplace et retire l'attribut sans toucher au reste de la balise", () => {
    expect(avecPrealign("<image>\n<cube/></image>", { tilt: -3, pan: 6, roll: 0 })).toBe('<image prealign="-3|6|0">\n<cube/></image>');
    expect(avecPrealign('<image hfov="1" prealign="1|2|3">', { tilt: 0.5, pan: -180, roll: 1 })).toBe('<image hfov="1" prealign="0.5|-180|1">');
    expect(avecPrealign('<image hfov="1" prealign="1|2|3">', ZERO)).toBe('<image hfov="1">');
    expect(prealignDuFragment('<imagex prealign="9|9|9"><image prealign="1|2|3">')).toBe("1|2|3");
    expect(() => avecPrealign("<preview/>", ZERO)).toThrow();
  });

  it("dans tour.xml, ne change que la balise <image> de la scène visée, et revient à l'identique", () => {
    const scenes = scenesDuTour(TOUR);
    expect(scenes.length).toBe(22);
    const cible = scenes[1];
    const modifie = tourAvecPrealign(TOUR, cible, { tilt: 2, pan: -45.5, roll: 0.5 });
    const diff = lignesChangees(TOUR, modifie);
    expect(diff).toHaveLength(1);
    expect(diff[0][1].trim()).toBe('<image prealign="2|-45.5|0.5">');
    expect(prealignsDuTour(modifie)).toEqual({ ...prealignsDuTour(TOUR), [cible]: "2|-45.5|0.5" });
    expect(tourAvecPrealign(modifie, cible, ZERO)).toBe(TOUR);
  });

  it("refuse une scène inconnue et des valeurs hors bornes", () => {
    expect(() => tourAvecPrealign(TOUR, "scene_inexistante", ZERO)).toThrow();
    expect(() => validerPrealign({ tilt: 20, pan: 0, roll: 0 })).toThrow();
    expect(() => validerPrealign({ tilt: 0, pan: "1", roll: 0 })).toThrow();
    expect(validerPrealign({ tilt: -15, pan: 180, roll: 15 })).toEqual({ tilt: -15, pan: 180, roll: 15 });
  });
});
