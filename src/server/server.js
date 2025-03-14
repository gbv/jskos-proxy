import express from "express"
import portfinder from "portfinder"
import ViteExpress from "vite-express"
import * as jskos from "jskos-tools"

import config from "../../config/config.js"
import * as rdf from "./rdf.js"
import { initBackend } from "./backend.js"

const app = express()
ViteExpress.config({ mode: config.isProduction ? "production" : "development" })

const backend = initBackend({ backend: config.backend, log: config.log })

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

  // Return serialized entity when is it the endpoint with ?format parameter and possibily uri paramter
  const uri = retrieveURI(req)

  config.info(`getting the following ${uri}`)

  let item
  try {
    if (req.params.voc && req.query.uri) {
      // uri is a concept
      item = await backend.getConcept(uri)
    }  else if (req.params.voc || !config.listing) {
      // uri is a scheme
      item = await backend.getScheme(uri)
    } 

  } catch (error) {
    console.error(`Error loading ${uri}`, error)
    // TODO: Send different error messages depending on specific error (https://github.com/gbv/jskos-proxy/issues/40)
    res.status(500).send({
      message: `Error loading data from backend: ${error.message}`,
    })
    return
  }

  if (!item) {
    console.error(`${uri} not found.`)
    res.status(404).send({
      message: `Entity with URI ${uri} not found.`,
    })
    return
  }

  res.status(200)


  const cleanItem= cleanData(item)


  const contentType = rdf.contentTypes[req.format]
  if (contentType && contentType !== "application/json") {
    res.set("Content-Type", contentType)
    res.send(await rdf.serialize(cleanItem, contentType))
  } else {
    res.json(cleanItem)
  }

})


app.get(`${config.namespace.pathname}:voc/:id`, validateFormat, async (req, res, next) => {
  if (req.format === "html") {
    // Refer HTML back to Vite
    next()
    return
  } 

  // Return serialized entity when is it the endpoint with ?format parameter and possibily uri paramter
  const uri = retrieveURI(req)

  config.info(`getting the following ${uri}`)

  let item
  try {
    item = await backend.getConcept(uri)

  } catch (error) {
    console.error(`Error loading ${uri}`, error)
    // TODO: Send different error messages depending on specific error (https://github.com/gbv/jskos-proxy/issues/40)
    res.status(500).send({
      message: `Error loading data from backend: ${error.message}`,
    })
    return
  }

  if (!item) {
    console.error(`${uri} not found.`)
    res.status(404).send({
      message: `Entity with URI ${uri} not found.`,
    })
    return
  }

  res.status(200)


  const cleanItem= cleanData(item)


  const contentType = rdf.contentTypes[req.format]
  if (contentType && contentType !== "application/json") {
    res.set("Content-Type", contentType)
    res.send(await rdf.serialize(cleanItem, contentType))
  } else {
    res.json(cleanItem)
  }

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
