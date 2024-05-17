import { createRouter, createWebHistory } from "vue-router"
import HomeView from "../views/HomeView.vue"

import config from "@/config.js"

const routes = [
  {
    path: config.namespace.pathname,
    name: "home",
    component: HomeView,
  },
  {
    path: `${config.namespace.pathname}about`,
    name: "about",
    component: () => import("../views/AboutView.vue"),
  },
]

if (config.namespace.pathname !== "/") {
  routes.push({
    path: "/",
    name: "root",
    component: () => import("../views/RootView.vue"),
  })
}

if (config.listing) {
  routes.push({
    path: `${config.namespace.pathname}:voc/:id?`,
    name: "item",
    component: () => import("../views/ItemView.vue"),
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
