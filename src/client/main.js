import "./assets/main.css"

import config from "@/config.js"

// Import custom style
import "#/config/_current/style.css"

import { createApp, defineAsyncComponent } from "vue"
import App from "./App.vue"
import router from "./router.js"

const app = createApp(App)

app.use(router)
app.provide("config", config)

// Custom components
for (const name of ["TheHeader", "TheFooter"]) {
  app.component(name, defineAsyncComponent(async () => {
    try {
      return await import(`#/config/${config.configDir}/${name}.vue`)
    } catch (error) {
      return await import(`@/components/${name}.vue`)
    }
  }))
}

import { state, setLocale } from "@/store.js"

import i18n from "@/i18n.js"
app.use(i18n)
setLocale(i18n.global.locale.value)

import jskos from "jskos-tools"
app.config.globalProperties.jskos = jskos
jskos.languagePreference.store = state
jskos.languagePreference.path = "languages"
jskos.languagePreference.defaults = i18n.global.availableLocales

// jskos-vue
import "jskos-vue/dist/style.css"
import { ItemName, ItemDetails, ItemDetailsTabs, ItemList, ItemSuggest, ConceptTree, AutoLink, LoadingIndicator } from "jskos-vue"
app.use(ItemName)
app.use(ItemList)
app.use(ItemDetails)
app.use(ItemDetailsTabs)
app.use(ItemSuggest)
app.use(ConceptTree)
app.use(AutoLink)
app.use(LoadingIndicator)

app.mount("#app")
