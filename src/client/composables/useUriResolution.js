// composables/useUriResolution.js
import { reactive, computed } from "vue"
import * as jskos from "jskos-tools"

export function useUriResolution({ schemesRef, loadConcept }) {
  const cache = reactive({})
  const loading = reactive({})
  const errors = reactive({})

  const shorten = (u) => {
    try {
      const x = new URL(u)
      const host = x.hostname.replace(/^www\./, "")
      const segs = x.pathname.split("/").filter(Boolean)
      const path = segs.length > 2 ? `/…/${segs.at(-1)}` : `/${segs.join("/")}`
      return (host + path).replace(/\/$/, "")
    } catch {
      return u 
    }
  }

  const fmtRange = (s, e) => (s || e) ? `${s || "…"}–${e || "…"}` : ""

  function findSchemeForUri(u) {
    const schemes = schemesRef?.value || []
    if (!schemes.length || !u) {
      return null
    }
    const candidates = schemes.filter(s => typeof s?.uri === "string" && u.startsWith(s.uri))
    if (!candidates.length) {
      return null
    }
    return candidates.sort((a, b) => b.uri.length - a.uri.length)[0]
  }

  function ensureConcept(u) {
    if (!u || cache[u] || loading[u]) {
      return
    }
    const scheme = findSchemeForUri(u)
    if (!scheme) {
      return
    }
    loading[u] = true
    loadConcept(u, scheme, false)
      .then(c => {
        cache[u] = c 
      })
      .catch(e => {
        errors[u] = e 
      })
      .finally(() => {
        loading[u] = false 
      })
  }

  function prefetch(uris) {
    uris.forEach(ensureConcept)
  }

  function labelForUri(u) {
    if (!u) {
      return ""
    }
    return cache[u] ? (jskos.prefLabel(cache[u]) || shorten(u)) : shorten(u)
  }

  const anyLoading = computed(() => Object.values(loading).some(Boolean))

  return { cache, loading, errors, shorten, fmtRange, findSchemeForUri, ensureConcept, prefetch, labelForUri, anyLoading }
}
