import express from "express"
import portfinder from "portfinder"
import { initBackend } from "./src/backends.js"
import { serialize } from "./src/rdf.js"
import fs from "fs"

import config from "./src/config.js"
const { log, debug } = config

const app = express()

// serve static files and EJS templates
app.use(express.static("public"))
app.set("views", "./views")
app.set("view engine", "ejs")
app.get("/", serve)

// serve Vue application
const assetsDir = "dist/assets/"
const assets = fs.readdirSync(assetsDir)
if (assets.length) {
  log(`Serving Vue application from ${assetsDir}`)
  app.get("/client.js", (req, res) => res.sendFile(assets.filter(f => f.endsWith("js"))[0], { root: assetsDir }))
  app.get("/client.css", (req, res) => res.sendFile(assets.filter(f => f.endsWith("css"))[0], { root: assetsDir }))
}

function serve(req, res, uri, item) {
  const relUri = uri ? uri.pathname : "" // FIXME: remove root
  const options = { config, uri, relUri, item, root: "/" }

  if (req.query.format === "debug") {
    res.json(options)
  } else {
    res.render("index", options)
  }
}

// serve JSKOS data
app.set("json spaces", 2)
app.use(async (req, res) => {
  const base = `http:${config.base}` // TODO: configure protocol
  const uri = new URL("."+req.url, base)
  uri.search = ""

  debug(`get ${uri}`)

  if (uri == base) {
    serve(req, res)
    return
  }

  const format = req.query.format || requestFormat(req) || "jsonld"
  if (!format.match(/^(html|debug|json|jsonld|jskos)$/) && !rdfTypes[format]) {
    res.status(400)
    res.send(`Serialization format ${format} not supported!`)
    return
  }

  const backend = app.get("backend")
  // TODO catch error and send 5xx error in case
  const data = await backend.getItem(`${uri}`)
  res.status(data ? 200 : 404)

  debug((data ? "got " : "missing ") + uri)

  if (format === "html" || format === "debug") {
    serve(req, res, `${uri}`, data)
  } else {
    const contentType = rdfTypes[format]
    if (contentType && contentType != "application/json") {
      res.set("Content-Type", contentType)
      res.send(await serialize(data, contentType))
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

// start the proxy server
const start = async () => {
  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }

  const backend = await initBackend(config)
  app.set("backend", backend)

  app.listen(config.port, () => {
    log(`JSKOS proxy ${config.base} from ${backend.name} listening on port ${config.port}`)
  })
}

start()

export { app }
