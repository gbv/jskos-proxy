import { createI18n } from "vue-i18n"
import messages from "#/locale.json"
import config from "@/config.js"

let locale

// Try to ready locale from local storage
try {
  locale = localStorage.getItem(config.localStorageKeys.locale)
} catch (error) {
  console.warn("Error reading locale from local storage.")
}

// Determine default locale through the user's browser
if (!locale) {
  for (const lang of navigator.languages || []) {
    if (lang.startsWith("de") || lang.startsWith("en")) {
      locale = lang.slice(0, 2)
      break
    }
  }
}

export default createI18n({
  legacy: false,
  locale: locale || "en",
  fallbackLocale: "en",
  messages,
})
