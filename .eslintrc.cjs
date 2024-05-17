module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: [
    "gbv",
    "gbv/vue/3",
  ],
  rules: {
    "vue/require-default-prop": "off",
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
  },
}
