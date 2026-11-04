import { describe, expect, it } from "vitest";
import { ecart, hotspotsDepuisTour, placeLibre, vuesDepuisTour } from "./position";

describe("placeLibre", () => {
  it("garde la position voulue si elle est libre", () => {
    expect(placeLibre({ ath: 0, atv: -12 }, [{ ath: 90, atv: 0 }])).toEqual({ ath: 0, atv: -12 });
  });
  it("s'écarte d'au moins 14° d'un hotspot", () => {
    const p = placeLibre({ ath: 0, atv: -12 }, [{ ath: 0, atv: -12 }]);
    expect(ecart(p, { ath: 0, atv: -12 })).toBeGreaterThanOrEqual(14);
  });
});

describe("hotspotsDepuisTour", () => {
  it("liste les hotspots de chaque scène", () => {
    const xml = `<scene name="scene_a" title="A"><hotspot name="h1" ath="10.5" atv="-3" /><hotspot name="h2" atv="4" ath="-20" /></scene>
<scene name="scene_b"><view /></scene>`;
    expect(hotspotsDepuisTour(xml)).toEqual({ scene_a: [{ ath: 10.5, atv: -3 }, { ath: -20, atv: 4 }], scene_b: [] });
  });
});

describe("vuesDepuisTour", () => {
  it("lit la vue d'arrivée (hlookat/vlookat) de chaque scène, attributs dans un ordre quelconque", () => {
    const xml = `<scene name="scene_a" title="A"><view fov="90" vlookat="5" hlookat="-30" /></scene>
<scene name="scene_b" title="B"><hotspot name="h" ath="1" atv="2" /></scene>`;
    expect(vuesDepuisTour(xml)).toEqual({ scene_a: { ath: -30, atv: 5 } });
  });
});
