<script setup>
defineProps({
  to: String,
  name: String,
  count: Number,
})
</script>

<template>
  <RouterLink
    :to="$props.to"
    class="category-selection">
    <span>
      {{ $props.name }}
    </span>
    <span>
      {{ $props.count }}
    </span>
  </RouterLink>
</template>
