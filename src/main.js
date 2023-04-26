import { createApp } from "vue"
import App from "./App.vue"

const app = createApp(App)

import jskos from "jskos-tools"
app.config.globalProperties.jskos = jskos

import "jskos-vue/dist/style.css"
import { ItemName, ItemDetails, ItemDetailsTabs, ItemList, AutoLink, LoadingIndicator } from "jskos-vue"
app.use(ItemName)
app.use(ItemList)
app.use(ItemDetails)
app.use(ItemDetailsTabs)
app.use(AutoLink)
app.use(LoadingIndicator)

app.mount("#app")
