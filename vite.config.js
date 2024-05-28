import { fileURLToPath, URL } from "node:url"
import { resolve, dirname } from "node:path"

import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite"

import config from "./config/config.js"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // See https://vue-i18n.intlify.dev/guide/advanced/optimization.html
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), "./locale.json"),
    }),
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
  base: config.base,
})
