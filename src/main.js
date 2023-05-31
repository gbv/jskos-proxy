import { createApp } from "vue"
import App from "./App.vue"

const app = createApp(App)

import i18n from "./i18n.js"
app.use(i18n)

import jskos from "jskos-tools"
app.config.globalProperties.jskos = jskos
jskos.languagePreference.defaults = [i18n.global.locale.value]

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
