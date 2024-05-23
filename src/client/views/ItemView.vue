<script setup>
import config from "@/config.js"
import * as jskos from "jskos-tools"
import { schemes, registry, loadTop, loadNarrower, loadConcept, loadAncestors, getConceptByUri } from "@/store.js"
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
    return getConceptByUri(uri.value)
  },
  set(value) {
    router.push(getRouterUrl({ scheme: scheme.value, concept: value }))
  },
})
const conceptLoading = ref(true)
const hierarchyLoading = ref(true)

// Load top concepts when scheme is ready
watch(scheme, () => {
  console.log("watch scheme")
  if (scheme.value && (!scheme.value?.topConcepts || scheme.value?.topConcepts?.includes(null))) {
    loadTop(scheme.value)
  }
  console.log("watch scheme end")
},{ immediate: true })

watch(uri, async (value, prevValue) => {
  console.log("watch uri")
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
    conceptLoading.value = false
    // Load concept ancestors/hierarchy
    await loadAncestors(loadedConcept)
    // Abort if concept has changed in the meantime
    if (!jskos.compare({ uri: value }, concept.value)) {
      return
    }
    // Open all ancestors in hierarchy
    for (const ancestor of loadedConcept.ancestors) {
      console.log("Open", ancestor.uri)
      conceptTreeRef.value?.open(ancestor)
      console.log(conceptTreeRef.value?.isOpen[ancestor.uri])
    }
    // Scroll to concept in hierarchy
    setTimeout(() => {
      conceptTreeRef.value.scrollToUri(value, true)
      hierarchyLoading.value = false
    }, 50)
  }
  console.log("watch uri end")
},{ immediate: true })

// Top concepts computed
const topConcepts = computed(() => {
  console.log(scheme.value?.topConcepts)
  return scheme.value?.topConcepts
})

// function test(...params) {
//   console.log(...params)
// }
// 
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
          v-if="!concept || conceptLoading"
          class="loading">
          <loading-indicator size="xl" />
        </div>
        <div v-else>
          {{ concept.uri }}
        </div>
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
.jskos-vue-conceptTree {
  /* TODO: Fix this? */
  position: absolute;
  top: 0; bottom: 20px; left: 0; right: 0;
  overflow-y: auto;
}
</style>

<style>
main {
  display: flex;
  flex-direction: column;
}
</style>
