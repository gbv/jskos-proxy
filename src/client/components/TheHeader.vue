<script setup>
import { inject, ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { utils } from "jskos-vue"
import { locale } from "@/store.js"

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
      <template
        v-for="(locale_, index) in $i18n.availableLocales"
        :key="locale_">
        <template v-if="index > 0">
          |
        </template>
        <a
          href=""
          :style="{
            fontWeight: locale === locale_ ? 'bold' : 'normal',
          }"
          @click.stop.prevent="locale = locale_">{{ locale_.toUpperCase() }}</a>
      </template>
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
