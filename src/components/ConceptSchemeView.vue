<template>
  <item-details
    :item="item"
    :show-tabs="false"
    :show-ancestors="false"
    :show-narrower="false"
    :dropzone="false"
    @select="$emit('select',$event.item)" />
  <item-details-tabs
    :item="item"
    active-color="#577fbb" />
  <div v-if="(item.topConcepts||[null]).length">
    <h4>Top Concepts</h4>
    <item-list
      v-if="item.topConcepts?.length"
      :items="item.topConcepts"
      class="jskos-vue-itemDetails-narrower"
      @select="$emit('select',$event.item)" />
    <loading-indicator v-else />
  </div>
</template>

<script setup>
const props = defineProps({ item: Object, registry: Object })
defineEmits("select")

if (props.registry && !props.item?.topConcepts) {
  // FIXME: vue/no-mutating-props
  props.registry.getTop({scheme: props.item}).then(topConcepts => {
    props.item.topConcepts = topConcepts
  })
}
</script>
