<script setup>
import { computed } from "vue"
import QualifiedRelations from "./QualifiedRelations.vue"
import QualifiedLiterals from "./QualifiedLiterals.vue"

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 4 },
  labelForUri: { type: Function, default: null }, // optional label resolver
})

const hasQR = computed(() => Object.keys(props.item?.qualifiedRelations || {}).length > 0)
const hasQD = computed(() => Object.keys(props.item?.qualifiedDates || {}).length > 0)
const hasQL = computed(() => Object.keys(props.item?.qualifiedLiterals || {}).length > 0)

const visited = computed(() => [props.item?.uri].filter(Boolean))
</script>

<template>
  <section v-if="hasQR || hasQD || hasQL">
    <div class="qualified-statements-title">
      {{ $t('qualifiedStatements') }}:
    </div>
    
    <!-- Relations -->
    <section
      v-if="hasQR"
      class="qualified-statements-section"
      aria-label="Qualified relations">
      <QualifiedRelations
        :relations="item.qualifiedRelations"
        :depth="depth"
        :visited="[...visited, item.uri]" />
    </section>

    <!-- Literals -->
    <section
      v-if="hasQL"
      class="qualified-statements-section"
      aria-label="Qualified literals">
      <QualifiedLiterals
        :literals="item.qualifiedLiterals"
        :depth="depth"
        :visited="[...visited, item.uri]" />
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
