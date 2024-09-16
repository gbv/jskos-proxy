import config from "@/config.js"

export const routerBasePath = "/" + config.namespace.pathname.replace(import.meta.env.BASE_URL, "")

export function getRouterUrl({ scheme, concept, params = {} }) {
  if (!scheme && concept?.inScheme?.[0]) {
    scheme = concept.inScheme[0]
  }
  let url = (() => {
    if (concept?.uri.startsWith(config.namespace) && (!scheme?.uri || concept?.uri.startsWith(scheme?.uri))) {
      return `${routerBasePath}${concept.uri.replace(config.namespace, "")}`
    }
    if (!scheme?.uri) {
      return routerBasePath
    }
    let url
    if (scheme.uri.startsWith(config.namespace)) {
      url = `${routerBasePath}${scheme.uri.replace(config.namespace, "")}`
    } else {
      url = `${routerBasePath}${encodeURIComponent(scheme.uri)}/`
    }
  
    if (!concept?.uri) {
      return url
    }
    params.uri = concept.uri
    return url
  })()
  // Add params
  let connector = "?"
  for (const [key, value] of Object.entries(params)) {
    url += `${connector}${key}=${encodeURIComponent(value)}`
    connector = "&"
  }
  return url
}
