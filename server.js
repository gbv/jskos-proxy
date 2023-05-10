import express from "express"
import portfinder from "portfinder"
import { initBackend } from "./src/backends.js"
import { serialize, contentTypes } from "./src/rdf.js"
import fs from "fs"

import config from "./src/config.js"
const { log, info } = config

// JSKOS API
config.api = "https://api.dante.gbv.de/"

const app = express()

// serve static files and EJS templates
app.use(express.static("public"))
app.set("views", "./views")
app.set("view engine", "ejs")

// find Vue application
const assetsDir = "dist/assets/"
const assets = fs.readdirSync(assetsDir)
if (assets.length) {
  log(`Serving Vue application from ${assetsDir}`)
  app.get("/client.js", (req, res) => res.sendFile(assets.filter(f => f.endsWith("js"))[0], { root: assetsDir }))
  app.get("/client.css", (req, res) => res.sendFile(assets.filter(f => f.endsWith("css"))[0], { root: assetsDir }))
}

// server HTML view or info information
function serve(req, res, vars) {
  const relUri = vars.uri ? vars.uri.pathname : "" // FIXME: remove root
  vars.source = vars.item?._source
  const options = { ...config, ...vars, relUri }

  if (req.query.format === "debug") {
    res.json(options)
  } else {
    res.render("index", options)
  }
}

// guess requested format from Accept-header
function requestFormat(req) {
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

// serve JSKOS data
app.set("json spaces", 2)
app.use(async (req, res) => {
  const base = `http:${config.base}` // TODO: configure protocol

  // URI given by query parameter
  const queryURI = req.query.uri || ""
  if (queryURI.startsWith(`http:${config.base}`) ||
      queryURI.startsWith(`https:${config.base}`)) {
    res.redirect(301,queryURI.replace(/^https?:/,"").substr(config.host.length+2))
    return
  }

  var uri = new URL("."+req.url, base)
  uri.search = ""

  if (queryURI) {
    try {
      uri = new URL(queryURI)
    } catch {
      res.status(400)
      res.send("Invalid URI")
      return
    }
  }

  info(`get ${uri}`)

  if (uri == base) {
    serve(req, res, { })
    return
  }

  const format = req.query.format || requestFormat(req) || "jsonld"
  if (!format.match(/^(html|debug|json|jsonld|jskos)$/) && !contentTypes[format]) {
    res.status(400)
    res.send(`Serialization format ${format} not supported!`)
    return
  }

  const backend = app.get("backend")
  // TODO catch error and send 5xx error in case
  const item = await backend.getItem(`${uri}`)
  res.status(item ? 200 : 404)

  info((item ? "got " : "missing ") + uri)

  if (format === "html" || format === "debug") {
    serve(req, res, { uri: `${uri}`, item })
  } else {
    const contentType = contentTypes[format]
    if (contentType && contentType != "application/json") {
      res.set("Content-Type", contentType)
      res.send(await serialize(item, contentType))
    } else {
      res.json(item)
    }
  }
})

// start the proxy server
const start = async () => {
  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }

  const backend = await initBackend(config)
  app.set("backend", backend)

  if (config.index) {
    app.set("index", await initBackend({...config, backend: config.index}))
  }

  app.listen(config.port, () => {
    log(`JSKOS proxy ${config.base} from ${backend.name} listening on port ${config.port}`)
  })
}

start()

/*
 * TODO: mount at /${root} for testing.
 * Current workaround is to use a reverse proxy, e.g. Apache with:
 *
 * ProxyPass /terminology/ http://127.0.0.1:3555/
 * ProxyPassReverse /terminology/ http://127.0.0.1:3555/
 */

export { app }
