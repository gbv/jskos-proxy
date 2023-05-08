# jskos-proxy

[![License](https://img.shields.io/github/license/gbv/jskos-proxy.svg)](https://github.com/gbv/jskos-proxy/blob/master/LICENSE)
[![Test](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Serve [JSKOS] objects in multiple formats over HTTP, in particular HTML and RDF

This web service can be put in front of [JSKOS] data sources to provide RDF serializations and browseable HTML display at a common base URL.

[JSKOS]: https://gbv.github.io/jskos/jskos.html

## Table of Contents

- [Install](#install)
  - [Configuration](#configuration)
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
- `HOST` - URI host of all objects served via this proxy (default: `example.org`)
- `ROOT` - URI path of all objects served via this proxy (default: `/`)
- `BACKEND` - JSKOS API base URL or local NDJSON file
- `TITLE` - Title of the service (default `JSKOS Proxy`)
- `ROOT_LABEL` - Optional name for linking to the root (default: same as `ROOT`)
- `HOST_LABEL` - Optional name for linking to the host (default: none)

For instance:

    HOST=uri.gbv.de
    ROOT=/terminology/
    BACKEND=https://api.dante.gbv.de/

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

The proxy translates a HTTP requests to an URIs queries this URI in the backend, and returns the result in HTML or a requested RDF serialization format. The format is determined based on query parameter `format` (if given) or HTTP Accept header (otherwise). The following formats are supported:

- HTML (with embedded JSON-LD)
- JSON-LD (format `json`, `jskos` or `jsonld`)
- NTriples (format `nt` or `ntriples`)
- Turtle (format `ttl` or `turtle`)
- RDF/XML (format `rdfxml` or `xml`)

In addition format `debug` will return JSON data that is used internally to create the HTML format.

## Maintainers

- [@nichtich](https://github.com/nichtich)
- [@stefandesu](https://github.com/stefandesu)

## License

MIT © 2023- Verbundzentrale des GBV (VZG)

