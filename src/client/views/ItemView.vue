<script setup>
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { AutoLink } from "jskos-vue"
import { schemes, registry, loadTop, loadNarrower, loadConcept, loadAncestors, saveConcept } from "@/store.js"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { utils } from "jskos-vue"
import MapView from "@/components/MapView.vue"

import { getRouterUrl } from "@/utils.js"
const route = useRoute()
const router = useRouter()

const conceptTreeRef = ref(null)

const scheme = computed(() => {
  return schemes.value?.find(s => jskos.compare(s, { uri: route.params.voc.match(/^https?:\/\//) ? route.params.voc : `${config.namespace}${route.params.voc}/` }))
})

const uri = computed(() => scheme.value && (route.params.id && `${config.namespace}${route.params.voc}/${route.params.id}` || route.query.uri))
const concept = computed({
  get() {
    if (!uri.value) {
      return null
    }
    return saveConcept({ uri: uri.value }, { returnIfExists: true, returnNullOnError: true })
  },
  set(value) {
    router.push(getRouterUrl({ scheme: scheme.value, concept: value }))
  },
})
const conceptLoading = ref(false)
const hierarchyLoading = ref(false)
let topLoadingPromise = null

// Load top concepts when scheme is ready
watch(scheme, async () => {
  if (scheme.value && (!scheme.value?.topConcepts || scheme.value?.topConcepts?.includes(null))) {
    topLoadingPromise = loadTop(scheme.value)
  }
},{ immediate: true })

watch(uri, async (value, prevValue) => {
  if (value && value !== prevValue) {
    window.scrollTo(0, 0)
    // Debounce loading values so that we prevent "flashing" loading overlays
    conceptLoading.value = null
    hierarchyLoading.value = null
    utils.debounce(() => {
      if (conceptLoading.value === null) {
        conceptLoading.value = true
      }
      if (hierarchyLoading.value === null) {
        hierarchyLoading.value = true
      }
    }, 100)()
    // Reset ItemDetails tab
    // TODO: This is a hacky workaround. Should be possible natively in jskos-vue.
    const tabsVueComponent = document.getElementsByClassName("jskos-vue-tabs")[0]?.__vueParentComponent
    tabsVueComponent?.proxy?.activateTab(0)
    // Load concept data
    const loadedConcept = await loadConcept(value, scheme.value)
    // Abort if concept has changed in the meantime
    if (value !== uri.value) {
      return
    }
    conceptLoading.value = false
    // Load concept ancestors/hierarchy
    topLoadingPromise && await topLoadingPromise
    await Promise.all([loadAncestors(loadedConcept), loadNarrower(loadedConcept)])
    // Abort if concept has changed in the meantime
    if (value !== uri.value) {
      return
    }
    // Open all ancestors in hierarchy
    for (const ancestor of loadedConcept.ancestors) {
      conceptTreeRef.value?.open(ancestor)
    }
    // Scroll to concept in hierarchy
    setTimeout(() => {
      conceptTreeRef.value?.scrollToUri(value, true)
      hierarchyLoading.value = false
    }, 50)
  }
},{ immediate: true })

// Top concepts computed
const topConcepts = computed(() => {
  return scheme.value?.topConcepts
})
</script>

<template>
  <h2 id="schemeHeader">
    <router-link :to="getRouterUrl({ scheme })">
      {{ jskos.prefLabel(scheme) }}
    </router-link>
  </h2>
  <item-suggest
    v-if="scheme"
    id="searchInScheme"
    :search="utils.cdkRegistryToSuggestFunction(registry, { scheme })"
    :placeholder="jskos.notation(scheme) ? $t('searchInVocabulary', { voc: jskos.notation(scheme) }) : null"
    @select="concept = { uri: $event.uri }" />
  <!-- ConceptTree has to be on the top level in order for "scrollToUri" to work -->
  <div id="conceptHierarchy">
    <concept-tree
      v-if="topConcepts"
      id="conceptTree"
      ref="conceptTreeRef"
      v-model="concept"
      :concepts="topConcepts"
      @open="loadNarrower($event)" />
    <div
      v-if="!topConcepts || hierarchyLoading"
      class="loading">
      <loading-indicator size="xl" />
    </div>
  </div>
  <div 
    id="conceptDetails">
    <div
      v-if="!scheme || conceptLoading"
      class="loading">
      <loading-indicator size="xl" />
    </div>
    <item-details 
      v-else
      :item="concept || scheme"
      :flat="true"
      @select="concept = { uri: $event.item.uri }">
      <template #additionalTabs>
        <div
          v-if="concept?.mappings?.length">
          <ul class="jskos-vue-itemDetails-list">
            <li><b>Mappings:</b></li>
            <li 
              v-for="(mapping, index) in concept.mappings"
              :key="index">
              <span :title="jskos.prefLabel(jskos.mappingTypeByType(mapping.type) || jskos.defaultMappingType)">
                {{ (jskos.mappingTypeByType(mapping.type) || jskos.defaultMappingType).notation[0] }}
              </span>&nbsp;<auto-link
                v-for="c in jskos.conceptsOfMapping(mapping)"
                :key="c?.uri"
                :href="c?.uri" />
            </li>
          </ul>
        </div>
        <div
          v-if="concept?.location?.coordinates?.length"
          title="Map">
          <MapView
            :longitude="concept.location.coordinates[0]"
            :latitude="concept.location.coordinates[1]" />
        </div>
        <div>
          <b>Linked Data:</b>
          <span
            v-for="format in ['jskos', 'turtle', 'rdfxml', 'ntriples']"
            :key="format">&nbsp;
            <a 
              :href="getRouterUrl({ scheme, concept, params: { format }})">
              {{ format }}
            </a>
          </span>
        </div>
      </template>
    </item-details>
  </div>
</template>

<!-- Note that we need unscoped rules for some of the selectors (particularly for "input") -->
<style>
#schemeHeader {
  grid-area: 2 / 1 / 3 / 3;
  margin-bottom: 5px;
  width: calc(100% - 10vw);
  max-width: 1200px;
  place-self: center;
}
#schemeHeader, #searchInScheme, #conceptHierarchy, #conceptDetails {
  margin-left: 5vw;
  margin-right: 5vw;
  position: relative;
}
#searchInScheme {
  grid-area: 3 / 1 / 4 / 3;
  margin-bottom: 15px;
}
#conceptHierarchy {
  grid-area: 5 / 1 / 6 / 3;
  margin-bottom: 35px;
}
#conceptDetails {
  grid-area: 4 / 1 / 5 / 3;
  margin-bottom: 20px;
}
@media only screen and (min-width: 800px) {
  #searchInScheme, #schemeHeader {
    width: calc(100% - 4vw);
    /* Add margins of conceptHierarchy and conceptDetails to max-width */
    max-width: calc(1200px + 4vw);
    place-self: center;
  }
  #searchInScheme {
    grid-area: 3 / 1 / 4 / 3;
  }
  #conceptHierarchy {
    grid-area: 4 / 1 / 6 / 2;
  }
  #conceptDetails {
    grid-area: 4 / 2 / 6 / 3;
    overflow-y: auto;
  }
  #searchInScheme {
    border-top: 1px solid var(--color-primary);
    margin-bottom: 25px;
  }
  #searchInScheme > input {
    width: 50%;
    border-top: none;
  }
  #searchInScheme > .jskos-vue-itemSuggest-results {
    width: 50%;
  }
  #schemeHeader, #searchInScheme, #conceptHierarchy, #conceptDetails {
    margin-left: 2vw;
    margin-right: 2vw;
  }
  #conceptHierarchy, #conceptDetails {
    margin-bottom: 20px;
  }
  #conceptHierarchy, #conceptDetails {
    max-width: 600px;
    width: calc(100% - 4vw);
  }
  #conceptHierarchy {
    justify-self: end;
  }
  #conceptTree {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
  }
}
.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  /* TODO */
  background-color: #f4f4f476;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Override jskos-vue styles */
.jskos-vue-itemDetails-tabs {
  margin: 15px 0;
}
.jskos-vue-itemDetails-name {
  font-weight: 700;
  margin-bottom: 20px;
}
</style>
