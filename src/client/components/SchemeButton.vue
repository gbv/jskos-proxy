<script setup>
import * as jskos from "jskos-tools"
import { getRouterUrl } from "@/utils.js"

defineProps({
  scheme: Object,
})
</script>

<template>
  <RouterLink
    class="schemeButton"
    :to="getRouterUrl({ scheme })">
    {{ jskos.prefLabel(scheme) }}
  </RouterLink>
</template>

<style scoped>
.schemeButton {
  display: inline-block;
  position: relative;
  color: var(--color-text);
  font-weight: bold;
  margin: 12px 8px;
  padding: 8px;
}
/* Partial borders */
.schemeButton::before,
.schemeButton::after {
  position: absolute;
  width: 15px;
  height: 100%;
  content: "";
  border: 1px solid black;
  transition: 
    width 0.2s;
}
.schemeButton::before {
  left: 0;
  top: 0;
  border-right: none;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}
.schemeButton::after {
  right: 0;
  bottom: 0;
  border-left: none;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}
.schemeButton:hover::before, .schemeButton:hover::after {
  width: 100%;
}
</style>
