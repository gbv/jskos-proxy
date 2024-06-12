import config from "@/config.js"

export const routerBasePath = "/" + config.namespace.pathname.replace(import.meta.env.BASE_URL, "")

export function getRouterUrl({ scheme, concept }) {
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
  return `${url}?uri=${encodeURIComponent(concept.uri)}`
}
