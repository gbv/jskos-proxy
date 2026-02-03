import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "url"

const config = {
  namespace: "http://example.org/",
  base: "/",
  backend: "http://example.org/api",
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/client", import.meta.url)),
      "#": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  define: {
    __CONFIG__: JSON.stringify(config),
  },
  test: {
    environment: "happy-dom",
    globals: true,
  },
})
