import express from "express"
import portfinder from "portfinder"
import cookieParser from "cookie-parser"
import { protocolless, uriPath, link } from "./lib/utils.js"
import { initBackend } from "./lib/backends.js"
import { serialize, contentTypes } from "./lib/rdf.js"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import config from "./lib/config.js"
import jskos from "jskos-tools"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (p) => path.resolve(__dirname, p)
const isProduction = config.isProduction
const { log, info, namespace } = config

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

const app = express()
async function init() {

  app.set("views", "./views")
  app.set("view engine", "ejs")


  app.use(cookieParser())

  // serve message on root if mounted at a specific root path
  if (namespace.pathname !== "/") {
    app.get("/", (req, res) => {
      res.render("root", config)
    })
  }

  // serve Vue application under subpath _vite
  let vite
  if (!isProduction) {
    vite = await (await import("vite")).createServer({
      base: namespace.pathname + "_vite/",
      server: {
        middlewareMode: true,
        hmr: {
          port: config.hmrPort,
        },
      },
      appType: "custom",
    })
    app.use(namespace.pathname + "_vite/", vite.middlewares)
  } else {
    // Serve static files from dist
    app.use(namespace.pathname + "_vite/", (await import("serve-static")).default(resolve("dist"), {
      index: false,
    }))
  }

  let productionHeader = isProduction ? fs.readFileSync(resolve("dist/index.html"), "utf-8").split("\n").map(line => line.trim()).filter(line => line.startsWith("<script type=\"module\"") || line.startsWith("<link rel=\"stylesheet\"")).map(line => line.replace("/", namespace.pathname + "_vite/")).join("\n") : null

  // Load backend
  const backend = await initBackend(config)
  app.set("backend", backend)

  // Preload scheme if listing is off
  const scheme = config.listing ? null : await backend.getItem(namespace)

  // serve HTML view or info information
  async function serve(req, res, vars) {
    vars.source = vars.item?._source
    const options = { ...config, ...vars, link }

    // Locale
    // Note that this has to be skipped during testing because it caused timeout issues
    let locale = req.cookies.locale
    if (!locale && config.env !== "test") {
      for (const lang of req.get("Accept-Language").split(",")) {
        if (lang.startsWith("de") || lang.startsWith("en")) {
          locale = lang.slice(0, 2)
          break
        }
      }
      locale = locale || "en"
      res.cookie("locale", locale, { sameSite: "lax", path: namespace.pathname })
    }
    options.locale = locale

    const itemLabel = jskos.prefLabel(options.item, { fallbackToUri: false, language: locale })
    if (itemLabel) {
      options.title = `${options.title} - ${itemLabel}`
    }

    // Replace inScheme with scheme if possible
    if (scheme && jskos.compare(scheme, options.item?.inScheme?.[0])) {
      options.item.inScheme[0] = scheme
    }

    if (req.query.format === "debug") {
      res.json(options)
    } else {
      if (!isProduction) {
        res.render("index", options)
      } else {
        app.render("index", options, async (error, template) => {
          // Inject production header from production index.html file
          template = template.replace("<!--production-header-->", productionHeader)
          res.set({ "Content-Type": "text/html" }).end(template)
        })
      }
    }
  }

  // serve JSKOS data
  app.set("json spaces", 2)
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
      uri = new URL(req.url.substring(1), namespace) // namespace.href?
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

    let item
    if (jskos.compare({ uri: `${uri}` }, scheme)) {
      item = scheme
    } else {
      // TODO catch error and send 5xx error in case
      item = await backend.getItem(`${uri}`)
    }

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

}


// start the proxy server
const start = async () => {
  await init()

  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }

  return new Promise(resolve => {
    app.listen(config.port, () => {
      log(`JSKOS proxy ${namespace} from ${app.backend} at http://localhost:${config.port}/`)
      resolve(app)
    })
  })
}

// When `app` is used outside (e.g. in tests), we need to wait for `startPromise`
const startPromise = start()
export { app, startPromise }
