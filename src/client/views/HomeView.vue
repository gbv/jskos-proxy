<script setup>
import { useRoute, useRouter } from "vue-router"
import * as jskos from "jskos-tools"
import { schemes, schemesAsConceptSchemes, quickSelection, publisherSelection, typeSelection, registry, loadConcept } from "@/store.js"
import { ref, computed, watch } from "vue"
import { getRouterUrl } from "@/utils.js"
import CategoryButton from "@/components/CategoryButton.vue"
import SchemeButton from "@/components/SchemeButton.vue"

const route = useRoute()
const router = useRouter()

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

const loadingUri = ref(false)
watch(() => ([schemesAsConceptSchemes.value, route.query.uri]), async ([schemes, uri]) => {
  if (schemes?.length > 0 && uri) {
    loadingUri.value = true
    // Try to find scheme or concept that fits URI
    const scheme = schemes.find(s => jskos.compare(s, { uri }))
    if (scheme) {
      // Scheme found, redirect
      router.push(getRouterUrl({ scheme }))
      return
    }
    for (const scheme of schemes) {
      const concept = scheme.conceptFromUri(uri)
      if (concept) {
        // Concept found, redirect
        router.push(getRouterUrl({ concept, scheme }))
        return
      }
    }
    // Fallback: Request data from backend about concept directly
    try {
      const concept = await loadConcept(uri)
      const scheme = schemes.find(s => jskos.compare(s, concept?.inScheme?.[0]))
      if (concept && scheme) {
        router.push(getRouterUrl({ concept, scheme }))
        return
      }
    } catch (error) {
      // ignore
    }
    // Report error on console
    loadingUri.value = false
    console.error(`Could find neither vocabulary or concept that fits given URI ${uri}`)
  }
}, { immediate: true })

const publisherGroups = computed(() => {
  const groups = []
  publisherSelection.value.filter(p => p.id !== "__others__").forEach(publisher => {
    const group = groups.find(g => g.name === publisher.name[0])
    if (!group) {
      groups.push({
        name: publisher.name[0],
        publishers: [publisher],
      })
    } else {
      group.publishers.push(publisher)
    }
  })
  const otherPublisher = publisherSelection.value.find(p => p.id === "__others__")
  if (otherPublisher) {
    groups.push({
      name: "",
      publishers: [otherPublisher],
    })
  }
  return groups
})

const selectedPublisher = computed(() => route.query?.publisher ? publisherSelection.value.find(p => p.id === route.query?.publisher) : null)

const conceptSearchResults = ref([])
watch(() => route.query?.conceptSearch, async (value) => {
  if (!value) {
    conceptSearchResults.value = []
    return
  }
  console.time(`concept search ${value}`)
  conceptSearchResults.value = [null]
  const results = await registry.search({ search: value.trim() })
  console.timeEnd(`concept search ${value}`)
  if (value === route.query?.conceptSearch) {
    const groupedResults = []
    for (const result of results) {
      const scheme = result.inScheme[0]
      const existingGroup = groupedResults.find(g => jskos.compare(g.scheme, scheme))
      if (existingGroup) {
        existingGroup.results.push(result)
      } else {
        groupedResults.push({
          scheme,
          results: [result],
        })
      }
    }
    conceptSearchResults.value = groupedResults
  }
}, { immediate: true })

const filteredSchemes = computed(() => {
  if (!schemes.value) {
    return []
  }
  switch (mode.value) {
    case "publisher":
      return selectedPublisher.value?.schemes || []
    case "type":
      return schemes.value.filter(s => s.type?.includes(route.query.type))
    case "search":
      // TODO: Optimize search (very rough at the moment)
      return schemes.value
        .map(scheme => {
          let score = 0, current = 16
          for (const array of [
            // Array of priorities during search
            // 1) notation, identifiers
            [].concat(scheme.notation, [scheme.uri], scheme.identifier || []),
            // 2) preferred label
            Object.values(scheme.prefLabel || {}),
            // 3) definitions
            Object.values(scheme.definition || {}).reduce((prev, cur) => ([...prev, ...cur]), []),
          ]) {
            if (array.map(e => e?.toUpperCase() || "").find(e => e.startsWith(route.query.search.trim().toUpperCase()))) {
              score += current
            } else if (array.map(e => e?.toUpperCase() || "").find(e => e.includes(route.query.search.trim().toUpperCase()))) {
              score += current / 2
            }
            if (current > 2) {
              current /= 2
            }
          }
          return {
            scheme,
            score,
          }
        })
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(e => e.scheme)
    default:
      return quickSelection.value
  }
})

watch(mode, () => {
  // Scroll to top when mode changes (e.g. nagivated by performing a search)
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  }) || window.scrollTo(0, 0)
}, { immediate: true })

</script>

<template>
  <main v-if="!schemes">
    <!-- TODO: Maybe make this a bit nicer -->
    <div class="section">
      <loading-indicator size="xl" />
    </div>
  </main>
  <!-- If URI is given, but we stayed here, that means that URI could not be redirected. -->
  <main v-else-if="route?.query?.uri">
    <div 
      class="section"
      style="text-align: center;">
      <template v-if="loadingUri">
        <h2>{{ $t("loading") }} {{ route.query.uri }}...</h2>
      </template>
      <template v-else>
        <h2>{{ $t("error") }}: {{ route.query.uri }}</h2>
        <p>
          {{ $t("loadUriError") }}
        </p>
        <p>
          <RouterLink to="">
            {{ $t("back") }}
          </RouterLink>
        </p>
      </template>
    </div>
  </main>
  <main v-else-if="schemes.length">
    <!-- Default section -->
    <div class="section">
      <h2 v-if="mode === 'default'">
        {{ $t("quickSelection") }}
      </h2>
      <h2 v-else-if="mode === 'publisher'">
        {{ $t("publisher") }}: {{ selectedPublisher?.name }}
      </h2>
      <h2 v-else-if="mode === 'type'">
        {{ $t("vocabularyType") }}: {{ jskos.prefLabel(typeSelection.find(t => t.uri === route.query.type) || route.query.type) }}
      </h2>
      <h2 v-else-if="mode === 'search'">
        {{ $t("vocSearch") }} "{{ route.query.search }}"
      </h2>
      <h2 v-else-if="mode === 'conceptSearch'">
        {{ $t("conceptSearch") }} "{{ route.query.conceptSearch }}"
      </h2>
      <p 
        v-if="mode === 'search'"
        style="text-align: center;">
        <RouterLink :to="`?conceptSearch=${route.query.search}`">
          search for concepts instead
        </RouterLink>
      </p>
      <div 
        v-if="mode !== 'conceptSearch'"
        class="selection">
        <SchemeButton
          v-for="scheme in filteredSchemes"
          :key="scheme.uri"
          :scheme="scheme" />
      </div>
      <div 
        v-else-if="!conceptSearchResults.includes(null)"
        style="max-width: 1200px; margin: 0 auto;">
        <div
          v-for="{ scheme, results } in conceptSearchResults"
          :key="scheme.uri"
          style="margin-top: 40px; margin-bottom: 30px;">
          <h3><item-name :item="scheme" /></h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px 20px;">
            <RouterLink
              v-for="concept in results"
              :key="concept.uri"
              :to="getRouterUrl({ scheme, concept })">
              <item-name :item="concept" />
            </RouterLink>
          </div>
        </div>
      </div>
      <div
        v-else
        class="selection">
        <loading-indicator size="xl" />
      </div>
    </div>
    <!-- Publisher selection section -->
    <div
      v-if="mode === 'default' && publisherGroups.length"
      class="section">
      <h2>
        {{ $t("publisher") }}
      </h2>
      <div 
        v-for="pg in publisherGroups"
        :key="pg.name || '_'">
        <div class="selection">
          <CategoryButton
            v-for="p in pg.publishers"
            :key="p.id"
            :name="p.name"
            :count="p.schemes.length"
            :to="`?publisher=${encodeURIComponent(p.id)}`" />
        </div>
      </div>
    </div>
    <!-- Type selection section -->
    <div
      v-if="mode === 'default' && typeSelection.length"
      class="section">
      <h2>{{ $t("vocabularyType") }}</h2>
      <div class="selection">
        <CategoryButton
          v-for="t in typeSelection"
          :key="t"
          :name="jskos.prefLabel(t)"
          :count="t.schemes.length"
          :to="`?type=${encodeURIComponent(t.uri)}`" />
      </div>
    </div>
  </main>
  <main v-else>
    <div class="section">
      <h2>{{ $t("error") }}</h2>
      {{ $t("schemesError") }}
    </div>
  </main>
</template>

<style scoped>
.selection {
  max-width: 1200px;
  margin: 0 auto 20px auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
