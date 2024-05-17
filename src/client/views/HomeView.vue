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
        <div class="quickSelection">
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
        <div class="publisherSelection">
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
        <div class="typeSelection">
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
.quickSelection, .publisherSelection, .typeSelection {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.quickSelection > a, .publisherSelection > a, .typeSelection > a {
  padding: 10px;
}
</style>
