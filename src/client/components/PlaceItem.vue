<script setup>
import { AutoLink } from "jskos-vue"
import * as jskos from "jskos-tools"

const props = defineProps({
  // Array of place-like objects (prefLabel/altLabel/uri/mappings)
  places: { type: Array, default: () => [] },

  // Optional label resolver: (uri) => string
  labelForUri: { type: Function, default: null },

  // Compact spacing toggle
  dense: { type: Boolean, default: false },
})

// ----- label helpers -----
// Prefer JSKOS prefLabel, then language fallbacks, then any
function bestLabel(item) {
  if (!item) {
    return ""
  }
  try {
    const lbl = jskos.prefLabel(item)
    if (lbl) {
      return lbl
    }
  } catch(e) {
    // ignore
  }
  const pl = item.prefLabel || {}
  const prefOrder = ["en", "de", "it", "fr", "und"]
  for (const l of prefOrder) {
    const v = pl[l]
    if (!v) {
      continue
    }
    return Array.isArray(v) ? v[0] : v
  }
  const any = Object.values(pl)[0]
  return Array.isArray(any) ? any[0] : any || ""
}

// Collect alternative names; dedupe and capture length
function altNames(item) {
  const al = item?.altLabel || {}
  const vals = []
  for (const v of Object.values(al)) {
    if (Array.isArray(v)) {
      vals.push(...v)
    }
    vals.push(...v)
  }
  return [...new Set(vals)].slice(0, 8)
}


// Shorten URLs for display (host + last path segment)
function fallbackShort(u) {
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


// Final label: external resolver > bestLabel > shortened URI
function label(item) {
  if (props.labelForUri && item?.uri) {
    const external = props.labelForUri(item.uri)
    if (external) {
      return external
    }
  }
  return bestLabel(item) || (item?.uri ? fallbackShort(item.uri) : "")
}


</script>

<template>
  <ul
    class="place-list"
    :class="{ dense }">
    <li
      v-for="(place, idx) in places"
      :key="place?.uri || idx"
      class="place-item">
      <div>
        Place name:
        <span
          v-if="place?.uri"
          class="place-head">
          <AutoLink
            :href="place.uri"
            :text="label(place)"
            :title="place.uri" />
        </span>
      </div>
      <details
        v-if="altNames(place).length"
        class="alt-places__wrapper">
        <summary>Alternative places</summary>
        <span class="alt-places-list">
          <span
            v-for="(aka, j) in altNames(place)"
            :key="aka">
            {{ aka }}<span v-if="j < altNames(place).length - 1">, </span>
          </span>
        </span>
      </details>

     
      <ul class="jskos-vue-itemDetails-list">
        <li>Mappings:</li>
        <li 
          v-for="(mapping, index) in place.mappings"
          :key="index">
          <span :title="jskos.prefLabel(jskos.mappingTypeByType(mapping.type) || jskos.defaultMappingType)">
            {{ (jskos.mappingTypeByType(mapping.type) || jskos.defaultMappingType).notation[0] }}
          </span>&nbsp;<AutoLink
            v-for="c in jskos.conceptsOfMapping(mapping, 'to')"
            :key="c?.uri"
            :href="c?.uri" />
        </li>
      </ul>
    </li>
  </ul>
</template>

<style scoped>
.place-list { 
    list-style: none; 
    padding-left: 8px; 
}

.place-list.dense .place-item { 
    margin: 8px 0 8px; 
}

.place-item { 
    margin: 12px 0 8px; 
}

.place-head { 
    font-weight: 600; 
    margin-bottom: 12px; 
    word-break: break-word; 
}

</style>
