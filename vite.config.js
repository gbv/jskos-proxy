import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "url"
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite"

export default defineConfig({
  plugins: [
    vue(),
    // See https://vue-i18n.intlify.dev/guide/advanced/optimization.html
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), "./locale.json"),
    }),
  ],
  build: {
    // Build source maps for non-production builds
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
  },
})
