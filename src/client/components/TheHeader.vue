<script setup>
import { inject } from "vue"
const config = inject("config")
</script>

<template>
  <img
    alt="Logo"
    class="logo"
    src="@/assets/logo.svg">

  <nav>
    <RouterLink :to="`${config.namespace.pathname}`">
      Home
    </RouterLink>-
    <RouterLink :to="`${config.namespace.pathname}about`">
      About
    </RouterLink>-
    <RouterLink :to="`${config.namespace.pathname}bk`">
      BK
    </RouterLink>-
    <RouterLink :to="`${config.namespace.pathname}bk/17.03`">
      BK 17.03
    </RouterLink>
  </nav>
</template>
