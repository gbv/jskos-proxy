<script setup>
defineProps({
  longitude: Number,
  latitude: Number,
})

import "leaflet/dist/leaflet.css"
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"
import { ref } from "vue"

const zoom = ref(8)
</script>

<template>
  <div style="height: 300px">
    <l-map
      ref="map"
      v-model:zoom="zoom"
      :center="[latitude, longitude]"
      :use-global-leaflet="false">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>" />
      <l-marker :lat-lng="[latitude, longitude]" />
    </l-map>
  </div>
</template>
