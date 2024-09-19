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
    let previouslyErrored = false
    this.getSchemesPromise = new Promise(resolve => {
      cdk.repeat({
        function: () => {
          if (!this.registry?._api?.api) {
            this.registry = cdk.initializeRegistry({
              provider: "ConceptApi",
              // ? Does "base" always have a trailing slash?
              status: `${this.base}status`,
            })
          }
          return this.registry.getSchemes({ params: { limit: 10000 } })
        },
        callback: (error, result) => {
          if (error) {
            log(`ApiBackend: Error when loading schemes - ${error}`)
            previouslyErrored = true
            return
          }
          if (!this.schemes || previouslyErrored) {
            log(`Loaded ${result.length} schemes for backend.`)
            previouslyErrored = false
          }
          // Only return schemes that have concepts
          this.schemes = result.filter(s => !s.concepts || s.concepts?.length > 0)
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
    // TODO: Also load topConcepts?
    return this.schemes.find(scheme => jskos.compare(scheme, { uri }))
  }

  async getConcept(uri) {
    let properties = this.registry._defaultParams?.properties || ""
    properties += (properties ? "," : "") + "broader,ancestors,narrower"
    return (await this.registry.getConcepts({ concepts: [{ uri }], params: { properties } }))?.[0]
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
