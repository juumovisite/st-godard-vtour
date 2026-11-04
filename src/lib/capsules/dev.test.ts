import { afterEach, describe, expect, it, vi } from "vitest";
import { horsOutil } from "./dev";

const req = (method: string, headers: Record<string, string> = {}, url = "http://localhost:3702/api/capsules") =>
  new Request(url, { method, headers });

afterEach(() => vi.unstubAllEnvs());

describe("horsOutil", () => {
  it("laisse passer un GET local en développement", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(horsOutil(req("GET"))).toBeNull();
  });
  it("laisse passer un POST de la même origine", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(horsOutil(req("POST", { "sec-fetch-site": "same-origin", origin: "http://localhost:3702" }))).toBeNull();
  });
  it("refuse un POST cross-site", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(horsOutil(req("POST", { "sec-fetch-site": "cross-site" }))?.status).toBe(404);
  });
  it("refuse un POST venant d'une autre origine", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(horsOutil(req("POST", { origin: "https://evil.example" }))?.status).toBe(404);
  });
  it("refuse tout en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(horsOutil(req("GET"))?.status).toBe(404);
    expect(horsOutil(req("POST", { "sec-fetch-site": "same-origin" }))?.status).toBe(404);
  });
});
