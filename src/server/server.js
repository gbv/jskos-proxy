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

    const uri = (() => {
      if (req.query.uri) {
        return req.query.uri
      }
      // URI in "voc" param (part of URL)
      if (req.params.voc && jskos.isValidUri(req.params.voc)) {
        return req.params.voc
      }
      return config.namespace + (req.params.voc ? `${req.params.voc}/` : "") + (req.params.id ?? "")
    })()

    config.info(`get ${uri}`)

    let item
    if (req.params.id || (req.params.voc && req.query.uri)) {
      // uri is a concept
      item = await backend.getConcept(uri)
    } else if (req.params.voc || req.query.uri || !config.listing) {
      // uri is a scheme
      item = await backend.getScheme(uri)
    } else {
      // uri is the base -> return all schemes
      item = await backend.getSchemes()
    }

    // TODO: Handle this better
    res.status(item ? 200 : 404)

    // Clean data
    for (const _item of Array.isArray(item) ? item : [item]) {
      // Remove keys started with _
      Object.keys(_item).filter(key => key.startsWith("_")).forEach(key => delete _item[key])
      // Replace certain subsets with URI only objects
      ;["ancestors", "broader", "narrower", "inScheme", "topConcepts", "concepts", "topConceptOf"].filter(prop => _item[prop]?.length).forEach(prop => {
        _item[prop] = _item[prop].map(subItem => subItem?.uri ? ({ uri: subItem.uri }) : subItem)
      })
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
