import * as dotenv from "dotenv"

const NODE_ENV = process.env.NODE_ENV || "development"

if (NODE_ENV !== "test") {
  dotenv.config()
}

const { env } = process
const log = msg => console.log(msg)

const config = {
  env: NODE_ENV,
  title: env.TITLE || "JSKOS Proxy",
  port: env.PORT || 3555,
  host: env.HOST || "example.org",
  root: env.ROOT || "/",

  baseLabel: env.BASE_LABEL,
  homeUrl: env.HOME_URL,
  homeLabel: env.HOME_LABEL,
  backend: env.BACKEND || "test/items.ndjson",

  log,
  debug: (NODE_ENV === "development" ? log : () => {}),
}

config.base = `//${config.host}${config.root}`

export default config
