<script setup>
import { computed, watch, onMounted } from "vue"
import { AutoLink } from "jskos-vue"
import PlaceItem from "./PlaceItem.vue"
import { schemes, loadConcept } from "@/store.js"
import { useUriResolution } from "@/composables/useUriResolution"


// Name component (allows recursion) + disable suspense
defineOptions({ name: "QualifiedRelations", suspensible: false })

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


const { fmtRange, labelForUri, prefetch, anyLoading } =
  useUriResolution({ schemesRef: schemes, loadConcept })

// True if there is at least one relation
const hasAny = computed(() => Object.keys(relations.value).length > 0)

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
  return Array.from(set)
}

watch(relations, () => prefetch(collectUris()), { immediate: true, deep: true })
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
      v-if="hasAny"
      class="qstmt-tree">
      <!-- Loop properties of qualifiedRelations (object, not array) -->
      <li
        v-for="(qualifiedList, propertyUri) in relations"
        :key="propertyUri"
        class="qstmt-branch">
        <div class="qstmt-prop">
          <AutoLink
            :href="propertyUri"
            :text="labelForUri(propertyUri)"
            :title="propertyUri" />
        </div>

        <ul class="qstmt-list">
          <li
            v-for="(statement, idx) in qualifiedList"
            :key="propertyUri + '-' + idx">
            <!-- resource -->
            <div v-if="statement.resource">
              <!-- URI -->
              <div
                v-if="statement.resource.uri"
                class="qstmt-row">
                <AutoLink
                  :href="statement.resource.uri"
                  :text="labelForUri(statement.resource.uri)"
                  :title="statement.resource.uri" />
              </div>

              <!-- types -->
              <div
                v-if="statement.resource.type?.length"
                class="qstmt-row">
                <div class="qstmt-row__head">
                  Types
                </div>:
                <ul class="qstmt-values">
                  <li
                    v-for="(type, idxType) in statement.resource.type"
                    :key="propertyUri + '-' + idxType"
                    class="qstmt-value">
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
                class="qstmt-row">
                <div class="qstmt-row__head">
                  Place
                </div>:
                <PlaceItem
                  :places="statement.resource.place"
                  :label-for-uri="labelForUri"
                  :dense="true" />
              </div>

              <!-- recurse -->
              <QualifiedRelations
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