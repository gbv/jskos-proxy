import { describe, it, expect } from "vitest"

import { ApiBackend } from "../src/server/backend.js"

const scheme = (uri, data = {}) => ({
  uri,
  prefLabel: { en: uri },
  ...data,
})

// Each backend gets a sequence of responses; every reload consumes the next
// value, and the final value is reused for later reloads.
const makeBackend = sequences => {
  const calls = {}
  const bases = Object.keys(sequences)

  return new ApiBackend(bases.join(","), () => {}, {
    initializeRegistry: ({ status }) => {
      const base = status.replace(/status$/, "")
      calls[base] ??= 0

      return {
        _api: { status },
        getSchemes: async () => {
          const values = sequences[base]
          const value = values[Math.min(calls[base]++, values.length - 1)]

          if (value instanceof Error) {
            throw value
          }

          return value
        },
      }
    },
    repeat: () => {},
  })
}

describe("ApiBackend scheme refresh", () => {
  it("keeps cached schemes for a registry when a later refresh fails", async () => {
    const backend = makeBackend({
      "https://api.dante.gbv.de/": [
        [scheme("http://uri.gbv.de/terminology/bk/")],
        new Error("DANTE unavailable"),
      ],
      "https://coli-conc.gbv.de/api/": [
        [scheme("http://uri.gbv.de/terminology/coli/")],
        [scheme("http://uri.gbv.de/terminology/coli/"), scheme("http://uri.gbv.de/terminology/new/")],
      ],
    })

    // In production the repeat callback publishes reloadSchemes() into backend.schemes.
    backend.schemes = await backend.reloadSchemes()
    const refreshed = await backend.reloadSchemes()

    expect(refreshed.map(s => s.uri)).toEqual([
      "http://uri.gbv.de/terminology/bk/",
      "http://uri.gbv.de/terminology/coli/",
      "http://uri.gbv.de/terminology/new/",
    ])
  })

  it("keeps cached schemes when a registry refresh returns no usable schemes", async () => {
    const backend = makeBackend({
      "https://api.dante.gbv.de/": [
        [scheme("http://uri.gbv.de/terminology/bk/")],
        [scheme("http://uri.gbv.de/terminology/bk/", { concepts: [] })],
      ],
    })

    // Publish the initial load so the next reload is treated as a refresh with cache.
    backend.schemes = await backend.reloadSchemes()
    const refreshed = await backend.reloadSchemes()

    expect(refreshed.map(s => s.uri)).toEqual(["http://uri.gbv.de/terminology/bk/"])
  })

  it("logs when a cached registry recovers with fresh schemes", async () => {
    const calls = {}
    const logs = []
    const backend = new ApiBackend("https://api.dante.gbv.de/", message => logs.push(message), {
      initializeRegistry: ({ status }) => {
        const base = status.replace(/status$/, "")
        calls[base] ??= 0

        return {
          _api: { status },
          getSchemes: async () => {
            calls[base] += 1

            if (calls[base] === 1) {
              return [scheme("http://uri.gbv.de/terminology/bk/")]
            }
            if (calls[base] === 2) {
              throw new Error("DANTE unavailable")
            }
            return [
              scheme("http://uri.gbv.de/terminology/bk/"),
              scheme("http://uri.gbv.de/terminology/license/"),
            ]
          },
        }
      },
      repeat: () => {},
    })

    // First publish succeeds, second reload falls back to cache, third reload recovers.
    backend.schemes = await backend.reloadSchemes()
    backend.schemes = await backend.reloadSchemes()
    const refreshed = await backend.reloadSchemes()

    expect(refreshed.map(s => s.uri)).toEqual([
      "http://uri.gbv.de/terminology/bk/",
      "http://uri.gbv.de/terminology/license/",
    ])
    expect(logs).toContain("ApiBackend: https://api.dante.gbv.de/status recovered; replacing cached schemes with 2 fresh schemes.")
  })

  it("does not publish a partial initial load when a registry fails without cache", async () => {
    const backend = makeBackend({
      "https://api.dante.gbv.de/": [
        new Error("DANTE unavailable"),
      ],
      "https://coli-conc.gbv.de/api/": [
        [scheme("http://uri.gbv.de/terminology/coli/")],
      ],
    })

    await expect(backend.reloadSchemes()).rejects.toThrow("DANTE unavailable")
  })

  it("passes the API base URL when creating ConceptApi registries", () => {
    let registryConfig
    const backend = new ApiBackend("https://api.dante.gbv.de/", () => {}, {
      initializeRegistry: config => {
        registryConfig = config
        return {
          _api: { api: config.api, status: config.status },
          getSchemes: async () => [],
        }
      },
      repeat: () => {},
    })

    backend.createRegistries()

    expect(registryConfig).toEqual({
      provider: "ConceptApi",
      api: "https://api.dante.gbv.de/",
      status: "https://api.dante.gbv.de/status",
    })
  })
})
