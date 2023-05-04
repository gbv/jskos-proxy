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
  <div v-if="(item.topConcepts||[]).length">
    <h4>Top Concepts</h4>
    <item-list
      :items="item.topConcepts"
      class="jskos-vue-itemDetails-narrower"
      @select="$emit('select',$event.item)" />
  </div>
</template>

<script setup>
defineProps({ item: Object })
defineEmits("select")
</script>
