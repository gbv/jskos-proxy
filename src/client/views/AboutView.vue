<script setup>
import { computed } from "vue"
import config from "@/config.js"
import { locale } from "@/store.js"
import { routerBasePath } from "@/utils.js"
import AboutViewDetails from "@/views/AboutViewDetails.vue"

const isGerman = computed(() => locale.value === "de")
</script>

<template>
  <!-- TODO: Styles -->
  <main>
    <div
      class="section">
      <h2>
        {{ $t("aboutTitle") }}
      </h2>

      <p>
        <RouterLink :to="routerBasePath">
          {{ config.namespace }}
        </RouterLink>
        <span v-if="isGerman">
          bietet eine Plattform zum Durchsuchen <b>kontrollierte Vokabulare</b>, einschließlich normierter Daten,
          Klassifikationen und Thesauri, über eine benutzerfreundliche Web-Oberfläche. 
          Darüber hinaus ermöglicht es einen nahtlosen Zugang zu diesen Ressourcen als 
          Linked Open Data, wodurch ihre Integration und Wiederverwendung in 
          verschiedenen Anwendungen und Fachbereichen erleichtert wird
        </span>
        <span v-else>
          provides a platform for exploring <b>controlled vocabularies</b>, 
          including normative data, classifications, and thesauri, through an intuitive web interface. 
          Additionally, it enables seamless access to these resources as Linked Open Data, facilitating 
          their integration and reuse across various applications and domains.
        </span>
      </p>
      <p>
        <span v-if="isGerman">
          Die Daten werden über mehrere APIs abgerufen. Diese Datenquellen 
          werden über das <a :href="config.homepage">{{ config.name }}</a> integriert und implementiert, 
          das eine einheitliche Schnittstelle für die Interaktion mit kontrollierten Vokabularen, 
          Klassifikationen und verwandten Ressourcen bietet. 
          Die folgende Tabelle gibt weitere Details zu den Quellen und ihrer Nutzung:
        </span>
        <span v-else>
          Data is accessed from multiple APIs. 
          These data sources are integrated and implemented through the <a :href="config.homepage">{{ config.name }}</a>, 
          which provides a unified interface for interacting with controlled vocabularies, 
          classifications, and related resources. 
          The following table provides further details about the sources and their usage:
        </span>
      </p>

      <AboutViewDetails />
    </div>
  </main>
</template>

<style scoped>
.section {
  max-width: 1200px;
  margin: 0 auto;
}
</style>