<script setup>
import { onMounted } from "vue"
import { aboutDetails, fetchStatusesForRegistries } from "@/store.js"


onMounted(async () => {
  await fetchStatusesForRegistries()
})

</script>

<template>
  <table v-if="Object.keys(aboutDetails).length">
    <thead>
      <tr>
        <th>
          {{ $t("backendDetailsTitle") }}
        </th>
        <th>
          {{ $t("backendDetailsDoc") }}
        </th>
        <th align="right">
          {{ $t("backendDetailsVoc") }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(aboutDetail, index) in aboutDetails"
        :key="index">
        <td>
          {{ aboutDetail.config.title }}
        </td>
        <td>
          <a
            :href="aboutDetail.config.baseUrl || 'https://api.dante.gbv.de'"
            target="_blank">
            {{ aboutDetail.config.baseUrl || 'https://api.dante.gbv.de' }}
          </a>
        </td>
        <td align="right">
          {{ aboutDetail.numberOfVocabularies }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  thead {
    background-color: #5780C1;
    color: white;
  }

  th {
    padding: 12px 15px;
  }

  tbody {
    background-color: #fff;
  }

  td {
    padding: 12px 15px;
  }
</style>
