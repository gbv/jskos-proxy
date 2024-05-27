<script setup>
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { Tab } from "jskos-vue-tabs"
import { schemes, registry, loadTop, loadNarrower, loadConcept, loadAncestors, saveConcept } from "@/store.js"
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { utils } from "jskos-vue"
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

// Load top concepts when scheme is ready
watch(scheme, () => {
  if (scheme.value && (!scheme.value?.topConcepts || scheme.value?.topConcepts?.includes(null))) {
    loadTop(scheme.value)
  }
},{ immediate: true })

watch(uri, async (value, prevValue) => {
  if (value && value !== prevValue) {
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
    // Load concept data
    const loadedConcept = await loadConcept(value, scheme.value)
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
    // Open all ancestors in hierarchy
    for (const ancestor of loadedConcept.ancestors) {
      conceptTreeRef.value?.open(ancestor)
    }
    // Scroll to concept in hierarchy
    setTimeout(() => {
      conceptTreeRef.value.scrollToUri(value, true)
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
  <div class="itemView">
    <h2>
      <router-link :to="getRouterUrl({ scheme })">
        {{ jskos.prefLabel(scheme) }}
      </router-link>
    </h2>
    <item-suggest
      v-if="scheme"
      class="conceptSuggest"
      :search="utils.cdkRegistryToSuggestFunction(registry, { scheme })"
      @select="concept = { uri: $event.uri }" />
    <div class="itemView-split">
      <div class="conceptHierarchy">
        <concept-tree
          v-if="topConcepts"
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
      <div class="conceptDetails">
        <div
          v-if="!scheme || conceptLoading"
          class="loading">
          <loading-indicator size="xl" />
        </div>
        <item-details 
          v-else
          :item="concept || scheme"
          @select="concept = { uri: $event.item.uri }">
          <template #additionalTabs>
            <tab title="Linked Data">
              <div
                v-for="format in ['jskos', 'turtle', 'rdfxml', 'ntriples']"
                :key="format">
                <a :href="`?format=${format}`">
                  {{ format }}
                </a>
              </div>
            </tab>
          </template>
        </item-details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.itemView {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.conceptSuggest {
  max-width: 50%;
  margin-top: -10px;
  margin-bottom: 15px;
}
.itemView-split {
  flex: 1;
  display: flex;
  padding-bottom: 20px;
}
.itemView-split > * {
  flex: 1;
  padding: 10px;
}
.conceptHierarchy, .conceptDetails {
  position: relative;
}
.conceptDetails {
  padding-left: 25px;
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
/* TODO: Fix this? */
.jskos-vue-conceptTree, .jskos-vue-itemDetails {
  position: absolute;
  top: 0; bottom: 20px; left: 10px; right: 10px;
  overflow-y: auto;
}
</style>

<style>
main {
  display: flex;
  flex-direction: column;
}
</style>
