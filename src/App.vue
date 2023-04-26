<template>
  <div v-if="Object.keys(item).length">
    <h3
      v-if="inScheme"
      class="inScheme">
      <item-name
        :item="inScheme"
        @click="selectItem(inScheme.uri)" />
    </h3>
    <item-list
      :items="(item.ancestors || []).filter(Boolean).reverse()"
      class="jskos-vue-itemDetails-ancestors"
      @select="selectItem($event.item.uri)" />
    <item-details
      :item="item"
      :show-tabs="false"
      :show-ancestors="false"
      :dropzone="false"
      @select="selectItem($event.item.uri)" />
    <item-details-tabs
      :item="item"
      active-color="#577fbb" />
    <!-- TODO: customize tabs, include raw JSKOS -->
    <div v-if="(item.topConcepts||[]).length">
      <h4>Top Concepts</h4>
      <item-list
        :items="item.topConcepts"
        class="jskos-vue-itemDetails-narrower"
        @select="selectItem($event.item.uri)" />
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue"
import jskos from "jskos-tools"

const item = reactive(JSON.parse(document.getElementById("item")?.textContent||"{}"))
const base = document.getElementsByTagName("body")[0]?.getAttribute("base")
const backend = document.getElementsByTagName("body")[0]?.getAttribute("backend")

// TODO: load more details via backend
const jskosType = jskos.guessObjectType(item)
if (jskosType == "ConceptScheme") {
  if (backend && !item.topConcepts) { // TODO: also if last of narrower is null
    // TODO: show loadingIndicator
    fetch(`${backend}voc/top?uri=${item.uri}`)
      .then(res => res.json())
      .then(items => {
        item.topConcepts = items
      })
  }
}

const inScheme = (item.inScheme||[])[0]
const selectItem = (url) => {
  if (url.startsWith(base)) {
    // FIXME: won't work if mounted in subdirectory
    url = "/" + url.slice(base.length)
  }
  location.href = url
}

// TODO: set title of HTML page (better elsewhere?)
</script>

<style>
h3.inScheme {
  font-size: 1.17em;
  margin: 0.85rem 0;
  font-weight: normal;
}
.inScheme:hover {
  cursor: pointer;
  background-color: var(--jskos-vue-itemList-hover-bgColor);
}
</style>
