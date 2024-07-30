<script setup>
const props = defineProps({
  location: Object,
})

import "leaflet/dist/leaflet.css"
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet"

const geojsonLayerReady = (layer) => {
  layer._map?.fitBounds(layer.getBounds())
  if (props.location.type === "Point") {
    layer._map?.setZoom(15)
  }
}
</script>

<template>
  <div style="height: 300px">
    <!-- For some reason, we need zoom and center, even though we are providing bounds -->
    <l-map
      :zoom="1"
      :center="[47.2, 12]"
      :use-global-leaflet="false">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>" />
      <l-geo-json 
        :geojson="location"
        @ready="geojsonLayerReady" />
    </l-map>
  </div>
</template>
