<template>
  <item-suggest
    :search="search"
    @select="$emit('select', $event)" />
</template>

<script setup>
const props = defineProps({ scheme: Object, registry: Object })
defineEmits(["select"])

const search = async (query) => {
  return await props.registry.suggest({ search: query, scheme: props.scheme })
}
</script>
