import { computed, reactive } from "vue"
import config from "@/config.js"
import * as jskos from "jskos-tools"
import i18n from "@/i18n.js"

export const state = reactive({
  schemes: null,
  concepts: {},
  languages: ["en", "de"],
})

export const locale = computed({
  get() {
    return state.languages[0]
  },
  set(value) {
    setLocale(value)
  },
})

export function setLocale(value) {
  if (i18n.global.locale === value) {
    return
  }
  const index = state.languages.findIndex(l => l === value)
  if (index === -1) {
    console.error("Error setting locale to", value)
    return
  }
  i18n.global.locale = value
  // Adjust state.languages inline so that jskos-tools "reacts"
  state.languages.splice(0, 0, state.languages.splice(index, 1)[0])
  try {
    localStorage.setItem("locale", value)
  } catch (error) {
    console.error("Error storing locale in local storage", error)
  }
}

export const schemeFetchPromise = fetch(config.namespace.pathname, { headers: { Accept: "application/json" } }).then(res => res.json()).then(data => {
  state.schemes = data
})

export const schemes = computed(() => state.schemes)

import { cdk } from "cocoda-sdk"

export const registry = cdk.initializeRegistry({
  provider: "ConceptApi",
  // ? Does "config.backend" always have a trailing slash?
  status: `${config.backend}status`,
})

export function getConcept(concept) {
  for (const uri of jskos.getAllUris(concept)) {
    if (state.concepts[uri]) {
      return state.concepts[uri]
    }
  }
}

export function getConceptByUri(uri) {
  return getConcept({ uri })
}

const conceptProps = ["narrower", "broader", "related", "previous", "next", "ancestors", "topConcepts", "concepts", "memberList"]
const schemeProps = ["inScheme", "topConceptOf", "versionOf"]
export function saveConcept(concept, { returnIfExists = false, returnNullOnError = false } = {}) {
  if (!concept || !concept.uri) {
    if (returnNullOnError) {
      return null
    }
    throw new Error("Can't save object that is null or undefined or that doesn't have a URI.")
  }
  const existing = getConcept(concept)
  // Return immediately if object reference is the same
  if (existing === concept || existing && returnIfExists) {
    return existing
  }

  // Replace scheme props
  for (const prop of schemeProps) {
    if (concept[prop]?.length && !concept[prop].includes(null)) {
      concept[prop] = concept[prop].map(scheme => state.schemes.find(s => jskos.compare(s, scheme)) || scheme)
    }
  }

  if (existing) {
    // Update certain properties (very basic)
    for (const prop of Object.getOwnPropertyNames(concept)) {
      if (concept[prop] && (!existing[prop] || Array.isArray(existing[prop]) && existing[prop].includes(null))) {
        if (conceptProps.includes(prop)) {
          existing[prop] = saveConceptsWithOptions({ returnIfExists: true, returnNullOnError: true })(concept[prop])
        } else {
          existing[prop] = concept[prop]
        }
      }
    }
    return existing
  } else {
    for (const uri of jskos.getAllUris(concept)) {
      state.concepts[uri] = concept
    }
    // Save related concepts
    for (const prop of conceptProps) {
      if (Array.isArray(concept[prop])) {
        concept[prop] = saveConceptsWithOptions({ returnIfExists: true, returnNullOnError: true })(concept[prop])
      }
    }
    return concept
  }
}

export function saveConceptsWithOptions(options) {
  return items => items.map(item => saveConcept(item, options))
}

export async function loadConcept(uri) {
  const existing = getConceptByUri(uri)
  if (existing?._registry) {
    return existing
  }
  console.time(`loadConcept ${uri}`)
  const concept = (await registry.getConcepts({ concepts: [{ uri }] }))[0]
  console.timeEnd(`loadConcept ${uri}`)
  if (!concept) {
    throw new Error(`Error loading concept ${uri}`)
  }
  return saveConcept(concept)
}

export async function loadTop(scheme) {
  await schemeFetchPromise
  scheme = schemes.value?.find(s => jskos.compare(s, scheme))
  if (!scheme || scheme.topConcepts && !scheme.topConcepts.includes(null)) {
    return scheme?.topConcepts
  }
  console.time(`loadTop ${scheme.uri}`)
  const topConcepts = await registry.getTop({ scheme: { uri: scheme.uri } })
  topConcepts.forEach(concept => {
    concept.ancestors = []
  })
  // TODO: Maybe use saveConcepts here (because they might have additional data)
  scheme.topConcepts = jskos.sortConcepts(saveConceptsWithOptions({ returnIfExists: true })(topConcepts))
  console.timeEnd(`loadTop ${scheme.uri}`)
  return scheme.topConcepts
}

export async function loadNarrower(concept) {
  if (!concept || concept.narrower && !concept.narrower.includes(null)) {
    return concept?.narrower
  }
  console.time(`loadNarrower ${concept.uri}`)
  const narrower = await concept._getNarrower()
  concept.narrower = jskos.sortConcepts(saveConceptsWithOptions({ returnIfExists: true })(narrower))
  // Set ancestors of narrower concepts
  if (concept.ancestors && !concept.ancestors?.includes(null)) {
    concept.narrower.forEach(narrow => {
      narrow.ancestors = [concept, ...concept.ancestors]
    })
  }
  // Set broader of narrower concepts
  concept.narrower.forEach(narrow => {
    if (!narrow.broader || narrow.broader?.includes(null)) {
      narrow.broader = [concept]
    }
  })
  console.timeEnd(`loadNarrower ${concept.uri}`)
  return concept.narrower
}

export async function loadAncestors(concept) {
  if (!concept || concept.ancestors && !concept.ancestors.includes(null)) {
    return concept?.ancestors
  }
  console.time(`loadAncestors ${concept.uri}`)
  const ancestors = await concept._getAncestors()
  for (let i = 0; i < ancestors.length; i += 1) {
    ancestors[i].ancestors = ancestors.slice(i + 1)
  }
  concept.ancestors = saveConceptsWithOptions({ returnIfExists: true })(ancestors)
  // Set broader if necessary
  if (!concept.broader || concept.broader?.includes(null)) {
    concept.broader = [concept.ancestors[0]]
  }
  // Also load narrower
  await Promise.all(concept.ancestors.map(ancestor => loadNarrower(ancestor)))
  console.timeEnd(`loadAncestors ${concept.uri}`)
  // // Also load narrower in hierarchy and include this concept at the right place
  // const scheme = state.schemes?.find(s => jskos.compare(s, concept.inScheme[0]))
  // if (scheme) {
  //   await loadTop(scheme)
  //   let prev = scheme.topConcepts
  //   for (let i = 0; i < concept.ancestors.length; i += 1) {
  //     const ancestor = concept.ancestors[i]
  //     const target = prev.find(c => jskos.compare(c, ancestor))
  //     if (!target) {
  //       break
  //     }
  //     concept.ancestors[i] = target
  //     prev = await loadNarrower(target)
  //   }
  //   // Integrate current concept in direct ancestor
  //   const index = concept.ancestors[concept.ancestors.length - 1].narrower.findIndex(c => jskos.compare(c, concept))
  //   if (index !== -1) {
  //     concept.ancestors[concept.ancestors.length - 1].narrower[index] = concept
  //   }
  // }
  return concept.ancestors
}

// TODO: We probably shouldn't do it like this.
import nkostypeConcepts from "@/nkostype-concepts.json"

export const quickSelection = computed(() => config.quickSelection.map(scheme => schemes.value?.find(s => jskos.compare(s, scheme))).filter(Boolean))

export const publisherSelection = computed(() => {
  const publishers = new Set()
  schemes.value?.forEach(scheme => {
    scheme.publisher?.forEach(publisher => {
      publishers.add(publisher.uri || jskos.prefLabel(publisher))
    })
  })
  return [...publishers].sort()
})

export const typeSelection = computed(() => {
  const types = new Set()
  schemes.value?.forEach(scheme => {
    scheme.type
      .filter(t => t !== "http://www.w3.org/2004/02/skos/core#ConceptScheme")
      .map(t => nkostypeConcepts.find(c => jskos.compare(c, { uri: t })))
      .filter(Boolean)
      .forEach(type => {
        types.add(type)
      })
  })
  return [...types]
})
