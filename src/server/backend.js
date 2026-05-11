import fs from "node:fs"
import jskos from "jskos-tools"
import { cdk } from "cocoda-sdk"

// How often to refresh the scheme list from the API backends, in milliseconds.
const SCHEME_REFRESH_INTERVAL = 6 * 1000

/**
 * Get a readable registry label for logs.
 */
const registryLabel = registry =>
  registry._api?.status || registry._jskos?.status || registry._base

/**
 * Normalize JSKOS API responses that may contain zero, one, or many schemes.
 */
const normalizeSchemeList = list => Array.isArray(list) ? list : (list ? [list] : [])

/**
 * Convert one registry response into ConceptScheme instances tied to that registry.
 */
function schemesFromRegistryList(registry, list) {
  // Normalize first so callers can pass cached data, API arrays, single objects, or empty responses.
  return normalizeSchemeList(list).reduce((schemes, raw) => {
    // Only an explicit empty `concepts` array means the scheme cannot provide concepts.
    const providesConcepts = !(Array.isArray(raw.concepts) && raw.concepts.length === 0)

    // Some registries expose scheme metadata but cannot serve concepts; skip those when required.
    if (registry._requireConcepts && !providesConcepts) {
      return schemes
    }

    // Wrap the raw object and keep local metadata needed by later concept lookup.
    const scheme = new jskos.ConceptScheme(raw)
    scheme._registry = registry
    scheme.providesConcepts = providesConcepts
    schemes.push(scheme)
    return schemes
  }, [])
}

/**
 * Merge scheme lists while preserving backend priority.
 */
function mergeSchemeLists(lists) {
  const schemes = []

  // Backends are ordered by priority: the first backend wins on duplicates.
  for (const list of lists) {
    for (const scheme of list) {
      if (!schemes.find(existing => jskos.compare(existing, scheme))) {
        schemes.push(scheme)
      }
    }
  }

  return schemes
}

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

    // Backend configuration: base can contain one or more comma-separated ConceptApi URLs.
    this.base = base
    this.log = log || (() => {})
    // Concept availability policy: default applies unless a specific backend overrides it.
    this.requireConceptsDefault = opts.requireConcepts !== false
    this.requireConceptsOverrides = opts.requireConceptsOverrides || new Map()

    // Injectable SDK hooks keep tests deterministic while production uses cocoda-sdk defaults.
    this.initializeRegistry = opts.initializeRegistry || cdk.initializeRegistry
    this.repeat = opts.repeat || cdk.repeat
    this.refreshInterval = opts.refreshInterval || SCHEME_REFRESH_INTERVAL

    // Publicly served scheme list; null until the initial refresh succeeds.
    this.schemes = null
    // Per-backend cache keeps transient refresh failures from removing a backend.
    this.schemeCache = new Map()
    // Tracks backends currently served from cache so recovery can be logged once.
    this.cachedBackendBases = new Set()
    // Tracks top-level refresh failures between repeat callbacks.
    let previouslyErrored = false

    this.getSchemesPromise = new Promise(resolve => {
      this.repeat({
        function: () => this.reloadSchemes(),
        callback: (error, result) => {
          if (error) {
            this.log(`ApiBackend: Error when loading schemes - ${error}`)
            previouslyErrored = true
            return
          }
          if ((this.schemes?.length !== result?.length) || previouslyErrored) {
            this.log(`Loaded ${result.length} schemes for backend.`)
            previouslyErrored = false
          }
          this.schemes = result
          resolve()
        },
        interval: this.refreshInterval,
        callImmediately: true,
      })
    })
  }

  /**
   * Create one ConceptApi registry for each configured backend URL.
   */
  createRegistries() {
    // `base` can list multiple ConceptApi endpoints, ordered by priority.
    return this.base.split(",").map(base => {
      base = base.trim()
      // Pass both api and status: the registry uses api for requests and status for labels/logs.
      const registry = this.initializeRegistry({
        provider: "ConceptApi",
        api: base,
        status: `${base}status`,
      })
      // Prevent automatic registryForScheme: we decide the registry by scheme.
      registry.cdk = null
      // Keep local metadata on the registry so refresh/cache logic can stay per backend.
      registry._base = base
      registry._requireConcepts = this.requireConceptsOverrides.has(base)
        ? this.requireConceptsOverrides.get(base)
        : this.requireConceptsDefault
      return registry
    })
  }

  /**
   * Return cached schemes for one registry as ConceptScheme instances.
   */
  cachedSchemes(registry) {
    return schemesFromRegistryList(registry, this.schemeCache.get(registry._base))
  }

  /**
   * Load schemes for one registry, falling back to its cache after transient failures.
   */
  async loadRegistrySchemes(registry) {
    // Cache is tracked per backend so one failing registry does not erase its last good schemes.
    const hasCache = this.schemeCache.has(registry._base)

    try {
      const rawSchemes = normalizeSchemeList(await registry.getSchemes({ params: { limit: 10000 } }))
      const schemes = schemesFromRegistryList(registry, rawSchemes)

      // Accept fresh data when it contains usable schemes, or when this is the first load.
      if (schemes.length || !hasCache) {
        if (schemes.length && this.cachedBackendBases.delete(registry._base)) {
          this.log(`ApiBackend: ${registryLabel(registry)} recovered; replacing cached schemes with ${schemes.length} fresh schemes.`)
        }
        this.schemeCache.set(registry._base, rawSchemes)
        return schemes
      }

      // A cached backend returning only filtered-out schemes is treated like a transient bad refresh.
      this.log(`ApiBackend: ${registryLabel(registry)} returned no usable schemes; keeping ${this.cachedSchemes(registry).length} cached schemes.`)
    } catch (error) {
      if (!hasCache) {
        throw error
      }
      // After a successful previous load, keep serving the stale-but-known-good list.
      this.log(`ApiBackend: Error when loading schemes (API: ${registryLabel(registry)}) - ${error}; keeping ${this.cachedSchemes(registry).length} cached schemes.`)
    }

    // Remember that this backend is currently running from cache, so recovery can be logged.
    this.cachedBackendBases.add(registry._base)
    return this.cachedSchemes(registry)
  }

  /**
   * Refresh all registries and publish one merged scheme list.
   */
  async reloadSchemes() {
    // Create registries on every reload to ensure we have fresh instances for any new/dropped backends.
    this.registries = this.createRegistries()

    const lists = await Promise.all(
      this.registries.map(async registry => {
        try {
          return await this.loadRegistrySchemes(registry)
        } catch (error) {
          this.log(`ApiBackend: Error when loading schemes (API: ${registryLabel(registry)}) - ${error}`)
          if (!this.schemes) {
            throw error
          }
          return []
        }
      }),
    )

    const schemes = mergeSchemeLists(lists)
    if (!schemes.length) {
      throw new Error("No schemes loaded from backend.")
    }

    return schemes
  }

  /**
   * Return the current scheme list, waiting for the initial refresh if needed.
   */
  async getSchemes() {
    if (!this.schemes) {
      await this.getSchemesPromise
    }
    return this.schemes
  }

  /**
   * Find a scheme by canonical URI or by an identifier alias.
   */
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

  /**
   * Resolve a concept through the registry attached to its containing scheme.
   */
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

  /**
   * Return the backend configuration string.
   */
  toString() {
    return this.base
  }
}

/**
 * Initialize either an API-backed or file-backed backend from config.
 */
export function initBackend({ backend, log, requireConcepts, requireConceptsOverrides }) {
  if (backend.match(/^https?:/)) {
    return new ApiBackend(backend, log, { requireConcepts, requireConceptsOverrides })
  } else {
    return new FileBackend(backend, log)
  }
}
