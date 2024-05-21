import config from "@/config.js"

export function getRouterUrl({ scheme, concept }) {
  if (concept?.uri.startsWith(config.namespace)) {
    return `${config.namespace.pathname}${concept.uri.replace(config.namespace, "")}`
  }
  if (!scheme?.uri) {
    return config.namespace.pathname
  }
  let url
  if (scheme.uri.startsWith(config.namespace)) {
    url = `${config.namespace.pathname}${scheme.uri.replace(config.namespace, "")}`
  } else {
    url = `${config.namespace.pathname}${encodeURIComponent(scheme.uri)}/`
  }

  if (!concept?.uri) {
    return url
  }
  return `${url}?uri=${encodeURIComponent(concept.uri)}`
}
