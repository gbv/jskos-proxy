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
    class="categoryButton">
    <span>
      {{ $props.name }}
    </span>
    <span>
      {{ $props.count }}
    </span>
  </RouterLink>
</template>

<style scoped>
.categoryButton {
  display: inline-block;
  position: relative;
  color: var(--color-text);
  margin: 12px 8px;
  font-weight: bold;
  border: 1px solid var(--color-text);
  border-radius: 3px;
  transition: 
    background-color 0.1s;
  display: flex;
}
.categoryButton:hover {
  background-color: var(--color-button-background);
  color: var(--color-text-on-dark);
}
.categoryButton > span:nth-of-type(2) {
  background-color: var(--color-background);
  color: var(--color-text-on-dark);
  font-weight: normal;
  border-left: 1px solid var(--color-text);
}
.categoryButton > span {
  padding: 8px;
  display: inline-block;
}
</style>
