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
    )})

  describe("GET /?format=debug", () => {
    it("debug ejs options", () =>
      chai.request(app)
        .get("/?format=debug")
        .then(res => {
          assert.equal(res.body.config.base, "http://example.org/")
        }),
    )})

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

  })
})
