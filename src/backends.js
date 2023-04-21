import fs from "node:fs"
import axios from "axios"

export class FileBackend {
  constructor(file) {
    this.file = file
    this.items = {}
    fs.watch(file, () => this.load())
    this.load()
  }

  get name() {
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
    console.log(`loaded ${Object.keys(items).length} JSKOS items from ${this.file}`)
    this.items = items
  }

  async getItem(uri) {
    return this.items[uri]
  }
}

export class ApiBackend {
  constructor(base) {
    base = base.replace(/\/$/,"")
    this.base = base
  }

  get name() {
    return this.base
  }

  async getItem(uri) {
    // TODO: add languges?
    const url = `${this.base}/data?` + new URLSearchParams({uri, properties: "*"})
    console.log(url)
    return axios.get(url)
      .then(res => Array.isArray(res.data) ? res.data[0] : null)
      .then(item => {
        if (item) { item._source = url }
        return item
      })
  }
}

export async function initBackend(backend) {
  if (backend.match(/^https?:/)) {
    return new ApiBackend(backend)
  } else {
    return new FileBackend(backend)
  }
}
