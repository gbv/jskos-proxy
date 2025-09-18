<script setup>
import { AutoLink } from "jskos-vue"
import * as jskos from "jskos-tools"
import { loadConcept} from "../store"
import { computed, reactive, watch, onMounted } from "vue"
import { schemes } from "@/store.js"

const props = defineProps({
  // { [propertyUri]: [ statements ] }
  literals: { type: Object, default: () => ({}) },

  // 
  uri: {type: String, required: false},

  // compact spacing
  dense: { type: Boolean, default: false },

  // Recursion depth control
  depth: { type: Number, default: 0 },
  maxDepth: { type: Number, default: 4 },

  // Cycle guard: prevent infinite loops by URI
  visited: { type: Array, default: () => [] },

})

const literals = computed(() => Object.entries(props.literals || {}))

// Current item URI (if any)
const uri = computed(() => props.uri || null)

// Build visited list including current
const localVisited = computed(() => {
  const cur = uri.value ? [uri.value] : []
  return [...props.visited, ...cur]
})

function shorten(u) {
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
function labelProp(u) {
  return (props.labelForUri && props.labelForUri(u)) || shorten(u)
}

// Format date range compactly
const fmtRange = (s, e) => (s || e) ? `${s || "…"}–${e || "…"}` : ""

// ---------- lightweight cache ----------
// Resolved concepts by URI
const cache = reactive({})
// Load errors by URI
const errors = reactive({})
// Loading flags by URI
const conceptLoading = reactive({})


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
  for (const [propUri, qualifiedList] of literals.value) {
    if (propUri) {
      set.add(propUri)
    }
    for (const statement of (qualifiedList || [])) {
      const types = statement?.type || []
      for (const type of types) {
        if (typeof type === "string") {
          set.add(type) 
        }
      }

      const sources = statement?.source || []
      for (const source of sources) {
        const sourceUri = source?.uri
        if (typeof sourceUri === "string") {
          set.add(sourceUri) 
        }
      }
    }
  }
  return [...set]
}

watch(literals, () => {
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

</script>

<template>
  <div
    class="qualified-literals_wrapper"
    :class="{ dense }">
    <ul
      v-if="literals.length"
      class="qualified-literals-list">
      <li
        v-for="[propertyUri, qualifiedList] in literals"
        :key="propertyUri"
        class="qualified-literals__item">
        <div class="property-uri__head">
          <AutoLink
            :href="propertyUri"
            :text="labelProp(propertyUri)"
            :title="propertyUri" />
        </div>

        <ul class="qualifiedList__wrapper">
          <li
            v-for="(statement, idx) in (qualifiedList || [])"
            :key="propertyUri + '-' + idx">
            <!-- literal value -->
            <div
              v-if="statement.literal"
              class="statement-row">
              <b>Value: </b>
              <span
                class="lang-apex"
                :data-lang="statement.literal.language ?? ''
                ">{{ statement.literal.string }}</span>
            </div>

            <!-- types -->
            <div
              v-if="statement.type?.length"
              class="statement-row">
              <div class="statement-row__head">
                Types
              </div>:
              <ul class="statement-row__value-list">
                <li
                  v-for="(type, idxType) in statement.type"
                  :key="propertyUri + '-' + idxType"
                  class="statement-row__value">
                  <AutoLink
                    :href="type"
                    :text="labelForUri(type)"
                    :title="type" />
                </li>
              </ul>
            </div>

            <!-- source -->
            <div
              v-if="statement.source?.length"
              class="statement-row">
              <div class="statement-row__head">
                Source
              </div>:
              <ul class="statement-row__value-list">
                <li
                  v-for="(sourceItem, idxSource) in statement.source"
                  :key="propertyUri + '-' + idxSource"
                  class="statement-row__value">
                  <!-- Source PrefLabel -->
                  <div
                    v-if="sourceItem.prefLabel"
                    class="statement-row">
                    <div class="statement-row__head">
                      Labels
                    </div>:

                    <span
                      v-for="(text, lang) in sourceItem.prefLabel"
                      :key="lang"
                      class="qualified-literals-value lang-apex"
                      :data-lang="lang"
                      style="margin-right:.5rem">
                      {{ Array.isArray(text) ? text[0] : text }}</span>
                  </div>


                  <!-- Source Uri -->
                  <div
                    v-if="sourceItem.uri"
                    class="statement-row">
                    <div class="statement-row__head">
                      Uri
                    </div>:
                    <AutoLink
                      :href="sourceItem.uri"
                      :text="labelForUri(sourceItem.uri)"
                      :title="sourceItem.uri" />
                  </div>
                  <!-- Source Url -->
                  <div
                    v-if="sourceItem.url"
                    class="statement-row">
                    <div class="statement-row__head">
                      Url
                    </div>:
                    <AutoLink
                      :href="sourceItem.url"
                      :text="labelForUri(sourceItem.url)"
                      :title="sourceItem.url" />
                  </div>

                  <!-- recurse -->
                  <QualifiedLiterals
                    v-if="sourceItem?.qualifiedLiterals
                      && depth < maxDepth
                      && !(sourceItem?.uri && visited.includes(sourceItem.uri))"
                    :literals="sourceItem.qualifiedLiterals"
                    :depth="depth + 1"
                    :max-depth="maxDepth"
                    :visited="localVisited" />
                </li>
              </ul>
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

    <div
      v-else
      class="qualified-literals-empty">
      No qualified literals.
    </div>
  </div>
</template>

<style scoped>
.qualified-literals_wrapper { 
    list-style: none;
    padding: 0;
 }
.qualified-literals_wrapper.dense .qualified-literals-row { 
    margin:.15rem 0; 
}
.qualified-literals-list { 
    list-style: none; 
    padding:0; 
    margin:0;
}
.qualified-literals__item {
  position: relative;
  padding-left: 12px;
  margin-bottom: 12px
}
.qualified-literals__item::before, 
.qualified-literals__item::after {
  content: "";
  position: absolute;
  left: 0;
  width: 12px;
  height: 100%;
  border-left: 1px solid var(--color-primary);
}
.qualified-literals__item::before {
  top: 0;
  border-top: 1px solid var(--color-primary);
}
.qualified-literals__item::after {
  bottom: 0;
  border-bottom: 1px solid var(--color-primary);
}
.property-uri__head{ 
  margin-top: 0.2em;
  font-weight: bold;
}
.statement-row { 
    margin:.1rem 0;
}
.lang-apex[data-lang]::after{
  content: attr(data-lang);
  font-size: 10px;
  vertical-align: super;
  margin-left: 2px;
  opacity: .75;
}
.statement-row__head { 
    display: inline-block;
    font-weight: 600;
}
.statement-row__value { 
  list-style: none;
}
.statement-row__value-list {
  padding-left: 8px;
}
.rank-badge { 
  margin-left:.25rem; 
  padding:.05rem .35rem; 
  border:1px solid var(--color-primary); 
  border-radius:999px; 
}
.qualified-literals-value { 
  margin-right:.35rem; 
  white-space:pre-wrap; 
  word-break:break-word 
}
.range-dates { 
  opacity:.8; 
}
.qualified-literals-empty { 
  opacity:.7; 
  font-size:.9em 
}
</style>
