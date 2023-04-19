/* eslint-env node, mocha */

import chai from "chai"
//import chaiAsPromised from "chai-as-promised"
//chai.use(chaiAsPromised)
import chaiHttp from "chai-http"
chai.use(chaiHttp)
import { app } from "../server.js"
import assert from "node:assert"

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
    it("complain for unknown formats",
      () => chai.request(app)
        .get("/id?format=foo")
        .then(res => assert.equal(res.status,400)),
    )})
})
