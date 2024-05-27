<script setup>
import { inject, ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { utils } from "jskos-vue"
import { state, setLocale } from "@/store.js"

const config = inject("config")
const router = useRouter()
const route = useRoute()

// TODO: Improve search (probably use API instead)
const search = ref(null)
watch(search, utils.debounce((value) => {
  if (value != null) {
    router.push(`${config.namespace.pathname}${value === "" ? "" : "?search="}${encodeURIComponent(value)}`)
  }
}, 150))

watch(() => route.query.search, (value) => {
  if (value !== search.value) {
    search.value = value
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
        :style="{
          fontWeight: state.locale === 'de' ? 'bold' : 'normal',
        }"
        @click.stop.prevent="setLocale('de')">DE</a> |
      <a
        href=""
        :style="{
          fontWeight: state.locale === 'en' ? 'bold' : 'normal',
        }"
        @click.stop.prevent="setLocale('en')">EN</a>
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
