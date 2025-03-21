<script setup>
import CustomFooter from "#/config/_current/Footer.vue"

const props = defineProps({
  logoPath: {
    type: String,
    required: true,
  },
})


</script>

<template>
  <img
    alt="Logo"
    class="logo"
    :src="props.logoPath">
  <CustomFooter />
</template>
