<script setup>
import { computed } from "vue"
import QualifiedRelations from "@/components/QualifiedRelations.vue"
import QualifiedLiterals from "@/components/QualifiedLiterals.vue"
// import QualifiedDatesBlock from "@/components/QualifiedDatesBlock.vue" 

const props = defineProps({
  item: { type: Object, required: true },
  maxDepth: { type: Number, default: 4 },
  labelForUri: { type: Function, default: null }, // optional label resolver
})

const hasQR = computed(() => !!props.item?.qualifiedRelations && Object.keys(props.item.qualifiedRelations).length > 0)
const hasQD = computed(() => !!props.item?.qualifiedDates && Object.keys(props.item.qualifiedDates).length > 0)
const hasQL = computed(() => !!props.item?.qualifiedLiterals && Object.keys(props.item.qualifiedLiterals).length > 0)
const hasAny = computed(() => hasQR.value || hasQD.value || hasQL.value)

const visitedRoot = computed(() => [props.item?.uri].filter(Boolean))
</script>

<template>
  <section class="qualified-statements__wrapper">
    <div class="qualified-statements-title">
      {{ $t('qualifiedStatements') }}
    </div>

    <div
      v-if="!hasAny"
      class="qualified-statements-empty">
      No {{ $t('qualifiedStatements') }}
    </div>

    <template v-else>
      <!-- Relations -->
      <section
        v-if="hasQR"
        class="qualified-statements-section"
        aria-label="Qualified relations">
        <QualifiedRelations
          :item="item"
          :max-depth="maxDepth"
          :visited="visitedRoot" />
      </section>

      <!-- Literals -->
      <section
        v-if="hasQL"
        class="qualified-statements-section"
        aria-label="Qualified literals">
        <QualifiedLiterals
          :literals="item.qualifiedLiterals"
          :uri="item.uri"
          :max-depth="maxDepth"
          :visited="visitedRoot" />
      </section>
    </template>
  </section>
</template>

<style scoped>
.qualified-statements__wrapper {
    padding-bottom: 12px;;
}

.qualified-statements-title {
    font-weight: 600;
    padding-bottom: 12px;
}
.qualified-statements-empty { 
    opacity: .7; 
}
.qualified-statements-section + .qualified-statements-section { 
    margin-top: .75rem; 
}
</style>
