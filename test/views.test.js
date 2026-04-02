import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"
import { ItemDetails } from "jskos-vue"
import { Tab } from "jskos-vue-tabs"

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

const item = {
  uri: "https://example.com/DT",
  notation: ["DT"],
  prefLabel: { en: "Detailed Item" },
}

describe("ItemDetails slots", () => {
  it("renders afterTabs content in flat mode", () => {
    const wrapper = mount(ItemDetails, {
      props: {
        item,
        flat: true,
      },
      slots: {
        afterTabs: "<div>AFTER TABS CONTENT</div>",
      },
      global: {
        components: { Tab },
      },
    })

    expect(wrapper.text()).toContain("AFTER TABS CONTENT")
  })

  it("does not render plain inline additionalTabs content in flat mode", () => {
    const wrapper = mount(ItemDetails, {
      props: {
        item,
        flat: true,
      },
      slots: {
        additionalTabs: "<div>ADDITIONAL TABS CONTENT</div>",
      },
      global: {
        components: { Tab },
      },
    })

    expect(wrapper.text()).not.toContain("ADDITIONAL TABS CONTENT")
  })

  it("renders additionalTabs when used as a real tab in tab mode", () => {
    const wrapper = mount(ItemDetails, {
      props: {
        item,
        flat: false,
      },
      slots: {
        additionalTabs: `
        <Tab title="Extra">
          <div>ADDITIONAL TAB CONTENT</div>
        </Tab>
      `,
      },
      global: {
        components: { Tab },
      },
    })

    expect(wrapper.text()).toContain("ADDITIONAL TAB CONTENT")
  })
})
