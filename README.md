# jskos-proxy

HTTP Proxy to serve JSKOS objects in multiple formats

## Table of Contents

- [Install](#install)
  - [Configuration](#configuration)
- [Usage](#usage)
- [License](#license)

## Install

...

### Configuration

Create a local file `.env` with the following keys:

- `PORT`
- `BASE`
- `BACKEND`

For instance:

    BASE=http://uri.gbv.de/terminology/
    BACKEND=https://api.dante.gbv.de/

## Usage

### Run Server

```bash
# Development server with hot reload:
npm run start

# run the server in production (less verbose logging):
NODE_ENV=production node ./server.js
```

## License

MIT © 2023- Verbundzentrale des GBV (VZG)

