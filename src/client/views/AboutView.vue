<script setup>
import config from "@/config.js"
import { locale } from "@/store.js"
import { routerBasePath } from "@/utils.js"
</script>

<template>
  <!-- TODO: Styles -->
  <div
    class="section"
    style="max-width: 1200px; margin: 0 auto;">
    <h1>{{ $t("aboutTitle") }}</h1>
    <template v-if="locale === 'de'">
      <p>
        Unter <a :href="routerBasePath">{{ config.namespace }}</a>
        können <b>kontrollierte Vokabulare</b> (Normdateien, Klassifikationen, Thesauri...)
        in einer Webansicht und als Linked Open Data abgerufen werden.
      </p>
      <p>
        Die Daten stammen von <code>{{ config.backend }}</code> und werden mittels
        <a :href="config.homepage">{{ config.name }}</a> umgesetzt.
      </p>
    </template>
    <template v-else>
      <!-- TODO -->
      <p>
        <a :href="routerBasePath">{{ config.namespace }}</a>
        allows <b>controlled vocabularies</b> (norm data, classifications, thesauri...)
        to be browsed in a web view and accessed as Linked Open Data.
      </p>
      <p>
        Data is accessed from <code>{{ config.backend }}</code> and implemented via
        <a :href="config.homepage">{{ config.name }}</a>.
      </p>
    </template>
  </div>
</template>

<style>

</style>
