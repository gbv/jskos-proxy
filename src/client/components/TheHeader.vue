<script setup>
import { inject, ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"

const config = inject("config")
const router = useRouter()
const route = useRoute()

// TODO: Improve search (probably use API instead)
const search = ref("")
watch(search, (value) => {
  router.push(`${config.namespace.pathname}${value === "" ? "" : "?search="}${encodeURIComponent(value)}`)
})
watch(() => route.query.search, (value) => {
  if (value !== search.value) {
    search.value = value || ""
  }
}, { immediate: true })
</script>

<template>
  <nav>
    <RouterLink 
      style="flex: 1;"
      :to="`${config.namespace.pathname}`">
      <img
        alt="Logo"
        class="logo"
        src="@/assets/logo.svg">
    </RouterLink>

    <div style="text-align: right;">
      <a
        href=""
        @click.stop.prevent="">DE</a> |
      <a
        href=""
        @click.stop.prevent="">EN</a>
      <br><br>
      <RouterLink :to="`${config.namespace.pathname}about`">
        About
      </RouterLink>
      <br>
      <input 
        v-model="search"
        type="text">
    </div>
  </nav>
</template>
