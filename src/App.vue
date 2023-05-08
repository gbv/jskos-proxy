<template>
  <div v-if="uri">
    <div v-if="Object.keys(item).length > 0">
    <concept-scheme-view
      v-if="jskosType=='ConceptScheme'"
      :item="item"
      @select="selectItem" />
    <item-view
      v-else
      :item="item"
      @select="selectItem" />
    </div>
    <div v-else>
      <!-- 404: TODO show search form -->
    </div>
  </div>
  <div v-else-if="api">
    <concept-scheme-selection
      :api="api"
      @select="selectItem" />
  </div>
</template>

<script setup>
import ConceptSchemeSelection from "./components/ConceptSchemeSelection.vue"
import ConceptSchemeView from "./components/ConceptSchemeView.vue"
import ItemView from "./components/ItemView.vue"

import { reactive } from "vue"
import jskos from "jskos-tools"

// current item
const uri = [...document.getElementsByTagName("link")].find(e => e.rel=="self")?.href
const item = reactive(JSON.parse(document.getElementById("item")?.textContent||"{}"))

// configuration
const body = document.getElementsByTagName("body")[0]
const base = body.getAttribute("base")
const api = body.getAttribute("api")

// TODO: load more details via backend (requires cocoda-sdk and API endpoint)
const jskosType = jskos.guessObjectType(item)
if (jskosType == "ConceptScheme") {
  if (api && !item.topConcepts) { // TODO: also if last of narrower is null
    // TODO: show loadingIndicator
    fetch(`${api}voc/top?uri=${item.uri}`)
      .then(res => res.json())
      .then(items => {
        item.topConcepts = items
      })
  }
}

const selectItem = item => {
  if (item.uri) {
    const url = new URL(item.uri)
    if (`//${url.host}${url.pathname}`.startsWith(base)) {
      location.href = url.pathname
    } else {
      console.warn(`Cannot select ${item.uri}: mismatching base URI`)
    }
  }
}

// TODO: set title of HTML page (better elsewhere?)
</script>
