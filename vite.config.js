import { fileURLToPath, URL } from "node:url"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

import config from "./config/config.js"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/client", import.meta.url)),
      "#": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  define: {
    __CONFIG__: config,
  },
})
