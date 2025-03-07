# jskos-proxy

<!-- [![Test](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml/badge.svg)](https://github.com/gbv/jskos-proxy/actions/workflows/test.yml) -->
[![Status](https://coli-conc-status.fly.dev/api/badge/29/status)](https://coli-conc-status.fly.dev/status/all)
[![License](https://img.shields.io/github/license/gbv/jskos-proxy.svg)](https://github.com/gbv/jskos-proxy/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Serve [JSKOS] objects in multiple formats over HTTP, in particular HTML and RDF

This web service can be put in front of [JSKOS] (0.5.4) data sources to provide RDF serializations and browseable HTML display of controlled vocabularies at a common base URL.

[JSKOS]: https://gbv.github.io/jskos/jskos.html

## Table of Contents

- [Install](#install)
  - [Configuration](#configuration)
  - [Running](#running)
- [Usage](#usage)
- [Data flow](#data-flow)
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
- `NAMESPACE` - URI namespace of all objects served via this proxy. Must end with a slash (default: `http://example.org/`)
- `BASE` - Path under which the application will be hosted on. Must end with a slash. (Default: `/`)
  - If `NAMESPACE` is `http://example.org/some-path/`, but `http://example.org/` itself is not served by jskos-proxy, you need to set `BASE` to `/some-path/`.
- `BACKEND` - JSKOS API base URLs (seperated by `,`)
- `TITLE` - Title of the service (default `JSKOS Proxy`)
<!-- - `LOGO` - optional logo image file, must be placed in `public` directory -->
- `QUICK_SELECTION` - comma separated list of vocabulary URIs to prominently show at the start page

A **configuration directory** under `config/` can be provided with environment variable `CONFIG`. It **must** contain:

- file `config.env` with configuration keys documented above
- CSS file `style.css` (can be empty)
- a Header Vue.js component in `Header.vue` (if not necessary, please provide an empty `<template />` tag); the content will be shown *below* the header
- a Footer Vue.js component in `Footer.vue` (if not necessary, please provide an empty `<template />` tag); the content will be shown *next to* the logo in the footer (the footer is set to `display: flex;`)

The `config/` directory already contains some examples for some known terminology services. To try out one of these examples, set nothing but `CONFIG`, e.g. `CONFIG=rvk`.

### Running

For development:

```bash
npm run dev
```

Most changes should cause either the back-end or the front-end to reload automatically if necessary, but sometimes it might be required to stop and restart the dev server for changes to apply.

For production (less verbose logging, no reload), first build the Vue front-end and then start the server:

```bash
npm run build
npm run start
```

The application should be put behind a reverse HTTP proxy to serve URLs starting with configured `NAMESPACE`, e.g.

    # Apache
    ProxyPass /terminology/ http://localhost:3555/terminology/
    ProxyPassReverse /terminology/ http://localhost:3555/terminology/

    # Nginx
    location /terminology/ {
        proxy_pass http://localhost:3555/terminology/;
    }

See file `ecosystem.example.json` for deployment with [PM2](https://pm2.keymetrics.io/).

## Usage

The proxy translates HTTP requests to an URI query. The URI is determined from query path and configured `NAMESPACE` or given with optional query parameter `uri`.

The URI is then looked up in the backend, and returned in a requested RDF serialization format or in HTML. The format is determined based on query parameter `format` (if given) or HTTP Accept header (otherwise). The following formats are supported:

- HTML with embedded JSON-LD (default)
- JSON-LD (format `json`, `jskos` or `jsonld`)
- NTriples (format `nt` or `ntriples`)
- Turtle (format `ttl` or `turtle`)
- RDF/XML (format `rdfxml` or `xml`)

## Data flow

The application consists of a server and a client. Both access terminology data from backends via JSKOS API. The server can also return JSKOS converted to RDF, that's why the application is called a proxy.

~~~mermaid
graph TD
    server[**server**: express]
    client[**client**: Vue]
    backends(backends: JSKOS Server, DANTE...)
    backends -- terminologies: JSKOS API --> server
    backends -- concepts: JSKOS API --> client       
    server -- terminologies: JSKOS --> client
    server -- RDF & JSKOS --> applications(applications)
    client -- browser --> user(user)
    subgraph app [ ]
        server -- HTML+JS --> client
    end
~~~
    
## Related works

See <https://bartoc.org/software> for a collection of software for knowledge organization systems (aka controlled vocabularies). Browsing interfaces similar to jskos-proxy are provided by [Skohub](https://github.com/skohub-io/skohub-vocabs) and [Skosmos](http://skosmos.org/), among other solutions.

## Maintainers

- [@nichtich](https://github.com/nichtich)
- [@stefandesu](https://github.com/stefandesu)

## License

MIT © 2024- Verbundzentrale des GBV (VZG)
