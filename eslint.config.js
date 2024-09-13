import gbv from "eslint-config-gbv"
import vue from "eslint-config-gbv/vue"

export default [
  ...gbv,
  ...vue,
  {
    rules: {
      "vue/require-default-prop": "off",
    },
  },
]
