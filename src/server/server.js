import express from "express"
import portfinder from "portfinder"
import ViteExpress from "vite-express"
import * as jskos from "jskos-tools"

import config from "../../config/config.js"
import * as rdf from "./rdf.js"
import { initBackend } from "./backend.js"

const app = express()
ViteExpress.config({ mode: config.isProduction ? "production" : "development" })

const backend = initBackend({ backend: config.backend, log: config.log, 
  requireConcepts: config.requireConcepts,
  requireConceptsOverrides: config.requireConceptsOverrides })

/**
 * Cleans a given item or array of items by:
 * - Adding a REGISTRY field if applicable
 * - Removing keys starting with "_"
 * - Converting specific properties to URI-only objects
 *
 * @param {Object|Object[]} data - Single item or array of items to clean
 * @returns {Object|Object[]} - Cleaned item(s)
 */
const cleanData = (data) => {
  const items = Array.isArray(data) ? data : [data]
  let cleanedData = []

  for (const _item of items) {
    const copiedItem = { ..._item }
    
    if (copiedItem._registry) {
      copiedItem.REGISTRY = {
        provider: copiedItem._registry.constructor.providerName,
        status: copiedItem._registry._api.status || `${copiedItem._registry._api.api}status`,
      }
    }

    // Remove keys started with _
    Object.keys(copiedItem).filter(key => key.startsWith("_")).forEach(key => delete copiedItem[key])

    // Replace certain subsets with URI only objects
    ;["ancestors", "broader", "narrower", "inScheme", "topConcepts", "concepts", "topConceptOf"].filter(prop => copiedItem[prop]?.length).forEach(prop => {
      copiedItem[prop] = copiedItem[prop].map(subItem => subItem?.uri ? ({ uri: subItem.uri }) : subItem)
    })

    cleanedData.push(copiedItem)

  }

  return cleanedData.length === 1 ? cleanedData[0] : cleanedData

}


const validateFormat = (req, res, next) => {
  const format = req.query.format || rdf.requestFormat(req) || "jsonld"
  if (!["html", "debug"].includes(format) && !rdf.contentTypes[format]) {
    return res.status(400).send(`Serialization format ${format} not supported!`)
  }
  req.format = format
  next()
}

const retrieveURI = (req) => {
  if (req.query.uri) {
    return req.query.uri
  }
  if (req.params.voc && jskos.isValidUri(req.params.voc)) {
    return req.params.voc
  }

  if (req.params.id) {
    return config.namespace + (req.params.voc ? `${req.params.voc}/` : "") + (encodeURIComponent(req.params.id))
  }

  return config.namespace + (req.params.voc ? `${req.params.voc}` : "")
}


const handleRequest = async (req, res, fetchFunction) => {
  const uri = retrieveURI(req)
  config.info(`Fetching: ${uri}`)

  try {
    const item = await fetchFunction(uri)
    if (!item) {
      return res.status(404).send({ message: `Entity with URI ${uri} not found.` })
    }
    const cleanedItem = cleanData(item)
    if (rdf.contentTypes[req.format] && rdf.contentTypes[req.format] !== "application/json") {
      res.set("Content-Type", rdf.contentTypes[req.format])
      res.send(await rdf.serialize(cleanedItem, rdf.contentTypes[req.format]))
    } else {
      res.json(cleanedItem)
    }
  } catch (error) {
    console.error(`Error loading ${uri}`, error)
    res.status(500).send({ message: `Error loading data from backend: ${error.message}` })
  }
}


app.get(`${config.namespace.pathname}`, validateFormat, async (req, res, next) => {
  if (req.format === "html") {
    next()
    return
  }  

  const allTheSchemes = await backend.getSchemes() || []
  const allTheSchemesCleaned = cleanData(allTheSchemes)

  res.status(200).send(allTheSchemesCleaned)
})


app.get(`${config.namespace.pathname}:voc`, validateFormat, async (req, res, next) => {
  if (req.format === "html") {
    // Refer HTML back to Vite
    next()
    return
  } 

  if (req.params.voc && req.query.uri) {
    // uri is a concept
    handleRequest(req, res, backend.getConcept.bind(backend))
  }  else if (req.params.voc || !config.listing) {
    // uri is a scheme
    handleRequest(req, res, backend.getScheme.bind(backend))
  } 

})


app.get(`${config.namespace.pathname}:voc/:id`, validateFormat, async (req, res, next) => {

  const norm = u => (u && !u.endsWith("/") ? `${u}/` : u)
  const ns   = new URL(config.namespace)               // e.g. http://uri.gbv.de/terminology/
  const wantBase = norm(new URL(req.params.voc + "/", ns).href) // requested scheme base
  const idPart   = encodeURIComponent(req.params.id)

  // Look up scheme; backend.getScheme already supports identifier fallback.
  let scheme
  try {
    scheme = await backend.getScheme(wantBase)
  } catch (e) {
    config.error(e)
  }

  const canonicalBase = norm(scheme?.uri || wantBase)  // fall back to requested if unknown
  const targetUri     = canonicalBase + idPart         // concept URI under canonical scheme

  if (req.format !== "html") {
    // API: serve the canonical concept transparently (no HTTP redirect)
    req.query.uri = targetUri
    return handleRequest(req, res, backend.getConcept.bind(backend))
  }

  // HTML: if the requested base is not canonical, 301 to the canonical path
  if (norm(wantBase) !== norm(canonicalBase)) {
    // Build canonical app path: /<nsPath>/<canonicalVoc>/<id>
    const nsPath = ns.pathname                         // e.g. "/terminology/"
    const canonPathname = new URL(canonicalBase).pathname
    const canonicalVoc  = canonPathname.slice(nsPath.length) // strip namespace prefix
    const canonicalPath = `${nsPath}${canonicalVoc}${idPart}`
    return res.redirect(301, canonicalPath)
  }

  // Already canonical → let the Vue app render it
  return next()
  
})

const startServer = async () => {
  if (config.env == "test") {
    portfinder.basePort = config.port
    config.port = await portfinder.getPortPromise()
  }

  return new Promise(resolve => {
    // TODO: Check if ViteExpress.listen is suitable for production
    ViteExpress.listen(app, config.port, () => {
      config.log(`JSKOS proxy ${config.namespace} from ${backend} at http://localhost:${config.port} in ${config.env} mode...`)
      resolve(app)
    })
  })

}

export const appStarted = startServer()
