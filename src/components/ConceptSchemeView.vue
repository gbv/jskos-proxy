<template>
  <item-details
    :item="item"
    :show-tabs="false"
    :show-ancestors="false"
    :show-narrower="false"
    :dropzone="false"
    :draggable="false" />
  <concept-suggest
    :scheme="item"
    :registry="registry"
    @select="$emit('select', $event)" />
  <item-details-tabs
    :item="item"
    active-color="#577fbb" />
  <div v-if="(item.topConcepts||[null]).length">
    <h4>{{ $t("topConcepts") }}</h4>
    <concept-tree
      v-if="item.topConcepts?.length"
      :concepts="item.topConcepts"
      :item-list-options="{ draggable: false }"
      @open="loadNarrower"
      @select="$emit('select', $event.item)" />
    <loading-indicator v-else />
  </div>
</template>

<script setup>
import jskos from "jskos-tools"
import ConceptSuggest from "./ConceptSuggest.vue"

const props = defineProps({ item: Object, registry: Object })
defineEmits(["select"])

const loadNarrower = async (concept) => {
  if (!concept.narrower || concept.narrower.includes(null)) {
    const narrower = jskos.sortConcepts(await props.registry.getNarrower({ concept }))
    concept.narrower = narrower
  }
}
</script>
