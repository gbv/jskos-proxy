import * as dotenv from "dotenv"

const NODE_ENV = process.env.NODE_ENV || "development"

// use default configuration when testing
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
  namespace: new URL(env.NAMESPACE || "http://example.org/"),
  port: env.PORT || 3555,
  backend: env.BACKEND || "test/items.ndjson",
  title: env.TITLE || "JSKOS Proxy",
  name,
  version,
  homepage,
  listing: !(env.LISTING||"").match(/^0|false$/),

  // methods
  log,
  info: (NODE_ENV === "development" ? log : () => {}),
}

export default config
