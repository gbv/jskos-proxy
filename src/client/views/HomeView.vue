<script setup>
import { RouterLink } from "vue-router"
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { schemes, quickSelection, publisherSelection, typeSelection } from "@/store.js"

</script>

<template>
  <main v-if="schemes">
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
          v-for="type in typeSelection"
          :key="type"
          :to="`?type=${encodeURIComponent(type.uri)}`">
          {{ jskos.prefLabel(type) }}
        </RouterLink>
      </div>
    </div>
  </main>
  <main v-else>
    <LoadingIndicator />
  </main>
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
