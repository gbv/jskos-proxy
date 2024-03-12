<template>
  <div v-if="uri">
    <div v-if="Object.keys(item).length > 0">
      <concept-scheme-view
        v-if="jskosType=='ConceptScheme'"
        :item="item"
        :registry="registry"
        @select="selectItem" />
      <item-view
        v-else
        :item="item"
        :registry="registry"
        @select="selectItem" />
    </div>
    <div v-else>
      <!-- 404: TODO show search form to search vocabularies -->
    </div>
  </div>
  <div v-else-if="backend">
    <concept-scheme-selection
      :registry="registry"
      @select="selectItem" />
  </div>
</template>

<script setup>
import ConceptSchemeSelection from "./components/ConceptSchemeSelection.vue"
import ConceptSchemeView from "./components/ConceptSchemeView.vue"
import ItemView from "./components/ItemView.vue"
import { link } from "../lib/utils.js"
import { reactive } from "vue"
import jskos from "jskos-tools"
import { cdk } from "cocoda-sdk"

// current item
const uri = [...document.getElementsByTagName("link")].find(e => e.rel=="self")?.href
const item = reactive(JSON.parse(document.getElementById("item")?.textContent||"{}"))

// configuration
const body = document.getElementsByTagName("body")[0]
const namespace = new URL(body.dataset.namespace)
const backend = body.dataset.backend

var registry
if (backend.match(/^https?:/)) {
  // Expect JSKOS API to retrieve vocabularies and concepts
  registry = cdk.initializeRegistry({
    provider: "ConceptApi",
    status: backend+"status",
  })
}

const jskosType = jskos.guessObjectType(item)

const selectItem = item => {
  if (item.uri) {
    location.href = link(item.uri, namespace)
  }
}
</script>
