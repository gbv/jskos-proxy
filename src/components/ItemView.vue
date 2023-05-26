<template>
  <h3
    v-if="inScheme"
    class="inScheme">
    <item-name
      :item="inScheme"
      :show-notation="false"
      @click="$emit('select',inScheme)" />
  </h3>
  <concept-suggest
    v-if="inScheme"
    :scheme="inScheme"
    :registry="registry"
    @select="$emit('select',$event)" />
  <item-list
    :items="(item.ancestors || []).filter(Boolean).reverse()"
    :draggable="false"
    class="jskos-vue-itemDetails-ancestors"
    @select="$emit('select',$event.item)" />
  <item-details
    :item="item"
    :show-tabs="false"
    :show-ancestors="false"
    :show-narrower="false"
    :dropzone="false"
    :draggable="false"
    @select="$emit('select',$event.item)" />
  <item-details-tabs
    :item="item"
    active-color="#577fbb" />
  <item-list
    :items="item.narrower || []"
    :draggable="false"
    class="jskos-vue-itemDetails-narrower"
    @select="$emit('select',$event.item)" />
</template>

<script setup>
import { computed } from "vue"
import ConceptSuggest from "./ConceptSuggest.vue"

const props = defineProps({ item: Object, registry: Object })

defineEmits(["select"])

const inScheme = computed(() => (props.item?.inScheme||[])[0])
</script>

<style>
h3.inScheme {
  font-size: 1.17em;
  margin: 0.85rem 0;
  font-weight: bold;
}
.inScheme:hover {
  cursor: pointer;
  background-color: var(--jskos-vue-itemList-hover-bgColor);
}
</style>
