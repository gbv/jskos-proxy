<template>
  <div v-if="Object.keys(item).length">
    <item-details
          :item="item"
          :show-tabs="false"
          :dropzone="false"
          @select="alert(`Clicked on item ${$event.item.uri}`)"
      />
    <item-details-tabs :item="item"
      />
    <!--small>{{item}}</small-->
  </div>
</template>

<script setup>
import jskos from "jskos-tools"

const item = JSON.parse(document.getElementById('item')?.textContent||'{}')

// TODO: load more details via API, if API is known
</script>

<style scoped>
</style>
