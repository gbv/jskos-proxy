<script setup>
import { computed, watch, onMounted } from "vue"
import { AutoLink } from "jskos-vue"
import { schemes, loadConcept } from "@/store.js"
import { useUriResolution } from "@/composables/useUriResolution"

const props = defineProps({
  // { [propertyUri]: [ statements ] }
  literals: { type: Object, default: () => ({}) },

  // 
  uri: {type: String, required: false},

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

const { fmtRange, labelForUri: lfDefault, prefetch, anyLoading } =
  useUriResolution({ schemesRef: schemes, loadConcept })


function labelProp(u) {
  return (props.labelForUri && props.labelForUri(u)) || lfDefault(u)
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
  return Array.from(set)
}

watch(literals, () => prefetch(collectUris()), { immediate: true, deep: true })
onMounted(() => prefetch(collectUris()))

</script>

<template>
  <!-- 1) Show ONLY the loader when loading -->
  <div
    v-if="anyLoading"
    class="loading">
    <loading-indicator size="xl" />
  </div>

  <!-- 2) When not loading, render the rest -->
  <template v-else>
    <ul
      v-if="literals.length"
      class="qstmt-tree">
      <!-- Loop properties of qualifiedRelations (object, not array) -->
      <li
        v-for="[propertyUri, qualifiedList] in literals"
        :key="propertyUri"
        class="qstmt-branch">
        <div class="qstmt-prop">
          <AutoLink
            :href="propertyUri"
            :text="labelProp(propertyUri)"
            :title="propertyUri" />
        </div>

        <ul class="qstmt-list">
          <li
            v-for="(statement, idx) in qualifiedList"
            :key="propertyUri + '-' + idx">
            <!-- literal value -->
            <div
              v-if="statement.literal"
              class="qstmt-row">
              <span
                class="qstmt-lang"
                :data-lang="statement.literal.language ?? ''
                ">{{ statement.literal.string }}</span>
            </div>

            <!-- types -->
            <div
              v-if="statement.type?.length"
              class="qstmt-row">
              <div class="qstmt-row__head">
                Types
              </div>:
              <ul class="qstmt-values">
                <li
                  v-for="(type, idxType) in statement.type"
                  :key="propertyUri + '-' + idxType"
                  class="qstmt-value">
                  <AutoLink
                    :href="type"
                    :text="labelProp(type)"
                    :title="type" />
                </li>
              </ul>
            </div>

            <!-- source -->
            <div
              v-if="statement.source?.length"
              class="qstmt-row">
              <div class="qstmt-row__head">
                Source
              </div>:
              <ul class="qstmt-values">
                <li
                  v-for="(sourceItem, idxSource) in statement.source"
                  :key="propertyUri + '-' + idxSource"
                  class="qstmt-value">
                  <!-- Source PrefLabel -->
                  <div
                    v-if="sourceItem.prefLabel"
                    class="qstmt-row">
                    <div class="qstmt-row__head">
                      Labels
                    </div>:

                    <span
                      v-for="(text, lang) in sourceItem.prefLabel"
                      :key="lang"
                      class="qstmt-value--text qstmt-lang"
                      :data-lang="lang"
                      style="margin-right:.5rem">
                      {{ Array.isArray(text) ? text[0] : text }}</span>
                  </div>


                  <!-- Source Uri -->
                  <div
                    v-if="sourceItem.uri"
                    class="qstmt-row">
                    <div class="qstmt-row__head">
                      Uri
                    </div>:
                    <AutoLink
                      :href="sourceItem.uri"
                      :text="labelProp(sourceItem.uri)"
                      :title="sourceItem.uri" />
                  </div>
                  <!-- Source Url -->
                  <div
                    v-if="sourceItem.url"
                    class="qstmt-row">
                    <div class="qstmt-row__head">
                      Url
                    </div>:
                    <AutoLink
                      :href="sourceItem.url"
                      :text="labelProp(sourceItem.url)"
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
              class="qstmt-badge--rank">
              Rank: {{ statement.rank }}
            </small>
            <small
              v-if="statement.startDate || statement.endDate"
              class="qstmt-meta--range">
              · {{ fmtRange(statement.startDate, statement.endDate) }}
            </small>
          </li>
        </ul>
      </li>
    </ul>
  </template>
</template>
