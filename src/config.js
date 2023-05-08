import * as dotenv from "dotenv"

const NODE_ENV = process.env.NODE_ENV || "development"

if (NODE_ENV !== "test") {
  dotenv.config()
}

// eslint does not like: import pkg from "../package.json" assert { type: "json" }
import { readFile } from "node:fs/promises"
const fileUrl = new URL("../package.json", import.meta.url)
const pkg = JSON.parse(await readFile(fileUrl, "utf8"))

const { name, version, homepage } = pkg

const { env } = process
const log = msg => console.log(msg)

const config = {
  env: NODE_ENV,
  name, version, homepage,
  port: env.PORT || 3555,
  host: env.HOST || "example.org",
  root: env.ROOT || "/",
  backend: env.BACKEND || "test/items.ndjson",
  title: env.TITLE || "JSKOS Proxy",
  hostLabel: env.HOST_LABEL,
  rootLabel: env.ROOT_LABEL,

  log,
  info: (NODE_ENV === "development" ? log : () => {}),
}

config.base = `//${config.host}${config.root}`

export default config
