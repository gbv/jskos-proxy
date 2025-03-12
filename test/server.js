import chai from "./chai.js"
import assert from "node:assert"

const { appStarted } = await import("../src/server/server.js")
const app = await appStarted


describe("server", () => {
  it("/ should return HTML",
    () => chai.request.execute(app).get("/")
      .then(res => {
        assert.equal(res.status,200)
      }))
})
  
