<script setup>
import { useRoute } from "vue-router"
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { schemes, quickSelection, publisherSelection, typeSelection } from "@/store.js"
import { computed } from "vue"

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
      return schemes.value.filter(s => JSON.stringify(s).toLowerCase().includes(route.query.search))
    default:
      return schemes.value
  }
})

</script>

<template>
  {{ mode }}
  <template v-if="schemes">
    <!-- Default view: show quick view, publisher selection, type selectio -->
    <div
      v-if="mode === 'default'">
      <div 
        v-if="quickSelection.length"
        class="section">
        <h2>Schnellzugriff</h2>
        <div class="schemeSelection">
          <RouterLink
            v-for="scheme in quickSelection"
            :key="scheme.uri"
            :to="`${config.namespace.pathname}${scheme.uri.replace(config.namespace, '')}`">
            {{ jskos.prefLabel(scheme) }}
          </RouterLink>
        </div>
      </div>
      <div
        v-if="publisherSelection.length"
        class="section">
        <h2>Herausgeber</h2>
        <div class="categorySelection">
          <RouterLink
            v-for="publisher in publisherSelection"
            :key="publisher"
            :to="`?publisher=${encodeURIComponent(publisher)}`">
            {{ publisher }}
          </RouterLink>
        </div>
      </div>
      <div
        v-if="typeSelection.length"
        class="section">
        <h2>Vokabulartyp</h2>
        <div class="categorySelection">
          <RouterLink
            v-for="t in typeSelection"
            :key="t"
            :to="`?type=${encodeURIComponent(t.uri)}`">
            {{ jskos.prefLabel(t) }}
          </RouterLink>
        </div>
      </div>
    </div>
    <!-- Publisher view: show schemes for particular publisher -->
    <div v-if="mode === 'publisher'">
      TODO - Publisher view: {{ route.query.publisher }}
    </div>
    <!-- Type view: show schemes for particular type -->
    <div v-if="mode === 'type'">
      TODO - Type view: {{ route.query.type }}
    </div>
    <!-- Search view: show scheme search results -->
    <div v-if="mode === 'search'">
      TODO - Search view: {{ route.query.search }}
    </div>
    <!-- Concept search view: show concept search results -->
    <div v-if="mode === 'searchConcept'">
      TODO - Concept search view: {{ route.query.searchConcept }}
    </div>
    <div 
      v-if="mode === 'publisher' || mode === 'type' || mode === 'search'"
      class="categorySelection">
      <RouterLink
        v-for="scheme in filteredSchemes"
        :key="scheme.uri"
        :to="`${config.namespace.pathname}${scheme.uri.replace(config.namespace, '')}`">
        {{ jskos.prefLabel(scheme) }}
      </RouterLink>
    </div>
  </template>
  <div v-else>
    <LoadingIndicator />
  </div>
</template>

<style scoped>
.section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px;
}
.section > h2 {
  text-align: center;
}
.schemeSelection, .categorySelection {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.schemeSelection > a, .categorySelection > a {
  padding: 10px;
}
</style>
