<script setup>
import { computed, reactive, watch, onMounted } from "vue"
import { AutoLink } from "jskos-vue"
import { schemes } from "@/store.js"
import * as jskos from "jskos-tools"
import { loadConcept} from "../store"
import PlaceItem from "./PlaceItem.vue"


// Name component (allows recursion) + disable suspense
defineOptions({ name: "QualifiedRelationsTree", suspensible: false })

const props = defineProps({
  // Root item containing qualified relations
  item: { type: Object, required: true },

  // Recursion depth control
  depth: { type: Number, default: 0 },
  maxDepth: { type: Number, default: 4 },

  // Cycle guard: prevent infinite loops by URI
  visited: { type: Array, default: () => [] },
})


// Qualified relations map (propertyUri -> statements)
const relations = computed(() => props.item?.qualifiedRelations || {})

// Current item URI (if any)
const uri = computed(() => props.item?.uri || null)

// Build visited list including current
const localVisited = computed(() => {
  const cur = uri.value ? [uri.value] : []
  return [...props.visited, ...cur]
})

// True if there is at least one relation
const hasAny = computed(() => Object.keys(relations.value).length > 0)

// --- small helpers ---

// Shorten long URLs for display
const shorten = (u) => {
  try {
    const x = new URL(u)
    const host = x.hostname.replace(/^www\./, "")
    const segs = x.pathname.split("/").filter(Boolean)
    const path = segs.length > 2 ? `/…/${segs.at(-1)}` : `/${segs.join("/")}`
    return (host + path).replace(/\/$/, "")
  } catch {
    return u 
  }
}

// Format date range compactly
const fmtRange = (s, e) => (s || e) ? `${s || "…"}–${e || "…"}` : ""

// Find best matching scheme by longest URI prefix
function findSchemeForUri(u) {
  if (!schemes?.value?.length || !u) {
    return null
  }
  const candidates = schemes.value.filter(s => typeof s?.uri === "string" && u.startsWith(s.uri))
  if (candidates.length === 0) {
    return null
  }
  // Most specific base wins
  return candidates.sort((a, b) => b.uri.length - a.uri.length)[0]
}


// ---------- lightweight cache ----------
// Resolved concepts by URI
const cache = reactive({})
// Load errors by URI
const errors = reactive({})
// Loading flags by URI
const conceptLoading = reactive({})


// Ensure a concept is loaded
function ensureConcept(u) {
  if (!u || cache[u] || conceptLoading[u]) {
    return
  }
  const scheme = findSchemeForUri(u)
  if (!scheme) {
    return
  }
  conceptLoading[u] = true
  loadConcept(u, scheme, false)
    .then(concept => {
      cache[u] = concept 
    })
    .catch(e => {
      errors[u] = e 
    })
    .finally(() => {
      conceptLoading[u] = false 
    })
}

// Collect all URIs to resolve (properties, resources, types, places)
function collectUris() {
  const set = new Set()
  for (const [propUri, qualifiedList] of Object.entries(relations.value)) {
    if (propUri) {
      set.add(propUri)
    }
    for (const statement of (qualifiedList || [])) {
      const resUri = statement?.resource?.uri
      if (typeof resUri === "string") {
        set.add(resUri)
      }

      const types = statement?.resource?.type || []
      for (const type of types) {
        if (typeof type === "string") {
          set.add(type) 
        }
      }

      const places = statement?.resource?.place || []
      for (const place of places) {
        const placeUri = place?.uri
        if (typeof placeUri === "string") {
          set.add(placeUri) 
        }
      }

    }
  }
  return [...set]
}

watch(relations, () => {
  collectUris().forEach(ensureConcept)
}, { immediate: true, deep: true })

onMounted(() => {
  collectUris().forEach(ensureConcept)
})

function labelForUri(u) {
  if (!u) {
    return ""
  }
  return cache[u] ? (jskos.prefLabel(cache[u]) || shorten(u)) : shorten(u)
}

const loading = computed(() => {
  Object.keys(conceptLoading).forEach(u => {
    if (conceptLoading[u]) {
      return true 
    }
  })
  return false
})


</script>


<template>
  <!-- 1) Show ONLY the loader when loading -->
  <div
    v-if="loading"
    class="loading">
    <loading-indicator size="xl" />
  </div>

  <!-- 2) When not loading, render the rest -->
  <template v-else>
    <ul
      v-if="hasAny"
      class="qualified-relations-tree__wrapper">
      <!-- Loop properties of qualifiedRelations (object, not array) -->
      <li
        v-for="(qualifiedList, propertyUri) in relations"
        :key="propertyUri"
        class="qualified-relations__item">
        <div class="property-uri__head">
          <AutoLink
            :href="propertyUri"
            :text="labelForUri(propertyUri)"
            :title="propertyUri" />
        </div>

        <ul class="qualifiedList__wrapper">
          <li
            v-for="(statement, idx) in qualifiedList"
            :key="propertyUri + '-' + idx">
            <!-- resource -->
            <div v-if="statement.resource">
              <!-- URI -->
              <div
                v-if="statement.resource.uri"
                class="statement-row">
                <AutoLink
                  :href="statement.resource.uri"
                  :text="labelForUri(statement.resource.uri)"
                  :title="statement.resource.uri" />
              </div>

              <!-- types -->
              <div
                v-if="statement.resource.type?.length"
                class="statement-row">
                <div class="statement-row__head">
                  Types
                </div>:
                <ul class="statement-row__value-list">
                  <li
                    v-for="(type, idxType) in statement.resource.type"
                    :key="propertyUri + '-' + idxType"
                    class="statement-row__value">
                    <AutoLink
                      :href="type"
                      :text="labelForUri(type)"
                      :title="type" />
                  </li>
                </ul>
              </div>

              <!-- place -->
              <div
                v-if="statement.resource.place?.length"
                class="statement-row">
                <div class="statement-row__head">
                  Place
                </div>:
                <PlaceItem
                  :places="statement.resource.place"
                  :label-for-uri="labelForUri"
                  :dense="true" />
              </div>

              <!-- recurse -->
              <QualifiedRelationsTree
                v-if="statement.resource?.qualifiedRelations
                  && depth < maxDepth
                  && !(statement.resource?.uri && visited.includes(statement.resource.uri))"
                :item="statement.resource"
                :depth="depth + 1"
                :max-depth="maxDepth"
                :visited="localVisited" />
            </div>
            <!-- meta (rank/date range) -->
            <small
              v-if="statement.rank"
              class="rank-badge">
              Rank: {{ statement.rank }}
            </small>
            <small
              v-if="statement.startDate || statement.endDate"
              class="range-dates">
              · {{ fmtRange(statement.startDate, statement.endDate) }}
            </small>
          </li>
        </ul>
      </li>
    </ul>
  </template>
</template>

<style scoped>
.qualified-relations-tree__wrapper { 
  list-style: none;
  padding: 0;
}
.qualified-relations__item:not(:first-child) { 
  margin-top: 12px;
}
.qualified-relations__item {
  position: relative;
  padding-left: 12px;
}
.qualified-relations__item::before, 
.qualified-relations__item::after {
  content: "";
  position: absolute;
  left: 0;
  width: 12px;
  height: 100%;
  border-left: 1px solid var(--color-primary);
}
.qualified-relations__item::before {
  top: 0;
  border-top: 1px solid var(--color-primary);
}
.qualified-relations__item::after {
  bottom: 0;
  border-bottom: 1px solid var(--color-primary);
}
.statement-row { 
  margin:.1rem 0;
}
..qualifiedList__wrapper {
  padding-left: 1em;
  list-style-type: disc;
}
.statement-row__head { 
  display:inline-block;
  font-weight:600;
}
.statement-row__value { 
  list-style: none;
} 
.property-uri__head { 
  margin-top: 0.2em;
  font-weight: bold;
}
.rank-badge { 
  margin-left:.25rem; 
  padding:.05rem .35rem; 
  border:1px solid var(--color-primary); 
  border-radius:999px; 
}
.range-dates { 
  opacity:.8; 
}
</style>

