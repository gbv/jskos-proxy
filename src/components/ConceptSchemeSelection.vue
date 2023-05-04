<template>
  <item-list
    v-if="schemes.length"
    :items="schemes"
    :item-name-options="{ draggable:false, 'show-notation':false }"
    @select="$emit('select',$event.item)" />
  <div v-else>
    <loading-indicator />
    loading vocabularies...
  </div>
</template>

<script setup>
import { ref } from "vue"

// TODO: use cocoda-sdk
const props = defineProps({ api: Object })

defineEmits("select")

const schemes = ref([])

// TODO: use cocoda-sdk, show loadingIndicator
fetch(`${props.api}voc`)
  .then(res => res.json())
  .then(res => {
    schemes.value = res
  })
</script>
