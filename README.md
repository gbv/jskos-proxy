# jskos-proxy

[![Test](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/gbv/jskos-proxy.svg)](https://github.com/gbv/jskos-proxy/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Serve [JSKOS] objects in multiple formats over HTTP, in particular HTML and RDF

This web service can be put in front of [JSKOS] data sources to provide RDF serializations and browseable HTML display of controlled vocabularies at a common base URL.

[JSKOS]: https://gbv.github.io/jskos/jskos.html

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Install](#install)
  - [Configuration](#configuration)
  - [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Related works](#related-works)
- [Maintainers](#maintainers)
- [License](#license)

## Install

Clone from git repository.

```bash
git clone https://github.com/gbv/jskos-proxy.git
cd jskos-proxy
npm ci
```

### Configuration

Instances of jskos-proxy are configured with environment variables, in local file `.env`, and files in an optional configuration directory. The following keys are supported:

- `PORT` - which port to run the service on (default: `3555`)
- `HMR_PORT` - port for Vite hot module reloading in development (default: `3556`)
- `NAMESPACE` - URI namespace of all objects served via this proxy. Must end with a slash (default: `http://example.org/`)
- `BACKEND` - JSKOS API base URL or local NDJSON file
- `LISTING` - whether to show list of vocabularies from backend API on NAMESPACE URL (enabled by default, disable with `0` or `false`)
- `TITLE` - Title of the service (default `JSKOS Proxy`)

A **configuration directory** can set with environment variable `CONFIG` (default: `config`). It may contain:

- file `config.env` with configuration keys documented above
- directory `views` with [EJS templates](https://ejs.co/) to override default templates in directory `views`

Directory `examples` contains configuration directories for some known terminology services. To try out one of these example, set nothing but `CONFIG`, e.g. `CONFIG=examples/rvk`.

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

For production (less verbose logging, no reload), first build the Vue front-end and then start the server:

```bash
npm run build
npm run start
```

For development with Vite:

```bash
npm run dev
```

Changes to the server (i.e. in `server.js`, files in `lib/`, or configuration in `.env`) will reload the server, but not the front-end. In that case, the front-end needs to be manually reloaded. Changes in `src/` will only reload the front-end.


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
