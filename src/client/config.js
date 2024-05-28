// eslint-disable-next-line no-undef
const config = __CONFIG__
config.namespace = new URL(config.namespace)

document.title = config.title

export default config
