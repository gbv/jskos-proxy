import express from "express"
import ViteExpress from "vite-express"
import * as jskos from "jskos-tools"

import config from "../../config/config.js"
import * as rdf from "./rdf.js"
import { initBackend } from "./backend.js"

const app = express()
ViteExpress.config({ mode: config.isProduction ? "production" : "development" })

const backend = initBackend({ backend: config.backend, log: config.log })

app.get(`${config.namespace.pathname}:voc?/:id?`, async (req, res, next) => {
  const format = req.query.format || rdf.requestFormat(req) || "jsonld"
  // Error if format is unsupported
  if (format !== "html" && format !== "debug" && !rdf.contentTypes[format]) {
    res.status(400)
    res.send(`Serialization format ${format} not supported!`)
    return
  }
  if (format === "html") {
    // Refer HTML back to Vite
    next()
  } else {
    // Return serialized entity

    // Determine URI from namespace + params
    if (!config.listing && req.params.voc && !req.params.id) {
      req.params.id = req.params.voc
      delete req.params.voc
    }
    // TODO: Do we need support for `uri` query param?
    const uri = config.namespace + (req.params.voc ? `${req.params.voc}/` : "") + (req.params.id ?? "")

    config.info(`get ${uri}`)

    let item
    if (req.params.id) {
      // uri is a concept
      item = await backend.getConcept(uri)
    } else if (req.params.voc || !config.listing) {
      // uri is a scheme
      item = await backend.getScheme(uri)
    } else {
      // uri is the base -> return all schemes
      item = await backend.getSchemes()
    }

    // TODO: Handle this better
    res.status(item ? 200 : 404)

    if (Array.isArray(item)) {
      item = item.map(i => jskos.copyDeep(i))
    } else {
      item = jskos.copyDeep(item)
    }

    const contentType = rdf.contentTypes[format]
    if (contentType && contentType !== "application/json") {
      res.set("Content-Type", contentType)
      res.send(await rdf.serialize(item, contentType))
    } else {
      res.json(item)
    }

  }
})

ViteExpress.listen(app, config.port, () => {
  config.log(`JSKOS proxy ${config.namespace} from ${backend} at http://localhost:${config.port} in ${config.env} mode...`)
})
