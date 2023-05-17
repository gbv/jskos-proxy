import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  build: {
    // Build source maps for non-production builds
    sourcemap: process.env.NODE_ENV === "production" ? false : true,
  },
})
