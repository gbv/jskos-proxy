import "./assets/main.css"

import config from "@/config.js"

// Import custom style
import "#/config/current/style.css"

import { createApp, defineAsyncComponent } from "vue"
import App from "./App.vue"
import router from "./router"

const app = createApp(App)

app.use(router)
app.provide("config", config)
console.log(config)

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
