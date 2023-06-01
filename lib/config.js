import * as dotenv from "dotenv"
import path from "node:path"
import fs from "node:fs"

const log = msg => console.log(msg)

const NODE_ENV = process.env.NODE_ENV || "development"

// use default configuration when testing
if (NODE_ENV !== "test") {
  dotenv.config()
}

const configDir = process.env.CONFIG || "config"
const configFile = path.resolve(configDir, "config.env")
if (fs.existsSync(configFile)) {
  dotenv.populate(process.env, dotenv.parse(fs.readFileSync(configFile)))
  log(`Read configuration from ${configFile}`)
}

// eslint does not like: import pkg from "../package.json" assert { type: "json" }
import { readFile } from "node:fs/promises"
const fileUrl = new URL("../package.json", import.meta.url)
const pkg = JSON.parse(await readFile(fileUrl, "utf8"))

const { name, version, homepage } = pkg
const { env } = process

const config = {
  env: NODE_ENV,
  configDir,
  isProduction: NODE_ENV === "production",
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
if (!config.isProduction) {
  config.hmrPort = env.HMR_PORT || 3556
}

export default config
