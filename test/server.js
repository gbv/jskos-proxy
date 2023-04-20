import chai from "chai"
import chaiHttp from "chai-http"
chai.use(chaiHttp)
import assert from "node:assert"

process.env.BASE = "http://example.org/"
process.env.BACKEND = "./test/items.ndjson"
const { app } = await import("../server.js")

const exampleA = { uri: "http://example.org/a", prefLabel: { en: "a" } }

describe("JSKOS Proxy Server", () => {
  describe("GET /", () => {
    it("should return HTML at root", () =>
      chai.request(app)
        .get("/")
        .then((res) => {
          assert.equal(res.status,200)
        }),
    )
  })

  describe("Format selection", () => {
    it("complains for unknown formats",
      () => chai.request(app)
        .get("/id?format=foo")
        .then(res => assert.equal(res.status,400)))
    it("format=json",
      () => chai.request(app)
        .get("/a?format=json")
        .then(res => {
          assert.equal(res.status,200)
          assert.deepEqual(res.body, exampleA)
        }))
    it("format=nt",
      () => chai.request(app)
        .get("/a?format=nt")
        .then(res => {
          assert.equal(res.status,200)
          // WTF: res.text is undefined?
          //          console.log(res)
          //          assert.deepEqual(res.text, '<http://example.org/a> <http://www.w3.org/2004/02/skos/core#prefLabel> "a"@en .')
        }))

  })
})
