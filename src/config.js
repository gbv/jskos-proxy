import * as dotenv from "dotenv"

const NODE_ENV = process.env.NODE_ENV || "development"

if (NODE_ENV !== "test") {
  dotenv.config()
}

const { env } = process

export default {
  env: NODE_ENV,
  title: env.TITLE || "JSKOS Proxy",
  port: env.PORT || 3555,
  base: env.BASE || "http://example.org/",
  baseLabel: env.BASE_LABEL,
  homeUrl: env.HOME_URL,
  homeLabel: env.HOME_LABEL,
  backend: env.BACKEND || "test/items.ndjson",
}
