import fs from "node:fs"
import axios from "axios"
import jskos from "jskos-tools"

export class FileBackend {
  constructor(file, log) {
    this.file = file
    this.log= log
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
  constructor( base, log ) {
    this.base = base.replace(/\/$/,"").replace(/\?.*/,"")
    this.log = log
  }

  toString() {
    return this.base
  }

  async getItem(uri) {
    // TODO: add languges?
    // TODO: Use cocoda-sdk?
    const url = `${this.base}/data?` + new URLSearchParams({uri, properties: "*"})
    this.log(url)
    const result = await axios.get(url)
    const item = Array.isArray(result.data) ? result.data[0] : null
    if (item) {
      item._source = url
      // Load top concepts for schemes
      if (jskos.isScheme(item)) {
        try {
          item.topConcepts = (await axios.get(`${this.base}/voc/top?` + new URLSearchParams({ uri }))).data
        } catch (error) {
          item.topConcepts = []
        }
      }
      ["narrower", "topConcepts"].forEach(prop => {
        if (item[prop]?.length) {
          item[prop] = jskos.sortConcepts(item[prop])
        }
      })
    }
    return item
  }

  async listItems() {
    const url = `${this.base}?properties=*`
    this.log(url)
    return axios.get(url)
      .then(res => {
        res = Array.isArray(res.data) ? res.data : []
        res._source = url
        return res
      })
  }
}

export async function initBackend({ backend, log }) {
  if (backend.match(/^https?:/)) {

    return new ApiBackend(backend, log)
  } else {
    return new FileBackend(backend, log)
  }
}
