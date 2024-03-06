import chai from "chai"
import chaiHttp from "chai-http"
chai.use(chaiHttp)
import assert from "node:assert"

process.env.BASE = "http://example.org/"
process.env.BACKEND = "./test/items.ndjson"
const { app, startPromise } = await import("../server.js")
// Wait for server to start
await startPromise

const exampleA = { uri: "http://example.org/a", prefLabel: { en: "a" } }
const exampleC = { uri: "http://example.com/c", prefLabel: { en: "c" } }

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

  describe("GET /?format=debug", () => {
    it("debug ejs options", () =>
      chai.request(app)
        .get("/?format=debug")
        .then(res => {
          assert.equal(res.body.namespace, "http://example.org/")
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
  })

  describe("Get item via URI", () => {
    it("support ?uri= parameter (also external URI)",
      () => chai.request(app)
        .get("/?uri=http://example.com/c&format=json")
        .then(res => {
          assert.equal(res.status,200)
          assert.deepEqual(res.body, exampleC)
        }))
    it("404 when item not found",
      () => chai.request(app)
        .get("/?uri=http://example.com/null&format=json")
        .then(res => {
          assert.equal(res.status,404)
        }))
    it("complains on invalid query URI",
      () => chai.request(app)
        .get("/?uri=xy")
        .then(res => {
          assert.equal(res.status,400)
        }))
    it("redirects ?uri= for local URI",
      () => chai.request(app)
        .get("/?uri=http://example.org/a")
        .redirects(0)
        .then(res => {
          assert.equal(res.status,301)
          assert.equal(res.headers.location, "/a")
        }))
  })
})
