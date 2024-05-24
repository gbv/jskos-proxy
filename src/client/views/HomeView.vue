<script setup>
import { useRoute } from "vue-router"
import * as jskos from "jskos-tools"
import { schemes, quickSelection, publisherSelection, typeSelection } from "@/store.js"
import { computed, watch } from "vue"
import { getRouterUrl } from "@/utils.js"

const route = useRoute()

const mode = computed(() => {
  if (route.query?.publisher) {
    return "publisher"
  }
  if (route.query?.type) {
    return "type"
  }
  if (route.query?.search) {
    return "search"
  }
  if (route.query?.conceptSearch) {
    return "conceptSearch"
  }
  return "default"
})

const filteredSchemes = computed(() => {
  if (!schemes.value) {
    return []
  }
  switch (mode.value) {
    case "publisher":
      return schemes.value.filter(s => s.publisher?.find(p => p.uri === route.query.publisher || jskos.prefLabel(p) === route.query.publisher))
    case "type":
      return schemes.value.filter(s => s.type?.includes(route.query.type))
    case "search":
      // TODO: Improve search (probably use API instead)
      return schemes.value.filter(s => JSON.stringify(Object.entries(s).filter(([key]) => ["uri", "notation", "prefLabel", "definition"].includes(key)).map(([, value]) => value)).toLowerCase().includes(route.query.search))
    default:
      return quickSelection.value
  }
})

watch(mode, () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  }) || window.scrollTo(0, 0)
}, { immediate: true })

</script>

<template>
  <template v-if="schemes">
    <!-- Default section -->
    <div class="section">
      <h2 v-if="mode === 'default'">
        Schnellzugriff
      </h2>
      <h2 v-else-if="mode === 'publisher'">
        Publisher: {{ route.query.publisher }}
      </h2>
      <h2 v-else-if="mode === 'type'">
        Vocabulartyp: {{ route.query.type }}
      </h2>
      <h2 v-else-if="mode === 'search'">
        Searching for "{{ route.query.search }}"
      </h2>
      <h2 v-else-if="mode === 'conceptSearch'">
        Concept Search: TODO
      </h2>
      <div 
        v-if="mode !== 'conceptSearch'"
        class="selection">
        <RouterLink
          v-for="scheme in filteredSchemes"
          :key="scheme.uri"
          class="scheme-selection"
          :to="getRouterUrl({ scheme })">
          {{ jskos.prefLabel(scheme) }}
        </RouterLink>
      </div>
    </div>
    <!-- Publisher selection section -->
    <div
      v-if="mode === 'default' && publisherSelection.length"
      class="section">
      <h2>Herausgeber</h2>
      <div class="selection">
        <RouterLink
          v-for="publisher in publisherSelection"
          :key="publisher"
          class="category-selection"
          :to="`?publisher=${encodeURIComponent(publisher)}`">
          {{ publisher }}
        </RouterLink>
      </div>
    </div>
    <!-- Type selection section -->
    <div
      v-if="mode === 'default' && typeSelection.length"
      class="section">
      <h2>Vokabulartyp</h2>
      <div class="selection">
        <RouterLink
          v-for="t in typeSelection"
          :key="t"
          class="category-selection"
          :to="`?type=${encodeURIComponent(t.uri)}`">
          {{ jskos.prefLabel(t) }}
        </RouterLink>
      </div>
    </div>
  </template>
  <div v-else>
    <LoadingIndicator />
  </div>
</template>

<style scoped>
</style>
