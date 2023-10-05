import express from "express"
import "express-async-errors"
import ejs from "ejs"
import serveStatic from "serve-static"
import portfinder from "portfinder"
import cookieParser from "cookie-parser"
import { protocolless, uriPath, link } from "./lib/utils.js"
import { initBackend } from "./lib/backends.js"
import { serialize, contentTypes, requestFormat } from "./lib/rdf.js"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import config from "./lib/config.js"
import jskos from "jskos-tools"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (...p) => path.resolve(__dirname, ...p)
const isProduction = config.isProduction
const { log, info, namespace, configDir } = config

const app = express()
async function init() {

  // configure template engine to look up views in config directory first
  const views = [ resolve(configDir, "views"), "./views" ]
  const includer = (original) => {
    for (let view of views) {
      const filename = resolve(view, original + ".ejs")
      if (fs.existsSync(filename)) {
        return { filename }
      }
    }
  }
  app.set("views", views)
  app.engine("ejs", (path, data, cb) => ejs.renderFile(path, data, {includer}, cb))
  app.set("view engine", "ejs")


  app.use(cookieParser())

  // serve message on root if mounted at a specific root path
  if (namespace.pathname !== "/") {
    app.get("/", (req, res) => {
      res.render("root", config)
    })
  }

  let productionHeader
  if (isProduction) {
    app.use(namespace.pathname + "_vite/", serveStatic(resolve("dist"), { index: false }))
    productionHeader = fs.readFileSync(resolve("dist/index.html"), "utf-8").split("\n").map(line => line.trim()).filter(line => line.startsWith("<script type=\"module\"") || line.startsWith("<link rel=\"stylesheet\"")).map(line => line.replace("/", namespace.pathname + "_vite/")).join("\n")
  } else {
    // serve Vue application under subpath _vite
    const vite = await (await import("vite")).createServer({
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
  }

  // static assets
  const assets = resolve(configDir, "public")
  app.use(namespace.pathname + "_public/", serveStatic(assets))
  config.customStyle = fs.existsSync(resolve(assets, "style.css"))

  // load backend
  const backend = await initBackend(config)
  app.set("backend", backend)

  // preload scheme if listing is off
  const scheme = config.listing ? null : await backend.getItem(namespace)

  // serve HTML view or info information
  async function serve(req, res, vars) {
    vars.source = vars.item?._source
    const data = { ...config, ...vars, link }

    // Locale
    // Note that this has to be skipped during testing because it caused timeout issues
    let locale = req.cookies.locale
    if (!locale && config.env !== "test") {
      const accept = req.get("Accept-Language") || ""
      for (const lang of accept.split(",")) {
        if (lang.startsWith("de") || lang.startsWith("en")) {
          locale = lang.slice(0, 2)
          break
        }
      }
      locale = locale || "en"
      res.cookie("locale", locale, { sameSite: "lax", path: namespace.pathname })
    }
    data.locale = locale

    const itemLabel = jskos.prefLabel(data.item, { fallbackToUri: false, language: locale })
    data.fulltitle = itemLabel ? `${data.title} - ${itemLabel}` : data.title

    // replace inScheme with scheme if possible
    if (scheme && jskos.compare(scheme, data.item?.inScheme?.[0])) {
      data.item.inScheme[0] = scheme
    }

    if (req.query.format === "debug") {
      res.json(data)
    } else {
      if (isProduction) {
        app.render("index", data, async (error, template) => {
          // inject production header from production index.html file
          template = template.replace("<!--production-header-->", productionHeader)
          res.set({ "Content-Type": "text/html" }).end(template)
        })
      } else {
        res.render("index", data)
      }
    }
  }

  app.use(namespace.pathname + "about/", (req, res) => {
    serve(req, res, { static: "about" })
  })

  // serve JSKOS items
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
    if (format !== "html" && format !== "debug" && !contentTypes[format]) {
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
