import portfinder from "portfinder"
import express from "express"
import { URL } from "node:url"

// configuration
const config = {
  port: 3555,
  base: "http://uri.gbv.de/terminology/",
  backend: "https://api.dante.gbv.de/data",
}
const staticDir = "./public"

const app = express()
app.set("json spaces", 2)

// serve static files, including index.html
app.use(express.static(staticDir))
// Configure view engine to render EJS templates.
//app.set("views", __dirname + "/views")
//app.set("view engine", "ejs")


// serve JSKOS data
app.use(async (req, res) => {
  const uri = new URL("."+req.url, config.base)
  uri.search = ""

  const format = req.query.format || requestFormat(req) || "jsonld"
  if (!format.match(/^(html|json|jsonld|jskos)$/) && !rdfTypes[format]) {
    res.status(400)
    res.set("Content-Type", "text/plain")
    res.send("Serialization format not supported!")
    return
  }

  // TODO: hardcoded objects from file, e.g. a static ndjson file?

  // TODO catch error and send 5xx error in case
  const data = await queryBackend(uri)
  res.status(data ? "200" : "404")

  if (format === "html") {
    res.set("Content-Type", "text/html")
    // TODO: use jskos-web
    if (data) {
      res.send(`HTML for ${uri}`)
    } else {
      res.send(`Not found: ${uri}`)
    }
  } else {
    const type = rdfTypes[format]
    if (type) {
      res.set("Content-Type", type)
      await serializeRDF(data, type)
    } else {
      res.json(data)
    }
  }
})

const rdfTypes = {
  nt: "application/n-triples",
  ntriples: "application/n-triples",
  json: "application/json",
  jsonld: "application/json",
  turtle: "text/turtle",
  ttl: "text/turtle",
  rdfxml: "application/rdf+xml",
  xml: "application/rdf+xml",
}

const mimeTypes = {
  // RDF/XML
  "application/rdf+xml": "rdfxml",
  "text/rdf": "rdfxml",
  // NTriples
  "application/n-triples": "ntriples",
  "text/plain": "ntriples",
  // Turtle
  "text/turtle": "turtle",
  "application/turtle": "turtle",
  "application/x-turtle": "turtle",
  "text/n3": "turtle",
  "text/rdf+n3": "turtle",
  "application/rdf+n3": "turtle",
  // JSON-LD (default)
  "application/ld+json": "jsonld",
  "application/json": "jsonld",
  // HTML
  "text/html": "html",
  "application/xhtml+xml": "html",
}

function requestFormat(req) {
  for (let [type, format] of Object.entries(mimeTypes)) {
    if (req.accepts(type)) {
      return format
    }
  }
}

async function serializeRDF(item, type) {
  return `TODO: serialize ${item} as ${type}`
  // TODO: see https://github.com/gbv/bartoc.org/blob/dev/src/rdf.js#L37
}

async function queryBackend(uri) {
  // TODO: query backend instead
  // get `${backend}?uri=${uri}&properties=*

  if (uri == config.base + "null") {
    return
  }

  // TODO: optional languages parameter?
  return {prefLabel:{en:"test"}}
}

const start = async () => {
  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }
  app.listen(config.port, () => {
    console.log(`JSKOS proxy ${config.base} from ${config.backend} listening on port ${config.port}`)
  })
}

start()

export { app }
