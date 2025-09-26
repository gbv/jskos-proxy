import chai from "./chai.js"
import assert from "node:assert"

const { appStarted } = await import("../src/server/server.js")
const app = await appStarted

import * as rdf from "../src/server/rdf.js"


describe("server", () => {
  it("/ should return HTML",
    () => chai.request.execute(app).get("/")
      .then(res => {
        assert.equal(res.status, 200)
      }))
  it("/terminology/ulbb/?format=NO_FORMAT should return a 400 Bad request with message",
    () => chai.request.execute(app).get("/terminology/ulbb/?format=NO_FORMAT")
      .then(res => {
        assert.equal(res.status, 400) // Ensure success response
        assert.equal(res.type, "text/html") // Check Content-Type
        assert.equal(res.text, "Serialization format NO_FORMAT not supported!")
      }))
  
  // Testing linked data formats 
  // Vocabulary with slash at the end, isil as value
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
    it(`/terminology/isil/?format=${format} should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/isil/?format=${format}`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  }
  
  // Testing linked data formats 
  // Vocabulary without slash at the end, fbl as value
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
    it(`/terminology/fbl?format=${format} should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/fbl?format=${format}`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  }

  // Testing linked data formats 
  // Vocabulary isil whic child DE-131 Stadtbibliothek am Neumarkt
  // In this case, it is attached as Uri to the requests, uri paramter
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
    it(`/terminology/isil/?format=${format} and uri parameter should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/isil/?format=${format}&uri=https%3A%2F%2Fld.zdb-services.de%2Fresource%2Forganisations%2FDE-131`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  }

  // Testing linked data formats 
  // Vocabulary ulbb with id ROM C 41-80 Grammatik
  // In this case id value is not encoded
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
    it(`/terminology/ulbb/ROM C 41-80/?format=${format} and uri parameter should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/ulbb/ROM C 41-80/?format=${format}`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  }

  const CANONICAL = "http://uri.gbv.de/terminology/prizepapers_lading_type/"
  const ALIAS     = "http://uri.gbv.de/terminology/prizepapers_lading/"

  it("resolves an aliased/deprecated scheme URI via `identifier` to the canonical scheme", async () => {
    const res = await chai.request.execute(app).get("/terminology/prizepapers_lading/?format=jsonld")
    assert.equal(res.status, 200)
    assert.equal(res.type, "application/json")
    // Should return the canonical record
    assert.equal(res.body.uri, CANONICAL)
    // And keep the alias in `identifier`
    assert.ok(Array.isArray(res.body.identifier))
    assert.ok(res.body.identifier.includes(ALIAS.replace(/\/$/, ""))) // backends may omit slash
  })

})