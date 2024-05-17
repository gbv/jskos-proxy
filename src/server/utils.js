export const protocolless = url => url.toString().replace(/^[^:]+:/,"")

export const uriPath = (uri, base) => {
  if (protocolless(uri).startsWith(protocolless(base))) {
    var origin = new URL(base)
    origin.pathname = "/"
    return protocolless(uri).substr(protocolless(origin).length-1)
  } else {
    return uri
  }
}

export const link = (uri, base, format) => {
  var localUrl = uriPath(uri, base)
  const params = format ? {format} : {}

  if (localUrl === uri) {
    localUrl = (new URL(base)).pathname
    params.uri = uri
  }

  return (params.uri || params.format)
    ? localUrl + "?" + new URLSearchParams(params)
    : localUrl
}
