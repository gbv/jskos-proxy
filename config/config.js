import * as dotenv from "dotenv"
import path from "node:path"
import fs from "node:fs/promises"

async function exists(file) {
  try {
    await fs.access(file, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

const log = msg => console.log(msg)

const NODE_ENV = process.env.NODE_ENV || "development"

// use default configuration when testing
if (NODE_ENV !== "test") {
  dotenv.config()
}

const configDir = process.env.CONFIG || ""
const configFile = path.resolve(`config/${configDir}`, "config.env")
if (await exists(configFile)) {
  dotenv.populate(process.env, dotenv.parse(await fs.readFile(configFile, "utf8")))
  log(`Read configuration from ${configFile}`)
  // Create "_current" symlink (needed for front-end import of custom styles)
  try {
    await fs.rm("config/_current")
  } catch (error) {
    // ignore
  }
  await fs.symlink(configDir, "config/_current")
} else {
  console.error(`Configuration "${configDir}" not found. Please make sure to define an existing configuration in "CONFIG".`)
  process.exit(1)
}

// Symlink favicon
const faviconFile = await exists("config/_current/favicon.ico") ? "../config/_current/favicon.ico" : "favicon-default.ico"
await fs.rm("public/favicon.ico")
await fs.symlink(faviconFile, "public/favicon.ico")

import { readFile } from "node:fs/promises"
const fileUrl = new URL("../package.json", import.meta.url)
const pkg = JSON.parse(await readFile(fileUrl, "utf8"))

const { name, version, homepage } = pkg
const { env } = process

const config = {
  env: NODE_ENV,
  configDir,
  isProduction: NODE_ENV === "production",
  base: env.BASE || "/",
  namespace: new URL(env.NAMESPACE || "http://example.org/"),
  port: env.PORT || 3555,
  backend: env.BACKEND || "test/items.ndjson",
  title: env.TITLE || "JSKOS Proxy",
  logo: env.LOGO,
  name,
  version,
  homepage,
  listing: !(env.LISTING||"").match(/^0|false$/),
  quickSelection: (env.QUICK_SELECTION ?? "").split(",").filter(Boolean).map(uri => ({ uri })),
  // methods
  log,
  info: (NODE_ENV === "development" ? log : () => {}),
}

export default config
