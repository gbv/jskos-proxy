import { createRouter, createWebHistory } from "vue-router"
import HomeView from "../views/HomeView.vue"

import config from "@/config.js"
import { routerBasePath } from "@/utils.js"

const routes = [
  {
    path: routerBasePath,
    name: "home",
    component: HomeView,
  },
  {
    path: `${routerBasePath}about`,
    name: "about",
    component: () => import("../views/AboutView.vue"),
  },
]

if (routerBasePath !== "/") {
  routes.push({
    path: "/",
    name: "root",
    component: () => import("../views/RootView.vue"),
  })
}

if (config.listing) {
  routes.push({
    path: `${routerBasePath}:voc/:id?`,
    name: "item",
    component: () => import("../views/ItemView.vue"),
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
