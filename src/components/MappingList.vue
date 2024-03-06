<template>
  <h4>Mappings</h4>
  <table>
    <tr
      v-for="(mapping, i) in mappings"
      :key="i">
      <td>{{ mappingSymbol(mapping) }}</td>
      <td>
        <item-list
          :items="mapping.to.memberSet || []"
          :draggable="false"
          @select="openPage" />
      </td>
    </tr>
  </table>
</template>

<script setup>
import jskos from "jskos-tools"

// eslint-disable-next-line no-unused-vars
const props = defineProps({ mappings: Array})
const openPage = e => window.open(e.item.uri,"_blank")

const mappingSymbol = m => jskos.mappingTypeByUri(m.type[0])?.notation[0]
</script>
