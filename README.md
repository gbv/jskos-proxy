# jskos-proxy

[![Test](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/gbv/jskos-proxy.svg)](https://github.com/gbv/jskos-proxy/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Serve [JSKOS] objects in multiple formats over HTTP, in particular HTML and RDF

This web service can be put in front of [JSKOS] data sources to provide RDF serializations and browseable HTML display of controlled vocabularies at a common base URL.

[JSKOS]: https://gbv.github.io/jskos/jskos.html

## Table of Contents

- [Install](#install)
  - [Configuration](#configuration)
  - [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Maintainers](#maintainers)
- [License](#license)

## Install

Clone from git repository.

```bash
git clone https://github.com/gbv/jskos-proxy.git
cd jskos-proxy
npm ci
```

To deploy with PM2 copy `ecosystem.example.json` to `ecosystem.config.json`.

### Configuration

Create a local file `.env` with the following keys:

- `PORT` - which port to run the service on (default: `3555`)
- `NAMESPACE` - URI namespace of all objects served via this proxy.
   Must end with a slash (default: `http://example.org/`)
- `BACKEND` - JSKOS API base URL or local NDJSON file
- `LISTING` - whether to show list of vocabularies from backend API on NAMESPACE URL (enabled by default, disable with `0` or `false`)
- `TITLE` - Title of the service (default `JSKOS Proxy`)

#### Examples

DANTE Vocabularies

    NAMESPACE=http://uri.gbv.de/terminology/
    BACKEND=https://api.dante.gbv.de/

RVK

    NAMESPACE=http://uri.gbv.de/terminology/rvk/
    BACKEND=https://coli-conc.gbv.de/rvk/api/
    LISTING=false

### Installation

For production the application should be put behind a reverse HTTP proxy, e.g.

    # Apache
    ProxyPass /terminology/ http://localhost:3555/terminology/
    ProxyPassReverse /terminology/ http://localhost:3555/terminology/

    # Nginx
    location /terminology/ {
        proxy_pass http://localhost:3555/terminology/;
    }

See file `ecosystem.example.json` for deployment with [PM2](https://pm2.keymetrics.io/).

## Usage

### Compile client-side JavaScript

```bash
npm run build
```

### Configure

See [configuration](#configuration) above.

### Run Server

```bash
# Development server with hot reload:
npm run start

# run the server in production (less verbose logging):
NODE_ENV=production node ./server.js
```

## API

The proxy translates HTTP requests to an URI query. The URI is determined from query path and configured `NAMESPACE` or given with optional query parameter `uri`.

The URI is then looked up in the backend, and returned in a requested RDF serialization format or in HTML. The format is determined based on query parameter `format` (if given) or HTTP Accept header (otherwise). The following formats are supported:

- HTML with embedded JSON-LD (default)
- JSON-LD (format `json`, `jskos` or `jsonld`)
- NTriples (format `nt` or `ntriples`)
- Turtle (format `ttl` or `turtle`)
- RDF/XML (format `rdfxml` or `xml`)

In addition format `debug` will return JSON data that is used internally to create the HTML format.

## Related works

See <https://bartoc.org/software> for a collection of software for knowledge organization systems (aka controlled vocabularies). Browsing interfaces similar to jskos-proxy are provided by [Skohub](https://github.com/skohub-io/skohub-vocabs) and [Skosmos](http://skosmos.org/), among other solutions.

## Maintainers

- [@nichtich](https://github.com/nichtich)
- [@stefandesu](https://github.com/stefandesu)

## License

MIT © 2023- Verbundzentrale des GBV (VZG)
