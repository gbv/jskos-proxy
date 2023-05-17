import express from "express"
import portfinder from "portfinder"
import { protocolless, uriPath, link } from "./src/utils.js"
import { initBackend } from "./src/backends.js"
import { serialize, contentTypes } from "./src/rdf.js"
import fs from "fs"

import config from "./src/config.js"
const { log, info, namespace } = config

const app = express()

// serve static files and EJS templates
app.use(namespace.pathname, express.static("public"))
app.set("views", "./views")
app.set("view engine", "ejs")

// serve message on root if mounted at a specific root path
if (namespace.pathname !== "/") {
  app.get("/", (req, res) => {
    res.render("root", config)
  })
}

// serve Vue application
const assetsDir = "dist/assets/"
const assets = fs.readdirSync(assetsDir)
if (assets.length) {
  log(`Serving Vue application from ${assetsDir} at ${namespace.pathname}`)
  assets.forEach(file => {
    // Client JS and CSS are served as client.js/client.css
    // ? This might cause issues with browser caching as the filename stays the same.
    const clientMatch = file.match(/^index-.*\.(css|js)$/)
    if (clientMatch) {
      app.get(`${namespace.pathname}client.${clientMatch[1]}`, (req, res) => res.sendFile(file, { root: assetsDir }))
    }
    // Serve files with their original filenames
    app.get(`${namespace.pathname}${file}`, (req, res) => res.sendFile(file, { root: assetsDir }))
  })
}

// server HTML view or info information
function serve(req, res, vars) {
  vars.source = vars.item?._source
  const options = { ...config, ...vars, link }

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
console.log(namespace.pathname)
app.use(namespace.pathname, async (req, res) => {
  var uri

  if (req.query.uri) {
    // URI given by query parameter
    try {
      uri = new URL(req.query.uri)
    } catch {
      res.status(400)
      res.send("Invalid URI")
      return
    }
    const localUri = uriPath(uri, namespace)
    if (localUri != uri) {
      res.redirect(301, localUri)
      return
    }
  } else {
    // URI given by HTTP request
    uri = new URL(req.url.substr(1), namespace) // namespace.href?
    uri.search = ""
  }

  info(`get ${uri}`)

  const format = req.query.format || requestFormat(req) || "jsonld"
  if (!format.match(/^(html|debug|json|jsonld|jskos)$/) && !contentTypes[format]) {
    res.status(400)
    res.send(`Serialization format ${format} not supported!`)
    return
  }

  if (config.listing && protocolless(uri) === protocolless(namespace)) {
    serve(req, res, { })
    return
  }

  const backend = app.get("backend")
  // TODO catch error and send 5xx error in case
  const item = await backend.getItem(`${uri}`)
  res.status(item ? 200 : 404)

  info((item ? "got " : "missing ") + uri)

  if (format === "html" || format === "debug") {
    // serve HTML
    serve(req, res, { uri: `${uri}`, item })
  } else {
    // serialize RDF
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

  app.listen(config.port, () => {
    log(`JSKOS proxy ${namespace} from ${backend} at http://localhost:${config.port}/`)
  })
}

start()

export { app }
