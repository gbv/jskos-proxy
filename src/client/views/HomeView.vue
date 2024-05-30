<script setup>
import { useRoute } from "vue-router"
import * as jskos from "jskos-tools"
import { schemes, quickSelection, publisherSelection, typeSelection, registry } from "@/store.js"
import { ref, computed, watch } from "vue"
import { getRouterUrl } from "@/utils.js"

const route = useRoute()

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

const conceptSearchResults = ref([])
watch(() => route.query?.conceptSearch, async (value) => {
  if (!value) {
    conceptSearchResults.value = []
    return
  }
  console.time(`concept search ${value}`)
  conceptSearchResults.value = [null]
  const results = await registry.search({ search: value })
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
      return schemes.value.filter(s => s.publisher?.find(p => p.uri === route.query.publisher || jskos.prefLabel(p) === route.query.publisher))
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
            if (array.map(e => e?.toUpperCase() || "").find(e => e.startsWith(route.query.search.toUpperCase()))) {
              score += current
            } else if (array.map(e => e?.toUpperCase() || "").find(e => e.includes(route.query.search.toUpperCase()))) {
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
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  }) || window.scrollTo(0, 0)
}, { immediate: true })

</script>

<template>
  <main v-if="schemes">
    <!-- Default section -->
    <div class="section">
      <h2 v-if="mode === 'default'">
        {{ $t("quickSelection") }}
      </h2>
      <h2 v-else-if="mode === 'publisher'">
        {{ $t("publisher") }}: {{ route.query.publisher }}
      </h2>
      <h2 v-else-if="mode === 'type'">
        {{ $t("vocabularyType") }}: {{ jskos.prefLabel(typeSelection.find(t => t.uri === route.query.type) || route.query.type) }}
      </h2>
      <h2 v-else-if="mode === 'search'">
        {{ $t("vocSearch") }} "{{ route.query.search }}"
      </h2>
      <h2 v-else-if="mode === 'conceptSearch'">
        {{ $t("conceptSearch") }} "{{ route.query.conceptSearch }}" TODO
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
        <RouterLink
          v-for="scheme in filteredSchemes"
          :key="scheme.uri"
          class="scheme-selection"
          :to="getRouterUrl({ scheme })">
          {{ jskos.prefLabel(scheme) }}
        </RouterLink>
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
      v-if="mode === 'default' && publisherSelection.length"
      class="section">
      <h2>{{ $t("publisher") }}</h2>
      <div class="selection">
        <RouterLink
          v-for="publisher in publisherSelection"
          :key="publisher"
          class="category-selection"
          :to="`?publisher=${encodeURIComponent(publisher)}`">
          {{ publisher }}
        </RouterLink>
      </div>
    </div>
    <!-- Type selection section -->
    <div
      v-if="mode === 'default' && typeSelection.length"
      class="section">
      <h2>{{ $t("vocabularyType") }}</h2>
      <div class="selection">
        <RouterLink
          v-for="t in typeSelection"
          :key="t"
          class="category-selection"
          :to="`?type=${encodeURIComponent(t.uri)}`">
          {{ jskos.prefLabel(t) }}
        </RouterLink>
      </div>
    </div>
  </main>
  <main v-else>
    <LoadingIndicator />
  </main>
</template>

<style scoped>
</style>
