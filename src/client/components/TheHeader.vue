<script setup>
import { inject, ref, watch } from "vue"
import { useRouter } from "vue-router"

const config = inject("config")
const router = useRouter()

// TODO: Improve search (probably use API instead)
const search = ref("")
watch(search, (value) => {
  router.push(`${config.namespace.pathname}?search=${encodeURIComponent(value)}`)
})
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
    <input 
      v-model="search"
      type="text">
  </nav>
</template>
