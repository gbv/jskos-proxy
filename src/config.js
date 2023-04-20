import * as dotenv from "dotenv"

const env = process.env.NODE_ENV || "development"

if (env !== "test") {
  dotenv.config()
}

const { TITLE, PORT, BASE, BACKEND } = process.env

export default {
  env,
  title: TITLE || "JSKOS Proxy",
  port: PORT || 3555,
  base: BASE || "http://example.org/",
  backend: BACKEND || "test/items.ndjson",
}
