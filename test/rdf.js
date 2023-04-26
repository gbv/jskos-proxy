import chai from "chai"
import chaiHttp from "chai-http"
chai.use(chaiHttp)
import assert from "node:assert"

process.env.BASE = "http://example.org/"
process.env.BACKEND = "./test/items.ndjson"
const { app } = await import("../server.js")

const rdf = {
  nt: `<http://example.org/a> <http://www.w3.org/2004/02/skos/core#prefLabel> "a"@en .
`,
  turtle: `@prefix skos: <http://www.w3.org/2004/02/skos/core#>.
@prefix ex: <http://example.org/>.

ex:a skos:prefLabel "a"@en.

`,
  xml: `<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:skos="http://www.w3.org/2004/02/skos/core#">
    <rdf:Description rdf:about="http://example.org/a">
        <skos:prefLabel rdf:datatype="http://www.w3.org/1999/02/22-rdf-syntax-ns#langString" xml:lang="en">a</skos:prefLabel>
    </rdf:Description>
</rdf:RDF>
`,
}

describe("RDF serialization format via server", () => {
  for (let format in rdf) {
    it(`format=${format}`,
      () => chai.request(app)
        .get(`/a?format=${format}`)
        .buffer(true)
        .then(res => {
          assert.equal(res.status,200)
          assert.equal(res.text, rdf[format])
        }))
  }
})
