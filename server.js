import express from "express"
import portfinder from "portfinder"
import { URL } from "node:url"
import { initBackend } from "./src/backends.js"
import fs from "fs"

import config from "./src/config.js"

const app = express()

// serve static files and EJS templates
app.use(express.static('public'))
app.set("views", "./views")
app.set("view engine", "ejs")
app.get("/", serveHtml)

// serve build Vue application
const assets = fs.readdirSync('dist/assets/')
const root = 'dist/assets/'
if (assets.length) {
  console.log(`Serving Vue application from ${assets}`)
  app.get("/client.js", (req, res) => res.sendFile(assets.filter(f => f.endsWith('js'))[0], { root }))
  app.get("/client.css", (req, res) => res.sendFile(assets.filter(f => f.endsWith('css'))[0], { root }))
}

function serveHtml(req, res, uri, jskos) {
  res.setHeader("Content-Type", "text/html")
  const relUri = uri ? uri.pathname : ''
  res.render("index", { config, uri, relUri, jskos })
}

// serve JSKOS data
app.set("json spaces", 2)
app.use(async (req, res) => {
  const uri = new URL("."+req.url, config.base)
  uri.search = ""

  if (uri == config.base) {
    serveHtml(req, res)
     return
  }

  const format = req.query.format || requestFormat(req) || "jsonld"
  if (!format.match(/^(html|json|jsonld|jskos)$/) && !rdfTypes[format]) {
    res.status(400)
    res.send(`Serialization format ${format} not supported!`)
    return
  }

  const backend = app.get("backend")
  // TODO catch error and send 5xx error in case
  const data = await backend.getItem(`${uri}`)
  res.status(data ? 200 : 404)

  console.log((data ? "got " : "missing ") + uri)

  if (format === "html") {
    serveHtml(req, res, `${uri}`, data)
  } else {
    const contentType = rdfTypes[format]
    if (contentType && contentType != "application/json") {
      res.set("Content-Type", contentType)
      res.send(await serializeRDF(data, contentType))
    } else {
      res.json(data)
    }
  }
})

const rdfTypes = {
  nt: "application/n-triples",
  ntriples: "application/n-triples",
  json: "application/json",
  jskos: "application/json",
  jsonld: "application/json",
  turtle: "text/turtle",
  ttl: "text/turtle",
  rdfxml: "application/rdf+xml",
  xml: "application/rdf+xml",
}

function requestFormat(req) {

  // supported Content Types, sorted by priority
  const formats = [
    [ "html", ["text/html", "application/xhtml+xml"] ],
    [ "jsonld", ["application/ld+json", "application/json"] ],
    [ "ntriples", ["application/n-triples", "text/plain"] ],
    [ "turtle", [ "text/turtle", "application/turtle", "application/x-turtle", "text/n3", "text/rdf+n3", "application/rdf+n3" ] ],
    [ "rdfxml", ["application/rdf+xml", "text/rdf"] ],
  ]

  for (let [format, types] of formats) {
    for (let type of types) {
      if (req.accepts(type)) {
        return format
      }
    }
  }
}

// import jskosContext from `./src/context.json` assert { type: `json` }
const jskosContext = JSON.parse(await fs.promises.readFile(new URL("./src/context.json", import.meta.url)))

import jsonld from "jsonld"

async function serializeRDF(item, format) {
  item["@context"] = jskosContext

  if (format === "application/n-triples") {
    return jsonld.toRDF(item, { format: "application/n-quads" })
  }

  // TODO: else flatten and map to another serialization
  // TODO: see https://github.com/gbv/bartoc.org/blob/dev/src/rdf.js#L37
}

const start = async () => {
  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }

  const backend = await initBackend(config.backend)
  app.set("backend", backend)

  app.listen(config.port, () => {
    console.log(`JSKOS proxy ${config.base} from ${backend.name} listening on port ${config.port}`)
  })
}

start()

export { app }
