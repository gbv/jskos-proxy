import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const conceptUri = "http://www.cidoc-crm.org/cidoc-crm/E5_Event"
const cidocNamespace = "http://www.cidoc-crm.org/cidoc-crm/"

let store
let primaryRegistry
let fallbackRegistry
let originalGetConcepts

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    json: async () => [],
  })))

  store = await import("../src/client/store.js")
  await store.schemeFetchPromise

  primaryRegistry = store.registries[0]
  originalGetConcepts = primaryRegistry.getConcepts
  fallbackRegistry = {
    _api: { status: "https://fallback.example/status" },
    getConcepts: vi.fn(),
  }
  store.registries.push(fallbackRegistry)

  store.state.schemes = [{
    uri: "http://bartoc.org/en/node/1644",
    namespace: cidocNamespace,
    _registry: primaryRegistry,
    notationFromUri: uri => uri.startsWith(cidocNamespace)
      ? uri.slice(cidocNamespace.length)
      : undefined,
  }]
})

beforeEach(() => {
  store.state.concepts = {}
  primaryRegistry.getConcepts = vi.fn()
  fallbackRegistry.getConcepts = vi.fn()
})

afterAll(() => {
  primaryRegistry.getConcepts = originalGetConcepts
  store.registries.pop()
  vi.unstubAllGlobals()
})

describe("loadConcept registry fallback", () => {
  it("tries remaining registries when the registry inferred from the scheme has no result", async () => {
    const concept = { uri: conceptUri, prefLabel: { en: "Event" } }
    primaryRegistry.getConcepts.mockResolvedValue([])
    fallbackRegistry.getConcepts.mockResolvedValue([concept])

    const result = await store.loadConcept(conceptUri, undefined, false)

    expect(result).toBe(concept)
    expect(primaryRegistry.getConcepts).toHaveBeenCalledOnce()
    expect(fallbackRegistry.getConcepts).toHaveBeenCalledOnce()
    expect(primaryRegistry.getConcepts.mock.invocationCallOrder[0])
      .toBeLessThan(fallbackRegistry.getConcepts.mock.invocationCallOrder[0])
  })

  it("does not query fallback registries when the inferred registry resolves the concept", async () => {
    const concept = { uri: conceptUri, prefLabel: { en: "Event" } }
    primaryRegistry.getConcepts.mockResolvedValue([concept])

    const result = await store.loadConcept(conceptUri, undefined, false)

    expect(result).toBe(concept)
    expect(primaryRegistry.getConcepts).toHaveBeenCalledOnce()
    expect(fallbackRegistry.getConcepts).not.toHaveBeenCalled()
  })
})
