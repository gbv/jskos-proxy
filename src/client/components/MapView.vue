<script setup>
const props = defineProps({
  locations: Array,
})

import "leaflet/dist/leaflet.css"
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet"
import { watch } from "vue"

const initialBounds = {
  _northEast: {
    lat: -90,
    lng: -180,
  },
  _southWest: {
    lat: 90,
    lng: 180,
  },
}
let bounds, count
watch(() => props.locations, () => {
  bounds = initialBounds
  count = 0
}, { immediate: true })

const geojsonLayerReady = (layer, location) => {
  count += 1
  const layerBounds = layer.getBounds()
  // Track all locations and fit the view so that all of them are visible
  bounds._northEast.lat = Math.max(bounds._northEast.lat, layerBounds._northEast.lat)
  bounds._northEast.lng = Math.max(bounds._northEast.lng, layerBounds._northEast.lng)
  bounds._southWest.lat = Math.min(bounds._southWest.lat, layerBounds._southWest.lat)
  bounds._southWest.lng = Math.min(bounds._southWest.lng, layerBounds._southWest.lng)
  if (count >= props.locations.length) {
    layer._map?.fitBounds([
      [bounds._northEast.lat, bounds._northEast.lng],
      [bounds._southWest.lat, bounds._southWest.lng],
    ])
    // A single point gets zoom level 15 (TODO: 15 seems to far zoomed in.)
    if (count === 1 && location.type === "Point") {
      layer._map?.setZoom(15)
    }
  }
}
</script>

<template>
  <div style="height: 300px">
    <!-- Initial zoom and center will be overridden when GeoJSON layer is ready -->
    <l-map
      :zoom="1"
      :center="[47, 12]"
      :use-global-leaflet="false">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>" />
      <l-geo-json 
        v-for="(location, index) in locations"
        :key="index"
        :geojson="location"
        @ready="geojsonLayerReady($event, location)" />
    </l-map>
  </div>
</template>
