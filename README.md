# jskos-proxy

> Serve JSKOS objects in multiple formats over HTTP, in particular RDF and HTML

This web service can be put in front of JSKOS data sources to provide RDF
serializations and browseable HTML display at a common base URL.

## Table of Contents

- [Install](#install)
  - [Configuration](#configuration)
- [Usage](#usage)
- [License](#license)

## Install

...

### Configuration

Create a local file `.env` with the following keys:

- `PORT` - which port to run the service on (default: `3555`)
- `HOST` - URI host of all objects served via this proxy (default: `example.org`)
- `ROOT` - URI path of all objects served via this proxy (default: `/`)
- `BACKEND` - JSKOS API base URL or local NDJSON file
- `TITLE` - Title of the service (default `JSKOS Proxy`)

For instance:

    BASE=uri.gbv.de
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

## License

MIT © 2023- Verbundzentrale des GBV (VZG)

