<script setup>
import { RouterView } from "vue-router"
</script>

<template>
  <header>
    <TheHeader />
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <TheFooter />
  </footer>
</template>

<style scoped>
</style>
