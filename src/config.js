import * as dotenv from "dotenv"

const NODE_ENV = process.env.NODE_ENV || "development"

if (NODE_ENV !== "test") {
  dotenv.config()
}

const { env } = process
const log = msg => console.log(msg)

const config = {
  env: NODE_ENV,
  port: env.PORT || 3555,
  host: env.HOST || "example.org",
  root: env.ROOT || "/",
  backend: env.BACKEND || "test/items.ndjson",
  index: env.INDEX,
  title: env.TITLE || "JSKOS Proxy",
  hostLabel: env.HOST_LABEL,
  rootLabel: env.ROOT_LABEL,

  log,
  info: (NODE_ENV === "development" ? log : () => {}),
}

config.base = `//${config.host}${config.root}`

export default config
