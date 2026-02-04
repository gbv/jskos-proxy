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
  <section v-if="hasAny">
    <div class="qualified-statements-title">
      {{ $t('qualifiedStatements') }}:
    </div>
    
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

    <!-- TODO: qualified dates -->
  </section>
</template>

<style>
.qualified-statements-title {
    font-weight: 600;
}
.qualified-statements-section + .qualified-statements-section { 
    margin-top: .75rem; 
}

.jskos-vue-qstmt-list {
  padding-left: 1.5em; 
  list-style-type: disc;
}

li.jskos-vue-rank-preferred {
  list-style-type: "▴ ";
}
li.jskos-vue-rank-deprecated {
  list-style-type: "▾ ";
}

/* Tree wrapper (outer UL) */
.qstmt-tree { 
  list-style: none;
  padding: 0;
}

/* Property branch (LI) */
.qstmt-branch {
  position: relative;
  padding-left: 12px;
}
.qstmt-branch:not(:first-child) {
  margin-top: 12px; 
}
.qstmt-branch::before, 
.qstmt-branch::after {
  content: "";
  position: absolute;
  left: 0;
  width: 12px;
  height: 100%;
  border-left: 1px solid var(--color-primary); 
}
.qstmt-branch::before {
  top: 0;
  border-top: 1px solid var(--color-primary); 
}
.qstmt-branch::after {
  bottom: 0;
  border-bottom: 1px solid var(--color-primary); 
}

/* Property label */
.qstmt-prop { 
  margin-top: 0.2em; 
  font-weight: bold; 
}

/* Statement row */
.qstmt-row { 
  margin: .1rem 0; 
}

/* Tiny head label inside a row */
.qstmt-row__head { 
  display: inline-block; 
  font-weight: 600;     
}

/* Values list inside a row (UL) */
.qstmt-values {
  padding-left: 12px; 
}

/* Single value item (LI) */
.qstmt-value { 
  list-style: none; 
}

/* Date range meta */
.qstmt-meta--range { 
  opacity: .8;
}

/* Language apex */
.qstmt-lang[data-lang]::after {
  content: attr(data-lang);
  font-size: 10px;       
  vertical-align: super;
  margin-left: 2px; 
  opacity: .75;
}

/* Optional utility for literal text chunks */
.qstmt-value--text { 
  margin-right: .35rem; 
  white-space: pre-wrap; 
  word-break: break-word;
}

</style>
