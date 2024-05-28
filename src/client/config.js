// eslint-disable-next-line no-undef
const config = __CONFIG__
config.namespace = new URL(config.namespace)
config.localStorageKeys = {
  locale: `jskos-proxy${config.namespace.pathname.replaceAll("/", "-")}locale`,
}

document.title = config.title

export default config
