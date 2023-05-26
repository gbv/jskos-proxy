<template>
  <div v-if="registry">
    <item-list
      v-if="schemes.length"
      :items="schemes"
      :item-name-options="{ 'show-notation':false }"
      :draggable="false"
      @select="$emit('select',$event.item)" />
    <div v-else>
      <loading-indicator />
      loading vocabularies...
    </div>
  </div>
  <div v-else>
    sorry, no API available
  </div>
</template>

<script setup>
import { ref } from "vue"

const props = defineProps({ registry: Object })

defineEmits(["select"])

const schemes = ref([])

if (props.registry) {
  props.registry.getSchemes().then(vocs => schemes.value = vocs)
}
</script>
