// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import * as rdf from "../src/server/rdf.js"

const NAMESPACE = "http://uri.gbv.de/terminology/"

// Vitest hoists mock factories, so the fake backend must be created inside vi.hoisted.
const { fakeBackend } = vi.hoisted(() => {
  const namespace = "http://uri.gbv.de/terminology/"
  const schemes = [
    {
      uri: `${namespace}isil/`,
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      prefLabel: { en: "ISIL" },
    },
    {
      uri: `${namespace}fbl/`,
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      prefLabel: { en: "FBL" },
    },
    {
      uri: `${namespace}ulbb/`,
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      prefLabel: { en: "ULBB" },
    },
    {
      uri: `${namespace}prizepapers_lading_type/`,
      type: ["http://www.w3.org/2004/02/skos/core#ConceptScheme"],
      prefLabel: { en: "Prize Papers Lading Type" },
      // Simulates a deprecated scheme path that should resolve to the canonical URI.
      identifier: [`${namespace}prizepapers_lading`],
    },
  ]
  const concepts = new Map([
    [
      "https://ld.zdb-services.de/resource/organisations/DE-131",
      {
        uri: "https://ld.zdb-services.de/resource/organisations/DE-131",
        type: ["http://www.w3.org/2004/02/skos/core#Concept"],
        prefLabel: { en: "Stadtbibliothek am Neumarkt" },
        inScheme: [{ uri: `${namespace}isil/` }],
      },
    ],
    [
      `${namespace}ulbb/ROM%20C%2041-80`,
      {
        uri: `${namespace}ulbb/ROM%20C%2041-80`,
        type: ["http://www.w3.org/2004/02/skos/core#Concept"],
        prefLabel: { en: "ROM C 41-80" },
        inScheme: [{ uri: `${namespace}ulbb/` }],
      },
    ],
  ])
  // Mirror enough of ApiBackend.getScheme matching for route-level alias tests.
  const normalize = uri => uri && !uri.endsWith("/") ? `${uri}/` : uri
  
  const matches = (scheme, uri) => {
    const candidates = [uri, normalize(uri)]
    return candidates.includes(scheme.uri) ||
      candidates.includes(normalize(scheme.uri)) ||
      (scheme.identifier || []).some(id => candidates.includes(id) || candidates.includes(normalize(id)))
  }

  return {
    fakeBackend: {
      getSchemes: async () => schemes,
      getScheme: async uri => schemes.find(s => matches(s, uri)) || null,
      getConcept: async uri => concepts.get(uri) || null,
      toString: () => "mocked backend",
    },
  }
})

vi.mock("../src/server/backend.js", () => ({
  initBackend: () => fakeBackend,
}))

// Keep tests focused on Express routes without starting Vite's real dev middleware.
vi.mock("vite-express", () => ({
  default: {
    config() {},
    listen(app, port, callback) {
      app.get("/", (req, res) => {
        res.type("html").send("<!doctype html><html><body></body></html>")
      })
      return app.listen(port, "127.0.0.1", callback)
    },
  },
}))

let baseUrl
let closeServer

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options)
}

beforeAll(async () => {
  process.env.NODE_ENV = "test"
  // Import after mocks are registered so server startup uses the fake backend.
  const server = await import("../src/server/server.js")
  const config = (await import("../config/config.js")).default

  await server.appStarted
  closeServer = server.closeServer
  baseUrl = `http://localhost:${config.port}`
})

afterAll(async () => {
  await closeServer?.()
})

describe("server", () => {
  it("/ should return HTML", async () => {
    const res = await request("/")

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
  })

  it("/terminology/ulbb/?format=NO_FORMAT should return a 400 Bad request with message", async () => {
    const res = await request("/terminology/ulbb/?format=NO_FORMAT")

    expect(res.status).toBe(400)
    expect(res.headers.get("content-type")).toContain("text/html")
    expect(await res.text()).toBe("Serialization format NO_FORMAT not supported!")
  })

  // Run the same route checks for every RDF serialization format the server supports.
  for (const format in rdf.contentTypes) {
    const value = rdf.contentTypes[format]

    it(`/terminology/isil/?format=${format} should return ${value}`, async () => {
      const res = await request(`/terminology/isil/?format=${format}`)

      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain(value)
    })

    it(`/terminology/fbl?format=${format} should return ${value}`, async () => {
      const res = await request(`/terminology/fbl?format=${format}`)

      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain(value)
    })

    it(`/terminology/isil/?format=${format} and uri parameter should return ${value}`, async () => {
      const res = await request(`/terminology/isil/?format=${format}&uri=https%3A%2F%2Fld.zdb-services.de%2Fresource%2Forganisations%2FDE-131`)

      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain(value)
    })

    it(`/terminology/ulbb/ROM C 41-80/?format=${format} and uri parameter should return ${value}`, async () => {
      const res = await request(`/terminology/ulbb/ROM C 41-80/?format=${format}`)

      expect(res.status).toBe(200)
      expect(res.headers.get("content-type")).toContain(value)
    })
  }

  it("resolves an aliased/deprecated scheme URI via `identifier` to the canonical scheme", async () => {
    const res = await request("/terminology/prizepapers_lading/?format=jsonld")
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("application/json")
    expect(body.uri).toBe(`${NAMESPACE}prizepapers_lading_type/`)
    expect(body.identifier).toContain(`${NAMESPACE}prizepapers_lading`)
  })

  it("redirects HTML concept route from deprecated scheme path to canonical path", async () => {
    const conceptId = "1b6398db-fc61-45f8-b325-e96666f4505b"
    const res = await request(`/terminology/prizepapers_lading/${conceptId}`, { redirect: "manual" })

    expect(res.status).toBe(301)
    expect(res.headers.get("location")).toBe(`/terminology/prizepapers_lading_type/${conceptId}`)
  })
})
