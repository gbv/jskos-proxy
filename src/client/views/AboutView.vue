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
      <div v-if="isGerman">
        <h3>Datenquellen</h3>
        <p>
          Die Vokabulardaten stammen von einem oder mehreren Vokabular-Servern, die per JSKOS-API
          abgerufen und mittels <a :href="config.homepage">{{ config.name }}</a> in einer einheitlichen 
          Schnittstelle bereitgestellt werden:
        </p>
      </div>
      <div v-else>
        <h3>Data sources</h3>
        <p>
          Terminology data is retrieved via JSKOS-API from one ore more terminology services and
          provided in a uniform interface with <a :href="config.homepage">{{ config.name }}</a>:
        </p>
      </div>

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
