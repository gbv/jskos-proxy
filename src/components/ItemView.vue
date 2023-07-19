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
  <mapping-list
    v-if="item.mappings"
    :mappings="item.mappings" />
</template>

<script setup>
import { computed } from "vue"
import ConceptSuggest from "./ConceptSuggest.vue"
import MappingList from "./MappingList.vue"

const props = defineProps({ item: Object, registry: Object })

defineEmits(["select"])

const inScheme = computed(() => (props.item?.inScheme||[])[0])
</script>

<style>
h3.inScheme {
  font-size: 1.17em;
  margin-bottom: 5px;
  font-weight: bold;
}
.inScheme:hover {
  cursor: pointer;
  background-color: var(--jskos-vue-itemList-hover-bgColor);
}
.jskos-vue-itemDetails-name {
  font-size: 1.5em !important;
  margin-top: 10px;
}
</style>
