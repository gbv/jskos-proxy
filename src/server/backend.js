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

  constructor(base, log) {

    this.base = base
    this.log = log || (() => {})

    // Load schemes in background and update every 60 seconds
    this.schemes = null
    let previouslyErrored = false, partialError
    this.getSchemesPromise = new Promise(resolve => {
      cdk.repeat({
        function: async () => {
          if (!this.registries?.length || previouslyErrored) {
            this.registries = this.base.split(",").map(base => cdk.initializeRegistry({
              provider: "ConceptApi",
              // ? Does "base" always have a trailing slash?
              status: `${base}status`,
            }))
            // Explicitly set cdk instance for each registry to null so that `registryForScheme` won't be used
            this.registries.forEach(registry => {
              registry.cdk = null
            })
          }
          let schemes = []
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
            if (!schemes.find(scheme => jskos.compare(scheme, result)) && result.concepts?.length !== 0) {
              schemes.push(result)
            }
          }
          return schemes.map(scheme => new jskos.ConceptScheme(scheme))
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
    if (!this.schemes) {
      await this.getSchemesPromise
    }
  
    // Try to find the scheme
    let schemeMatch = this.schemes.find(scheme => jskos.compare(scheme, { uri }))
  
    if (!schemeMatch) {
      // No exact match found, trying with a trailing slash...
      const uriWithSlash = uri.endsWith("/") ? uri : `${uri}/`
      
      schemeMatch = this.schemes.find(scheme => jskos.compare(scheme, { uri: uriWithSlash }))
    }
  
    return schemeMatch
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

export function initBackend({ backend, log }) {
  if (backend.match(/^https?:/)) {
    return new ApiBackend(backend, log)
  } else {
    return new FileBackend(backend, log)
  }
}
