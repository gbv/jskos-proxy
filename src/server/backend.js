import fs from "node:fs"
import jskos from "jskos-tools"
import { cdk } from "cocoda-sdk"

// TODO!!! Adjust according to ApiBackend
export class FileBackend {
  constructor(file, log) {
    this.file = file
    this.log = log
    this.items = {}
    fs.watch(file, () => this.load())
    this.load()
  }

  toString() {
    return this.file
  }

  async load() {
    const items = {}
    const lines = await fs.promises.readFile(this.file,"utf8")
    for (let line of lines.split("\n")) {
      if (line.match(/^{/)) {
        const item = JSON.parse(line)
        items[item.uri] = item
      }
    }
    this.log(`loaded ${Object.keys(items).length} JSKOS items from ${this.file}`)
    this.items = items
  }

  async getItem(uri) {
    return this.items[uri]
  }

  async listItems() {
    return Object.values(this.items)
  }
}

export class ApiBackend {

  constructor(base, log, opts = {}) {

    this.base = base
    this.log = log || (() => {})
    this.requireConceptsDefault = opts.requireConcepts !== false
    this.requireConceptsOverrides = opts.requireConceptsOverrides || new Map()

    // Load schemes in background and update every 60 seconds
    this.schemes = null
    let previouslyErrored = false, partialError
    this.getSchemesPromise = new Promise(resolve => {
      cdk.repeat({
        function: async () => {


          /* if (!this.registries?.length || previouslyErrored) {
            this.registries = this.base.split(",").map(base => cdk.initializeRegistry({
              provider: "ConceptApi",
              // ? Does "base" always have a trailing slash?
              status: `${base}status`,
            }))
            // Explicitly set cdk instance for each registry to null so that `registryForScheme` won't be used
            this.registries.forEach(registry => {
              registry.cdk = null
            })
          } */

          if (!this.registries?.length || previouslyErrored) {
            this.registries = this.base.split(",").map(base => {
              const registry = cdk.initializeRegistry({
                provider: "ConceptApi",
                status: `${base}status`,
              })
              // prevent automatic registryForScheme
              registry.cdk = null
              // attach base + per-registry requireConcepts flag (override -> default)
              registry._base = base
              registry._requireConcepts = this.requireConceptsOverrides.has(base)
                ? this.requireConceptsOverrides.get(base)
                : this.requireConceptsDefault
              return registry
            })
          }








          /* let schemes = []
          partialError = null
          const results = (await Promise.all(
            this.registries
              .map(
                registry => registry.getSchemes({ params: { limit: 10000 } }).catch(error => {
                  partialError = error
                  log(`ApiBackend: Partial error when loading schemes (API: ${registry._jskos.status}) - ${error}`)
                  return []
                }),
              ),
          )).reduce((all, cur) => all.concat(cur), [])
          if (partialError && results.length === 0) {
            throw partialError
          }
          for (const result of results) {
            // Only add to schemes if not there yet = backends specified first have priority
            // Also don't add schemes that explicitly do not provide concepts
            if (!schemes.find(scheme => jskos.compare(scheme, result))) {
              schemes.push(result)
            }
          }
          return schemes.map(scheme => new jskos.ConceptScheme(scheme)) */

          let schemes = []
          partialError = null

          // fetch per registry so we know where each scheme came from
          const perRegistry = await Promise.all(
            this.registries.map(async (registry) => {
              try {
                const list = await registry.getSchemes({ params: { limit: 10000 } })
                return { registry, list }
              } catch (error) {
                partialError = error
                this.log(`ApiBackend: Partial error when loading schemes (API: ${registry._api?.status || registry._jskos?.status || registry._base}) - ${error}`)
                return { registry, list: [] }
              }
            }),
          )

          const allCount = perRegistry.reduce((n, x) => n + x.list.length, 0)
          if (partialError && allCount === 0) {
            throw partialError
          }

          // merge with priority = earlier registries first
          for (const { registry, list } of perRegistry) {
            for (const raw of list) {
              const providesConcepts = !(Array.isArray(raw.concepts) && raw.concepts.length === 0)
              // per-registry filter
              if (registry._requireConcepts && !providesConcepts) {
                continue
              }
              // skip duplicates (compare by identity/uri)
              if (schemes.find(s => jskos.compare(s, raw))) {
                continue
              }
              // make JSKOS ConceptScheme and tag metadata for client
              const cs = new jskos.ConceptScheme(raw)
              cs._registry = registry
              cs.providesConcepts = providesConcepts  // <-- visible to frontend (not underscored)
              schemes.push(cs)
            }
          }
          return schemes
        },
        callback: (error, result) => {
          if (error) {
            log(`ApiBackend: Error when loading schemes - ${error}`)
            previouslyErrored = true
            return
          }
          if ((this.schemes?.length !== result?.length) || previouslyErrored) {
            log(`Loaded ${result.length} schemes for backend.`)
            previouslyErrored = false
          }
          this.schemes = result
          resolve()
        },
        interval: 6 * 1000,
        callImmediately: true,
      })
    })
  }

  async getSchemes() {
    if (!this.schemes) {
      await this.getSchemesPromise
    }
    return this.schemes
  }

  async getScheme(uri) {
    // Ensure schemes are loaded before we try to match
    if (!this.schemes) {
      await this.getSchemesPromise
    }
    // Helper: normalize a URI to always have a trailing slash
    // (prevents mismatches between ".../foo" and ".../foo/")
    const norm = u => (typeof u === "string" && u.length ? (u.endsWith("/") ? u : `${u}/`) : u)

    // Candidate forms we want to test against:
    // - the raw URI we got
    // - the normalized-with-slash variant
    const cand = [uri, norm(uri)]

    // --- Direct match on canonical `scheme.uri` --------------------------
    // Try to find a scheme whose canonical URI matches either candidate form.
    // We also normalize the scheme's own uri when comparing, to be safe.
    let hit = this.schemes.find(s =>
      cand.includes(s.uri) || cand.includes(norm(s.uri)),
    )
    if (hit) {
      return hit
    }

    // --- Identifier fallback (alias/deprecated → canonical) --------------
    // No direct match? Then check every scheme’s `identifier` list.
    // If any identifier matches our candidates, we treat that scheme as the hit.
    // This covers the “deprecated URI → current canonical URI” use case.
    hit = this.schemes.find(s =>
      (s.identifier || []).some(id => cand.includes(id) || cand.includes(norm(id))),
    )
    if (hit) {
      return hit
    }

    // Nothing matched.
    return null

  }

  async getConcept(uri) {
    if (!this.schemes) {
      await this.getSchemesPromise
    }
    // Determine registry
    const registry = this.schemes.find(scheme => scheme.notationFromUri(uri))?._registry

    if (!registry) {
      return null
    }
    let properties = registry._defaultParams?.properties || ""
    properties += (properties ? "," : "") + "broader,ancestors,narrower"
    return (await registry.getConcepts({ concepts: [{ uri }], params: { properties } }))?.[0]
  }

  toString() {
    return this.base
  }
}

export function initBackend({ backend, log, requireConcepts, requireConceptsOverrides }) {
  if (backend.match(/^https?:/)) {
    return new ApiBackend(backend, log, { requireConcepts, requireConceptsOverrides })
  } else {
    return new FileBackend(backend, log)
  }
}
