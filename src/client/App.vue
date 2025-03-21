<script setup>
import { RouterView } from "vue-router"
import config from "@/config.js"


// Logo function to fetch the logo source
const getLogoPath = (conf) => {
  let logoPath = "@/assets/vzg-logo.svg"
  if (conf.logo) {
    logoPath = `/config/_current/${conf.logo}`
  }
  return logoPath
}

// Compute logoPath
const logoPath = getLogoPath(config)

</script>

<template>
  <header>
    <TheHeader :logo-path="logoPath" />
  </header>

  <RouterView />

  <footer>
    <TheFooter :logo-path="logoPath" />
  </footer>
</template>

<style scoped>
</style>
