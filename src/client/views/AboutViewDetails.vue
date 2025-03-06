<script setup>
import { onMounted } from "vue"
import { aboutDetails, fetchStatusesForRegistries } from "@/store.js"


onMounted(async () => {
  await fetchStatusesForRegistries()
})

</script>

<template>
  <div class="about-details-table-cotainer">
    <table class="table__header">
      <thead>
        <tr class="bg-gray-100">
          <th class="table__header-cell">
            {{ $t("backendDetailsTitle") }}
          </th>
          <th class="table__header-cell">
            {{ $t("backendDetailsDoc") }}
          </th>
          <th class="table__header-cell">
            {{ $t("backendDetailsVoc") }}
          </th>
        </tr>
      </thead>
      <tbody class="table__body">
        <tr
          v-for="(aboutDetail, index) in aboutDetails"
          :key="index"
          class="table__row">
          <td class="table__cell">
            {{ aboutDetail.config.title }}
          </td>
          <td class="table__cell">
            <a
              :href="aboutDetail.config.baseUrl || 'https://api.dante.gbv.de'"
              target="_blank"
              class="text-blue-600 hover:underline">
              {{ aboutDetail.config.baseUrl || 'https://api.dante.gbv.de' }}
            </a>
          </td>
          <td class="table__cell">
            {{ aboutDetail.numberOfVocabularies }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
  .table-container {
    max-width: 100%;
    overflow-x: auto;
    padding: 20px;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 18px;
    text-align: left;
    background-color: #f9f9f9;
  }

  .table__header {
    background-color: #5780C1;
    color: white;
  }

  .table__header-cell {
    padding: 12px 15px;
    border: 1px solid #ddd;
  }

  .table__body {
    background-color: #fff;
  }

  .table__row {
    color: black;
  }

  .table__row:nth-child(even) {
    background-color: #f2f2f2;
  }

  .table__cell {
    padding: 12px 15px;
    border: 1px solid #ddd;
  }

  .table__row:hover {
    background-color: #ddd;
  }
</style>
