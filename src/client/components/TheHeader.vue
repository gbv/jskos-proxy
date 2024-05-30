<script setup>
import { ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { utils } from "jskos-vue"
import { locale } from "@/store.js"

import { routerBasePath } from "@/utils.js"
const router = useRouter()
const route = useRoute()

// TODO: Improve search (probably use API instead)
const search = ref(null)
watch(search, utils.debounce((value) => {
  if (value != null) {
    router.push(`${routerBasePath}${value === "" ? "" : "?search="}${encodeURIComponent(value)}`)
  }
}, 150))

watch(() => route.query.search, (value) => {
  if (value !== search.value) {
    search.value = value
  }
}, { immediate: true })

import CustomHeader from "#/config/_current/Header.vue"
</script>

<template>
  <RouterLink 
    id="header_logo"
    style="flex: 1;"
    :to="routerBasePath">
    <img
      alt="Logo"
      src="@/assets/logo.svg">
  </RouterLink>

  <div id="header_menu">
    <RouterLink :to="`${routerBasePath}about`">
      {{ $t("about") }}
    </RouterLink> ·
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
  </div>
  <div id="header_search">
    <input 
      v-model="search"
      type="text">
  </div>
  <!-- TODO: How to position? (CSS) -->
  <CustomHeader />
</template>
