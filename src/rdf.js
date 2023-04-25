import fs from "fs"
import jsonld from "jsonld"
import $rdf from "rdflib"
import { promisify } from "util"

const parseRDF = promisify($rdf.parse)

export const namespaces = {
  dct: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  nkostype: "http://w3id.org/nkos/nkostype#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  viaf: "http://viaf.org/viaf/",
  void: "http://rdfs.org/ns/void#",
  xskos: "http://rdf-vocabulary.ddialliance.org/xkos#",
}

export const context = JSON.parse(await fs.promises.readFile(new URL("./context.json", import.meta.url)))

export async function serialize(item, format) {
  item = { ...item, "@context": context }

  if (format === "application/n-triples") {
    return jsonld.toRDF(item, { format: "application/n-quads" })
  }

  const store = $rdf.graph()
  const doc = $rdf.sym(item.uri)

  await parseRDF(JSON.stringify(item), store, doc.uri, "application/ld+json")
  const rdf = $rdf.serialize(null, store, null, format, null, { namespaces })

  return rdf
}
