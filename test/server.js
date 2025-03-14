import chai from "./chai.js"
import assert from "node:assert"

const { appStarted } = await import("../src/server/server.js")
const app = await appStarted

// import * as rdf from "../src/server/rdf.js"


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
  
  /* // Vocabulary with slash at the end, isil as value
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
  
    it(`/terminology/isil/?format=${format} should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/isil/?format=${format}`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  }
  // Vocabulary without slash at the end, isil as value
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
  
    it(`/terminology/isil?format=${format} should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/isil?format=${format}`)
        .then(res => {
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  } */

  /* // Vocabulary with slash at the end, fbl as value
  for (const format in rdf.contentTypes){
    const value = rdf.contentTypes[format]
  
    it(`/terminology/fbl?format=${format} should return ${value}` , 
      () => chai.request.execute(app).get(`/terminology/fbl?format=${format}`)
        .then(res => {
          console.log(res.status)  // Debugging response status
          console.log(res.text)    // Check the response text
          assert.equal(res.status, 200) // Ensure success response
          assert.equal(res.type, `${value}`) // Check Content-Type
        }))
  } */

  it("/terminology/fbl?format=jskos should return application/json", async () => {
    const res = await chai.request.execute(app).get("/terminology/fbl?format=jskos")
        
    console.log("res.status ->", res.status)  // Debugging response status
    console.log("res.text ->", res.text)      // Check the response text
        
    assert.equal(res.status, 200)  // Ensure success response
    assert.equal(res.type, "application/json")  // Check Content-Type
  })

})