<script setup>
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { AutoLink, LicenseInfo } from "jskos-vue"
import { schemes, registry, loadTop, loadNarrower, loadConcept, loadAncestors, saveConcept, formats } from "@/store.js"
import { computed, ref, reactive, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { utils } from "jskos-vue"
import MapView from "@/components/MapView.vue"

import { getRouterUrl } from "@/utils.js"
const route = useRoute()
const router = useRouter()

const conceptTreeRef = ref(null)

const errors = reactive({
  schemesError: false,
  schemeError: false,
  loadConceptError: false,
  loadTopError: false,
})

const schemeUri = computed(() => route.params.voc.match(/^https?:\/\//) ? route.params.voc : `${config.namespace}${route.params.voc}/`)
const scheme = computed(() => {
  return schemes.value?.find(s => jskos.compare(s, { uri: schemeUri.value }))
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
const conceptLoading = ref(true)
const hierarchyLoading = ref(true)
let topLoadingPromise = null

// Load top concepts when scheme is ready
watch([schemes, scheme], async () => {
  if (schemes.value?.length) {
    errors.schemesError = false
  } else {
    errors.schemesError = true
  }
  errors.loadTopError = false
  if (scheme.value && (!scheme.value?.topConcepts || scheme.value?.topConcepts?.includes(null))) {
    topLoadingPromise = loadTop(scheme.value).catch(error => {
      console.error(`Error loading top concepts for ${scheme.value?.uri}:`, error)
      errors.loadTopError = true
    })
  }
  if (scheme.value) {
    errors.schemeError = false
  } else if (schemes.value?.length) {
    console.error(`Scheme ${schemeUri.value} could not be found.`)
    errors.schemeError = true
  }
},{ immediate: true })

watch(uri, async (value, prevValue) => {
  errors.loadConceptError = false
  if (value && value !== prevValue) {
    let shouldScroll = true
    const openAndScroll = () => {
      if (!shouldScroll) {
        return
      }
      shouldScroll = false
      // Open all ancestors in hierarchy
      for (const ancestor of concept.value?.ancestors || []) {
        conceptTreeRef.value?.open(ancestor)
      }
      // Scroll to concept in hierarchy
      setTimeout(() => {
        conceptTreeRef.value?.scrollToUri(value, true)
        hierarchyLoading.value = false
      }, 50)
    }
    window.scrollTo(0, 0)
    // Debounce loading values so that we prevent "flashing" loading overlays
    conceptLoading.value = null
    // Only show hierarchy loading if anything needs to be opened
    if (document.querySelectorAll(`[data-uri='${value}']`).length && concept.value?.ancestors?.length && !concept.value?.ancestors?.includes(null)) {
      // If element is already there, scroll there immediately before other things are loaded
      openAndScroll()
    } else {
      hierarchyLoading.value = null
    }
    utils.debounce(() => {
      if (conceptLoading.value === null) {
        conceptLoading.value = true
      }
      if (hierarchyLoading.value === null) {
        hierarchyLoading.value = true
      }
    }, 150)()
    // Reset ItemDetails tab
    // TODO: This is a hacky workaround. Should be possible natively in jskos-vue.
    const tabsVueComponent = document.getElementsByClassName("jskos-vue-tabs")[0]?.__vueParentComponent
    tabsVueComponent?.proxy?.activateTab(0)
    // Wait for top concepts before doing anything else
    topLoadingPromise && await topLoadingPromise
    // Load concept data
    let loadedConcept
    try {
      loadedConcept = await loadConcept(value, scheme.value)
    } catch (error) {
      console.error(`Error loading concept ${value}:`, error)
      errors.loadConceptError = true
      conceptLoading.value = false
      hierarchyLoading.value = false
      return
    }
    // Abort if concept has changed in the meantime
    if (value !== uri.value) {
      return
    }
    conceptLoading.value = false
    // Load concept ancestors/hierarchy
    await Promise.all([loadAncestors(loadedConcept), loadNarrower(loadedConcept)])
    // Abort if concept has changed in the meantime
    if (value !== uri.value) {
      return
    }
    openAndScroll()
  } else {
    conceptLoading.value = false
    hierarchyLoading.value = false
  }
},{ immediate: true })

// Top concepts computed
const topConcepts = computed(() => {
  return scheme.value?.topConcepts
})
</script>

<template>
  <h2 id="schemeHeader">
    <router-link 
      v-if="scheme && !errors.schemeError"
      :to="getRouterUrl({ scheme })">
      {{ jskos.prefLabel(scheme) }}
    </router-link>
    <span v-else>
      {{ $t("error") }}: {{ schemeUri }}
    </span>
    <div
      v-if="scheme?.license?.length"
      id="licenseInfo">
      <license-info :item="scheme" />
    </div>
  </h2>
  <item-suggest
    v-if="scheme"
    id="searchInScheme"
    :search="utils.cdkRegistryToSuggestFunction(registry, { scheme })"
    :placeholder="jskos.notation(scheme) ? $t('searchInVocabulary', { voc: jskos.notation(scheme) }) : null"
    @select="concept = { uri: $event.uri }" />
  <!-- ConceptTree has to be on the top level in order for "scrollToUri" to work -->
  <div 
    v-if="!errors.schemesError && !errors.schemeError && !errors.loadTopError"
    id="conceptHierarchy">
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
    v-else
    id="conceptHierarchy">
    <template v-if="errors.schemeError">
      {{ t("schemeError") }}
    </template>
    <template v-if="errors.schemesError">
      {{ $t("schemesError") }}
    </template>
    <template v-if="errors.loadTopError">
      {{ $t("loadTopError") }}
    </template>
  </div>
  <div 
    v-if="scheme"
    id="conceptDetails">
    <div
      v-if="!scheme || conceptLoading"
      class="loading">
      <loading-indicator size="xl" />
    </div>
    <item-details
      v-if="(concept || scheme) && !errors.loadConceptError"
      id="itemDetails"
      :item="concept || scheme"
      :flat="true"
      :fields="{ type: false }"
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
          v-if="concept?.location?.length"
          title="Map">
          <MapView
            :key="`${uri}`"
            :locations="Array.isArray(concept.location) ? concept.location : [concept.location]" />
        </div>
        <div style="margin: 0 0 10px;">
          <b>Linked Data:</b>
          <span
            v-for="format in ['jskos', 'turtle', 'rdfxml', 'ntriples']"
            :key="format">&nbsp;
            <router-link 
              :to="getRouterUrl({ scheme, concept, params: { format }})"
              target="_blank">
              {{ format }}
            </router-link>
          </span>
        </div>
        <ul 
          v-if="!concept && scheme?.distributions?.length"
          class="jskos-vue-itemDetails-list">
          <li><b>{{ $t("distributions") }}:</b></li>
          <li
            v-for="distribution of scheme.distributions"
            :key="distribution.download">
            <a
              :href="distribution.download"
              target="_blank"
              download>
              {{ distribution.created || "Download" }}
            </a>
            (<a
              :href="distribution.format"
              target="_blank">
              {{ formats[distribution.format] }}
            </a>, {{ distribution.size }}) {{ jskos.languageMapContent(distribution, "definition")?.[0] || "" }}
          </li>
        </ul>
      </template>
    </item-details>
    <div
      v-else
      id="itemDetails">
      <div class="jskos-vue-itemDetails-name">
        {{ $t("error") }}: {{ uri }}
      </div>
      {{ $t("loadConceptError") }}
    </div>
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
  }
  #searchInScheme {
    border-top: 1px solid var(--color-primary);
    margin-bottom: 25px;
    margin-right: 4vw;
  }
  #searchInScheme > input, #searchInScheme > .jskos-vue-itemSuggest-results {
    width: calc(50% - 3vw);
    border-top: none;
  }
  #schemeHeader, #conceptHierarchy, #conceptDetails {
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
  #conceptTree, #itemDetails {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
  }
  #itemDetails {
    top: -58px;
  }
}
#schemeHeader {
  display: flex;
}
#schemeHeader > *:first-child {
  flex: 1;
  padding-right: 15px;
}
#licenseInfo {
  font-weight: normal;
  font-size: 18px;
  margin-top: 5px;
}
#licenseInfo > .jskos-vue-itemDetails-licenseInfo {
  display: block;
  margin-top: -5px;
  margin-left: -4px;
}
.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  /* TODO */
  background-color: #f4f4f453;
  backdrop-filter: blur(1px);
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
  padding: 18px 0;
  position: sticky;
  top: 0;
  background-color: var(--color-section-background-primary);
  /* Without this, some elements with position: relative; will still overlap */
  z-index: 1;
}
</style>
