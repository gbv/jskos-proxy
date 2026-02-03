import { describe, it, expect, vi } from "vitest"

const mockResponse = {
  "/": [{
    uri: "http://example.org/scheme",
  }],
}

global.fetch = vi.fn((path /*, { headers } */) => {
  return Promise.resolve({
    json: () => Promise.resolve(mockResponse[path]),
  })
})

describe("HomeView", () => {
  it("should be a Vue component", async () => {
    const HomeView = (await import("@/views/HomeView.vue")).default
    expect(HomeView).toBeDefined()
    expect(typeof HomeView).toBe("object")
  })
})

describe("ItemView", () => {
  it("should be a Vue component", async () => {
    const ItemView = (await import("@/views/ItemView.vue")).default
    expect(ItemView).toBeDefined()
    expect(typeof ItemView).toBe("object")
  })
})
