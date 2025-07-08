<script setup>
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { getFormat } from "@/store.js"

import { getRouterUrl } from "@/utils.js"
import { computed } from "vue"
import { utils } from "jskos-vue"

const props = defineProps({
  concept: Object,
  scheme: Object,
})

const item = computed(() => props.concept || props.scheme)
</script>

<template>
  <div class="item-metadata">
    <ul class="condense-list">
      <template v-for="prop in ['created', 'issued', 'modified']">
        <li
          v-if="item[prop]"
          :key="prop">
          <b>{{ $t(prop) }}:</b> {{ utils.dateToString(item[prop]) }}
        </li>
      </template>
    </ul>
    <div>
      <b>{{ $t("download") }}:</b>
      <span
        v-for="format in ['jskos', 'turtle', 'rdfxml', 'ntriples']"
        :key="format">&nbsp;
        <RouterLink 
          :to="getRouterUrl({ scheme, concept, params: { format }})"
          target="_blank">
          {{ format }}
        </RouterLink>
      </span>
    </div>
    <ul
      v-if="!concept && scheme?.distributions?.length"
      class="condense-list"
      style="padding-top: 0.5em">
      <li
        v-for="distribution of scheme.distributions"
        :key="distribution.download">
        <a
          :href="distribution.download"
          target="_blank"
          download>
          {{ distribution.created || "Download" }}
        </a>
        (<auto-link
          :href="distribution.format"
          target="_blank">
          {{ getFormat(distribution) }}
        </auto-link><span v-if="distribution.size">, {{ distribution.size }}</span>)
        {{ jskos.languageMapContent(distribution, "definition")?.[0] || "" }}
      </li>
    </ul>

    <div 
      v-if="config.env === 'development'">
      <pre><code>{{ JSON.stringify(jskos.deepCopy(item, ["topConceptOf", "inScheme", "topConcepts"]), null, 2) }}
            </code></pre>
    </div>
  </div>
</template>

<style>
.item-metadata {
  border-top: 1px solid var(--color-primary);
  padding-top: 0.5em;
  margin-top: 0.5em;
}
/* TODO: use jskos-vue-itemDetails-list instead */     
.condense-list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
}
</style>
