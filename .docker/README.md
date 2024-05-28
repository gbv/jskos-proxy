# [JSKOS Proxy](https://github.com/gbv/jskos-proxy) (Docker)

Serve [JSKOS] objects in multiple formats over HTTP, in particular HTML and RDF It is part of a larger infrastructure of [Project coli-conc](https://coli-conc.gbv.de).

- See [GitHub](https://github.com/gbv/jskos-proxy) for more information about the tool.

## Supported Architectures
Currently, only `x86-64` is supported.

## Available Tags
- The current release version is available under `latest`. However, new major versions might break compatibility of the previously used config file, therefore it is recommended to use a version tag instead.
- We follow SemVer for versioning the application. Therefore, `x` offers the latest image for the major version x, `x.y` offers the latest image for the minor version x.y, and `x.y.z` offers the image for a specific patch version x.y.z.
- Additionally, the latest development version is available under `dev`.

## Usage
It is recommended to run the image using [Docker Compose](https://docs.docker.com/compose/). Note that depending on your system, it might be necessary to use `sudo docker compose`. For older Docker versions, use `docker-compose` instead of `docker compose`.

1. Create `docker-compose.yml`:

```yml
services:
  jskos-proxy:
    image: ghcr.io/gbv/jskos-proxy
    environment:
      - CONFIG=uri.gbv.de
    ports:
      - 3555:3555
    restart: unless-stopped
```

2. Build frontend:

This is necessary if anything is configured differently from the default (in particular `CONFIG` and `BASE`). We will try to improve this so that this will be done automatically in the background.

```bash
docker compose exec -it jskos-proxy npm run build
```

3. Start the application:

```bash
docker compose up -d
```

This will create and start a jskos-proxy container running under host (and guest) port 3555. See [Configuration](#configuration) on how to configure it.

You can now access the application under `http://localhost:3555`.

## Application Setup
After changing `docker-compose.yml` (e.g. adjusting environment variables), it is necessary to recreate the container to apply changes: `docker compose up -d`

### Configuration
You can use environment variables via `environment` to configure jskos-proxy. Please refer to the [main documentation](../README.md#configuration) for more information and all available options. (Note that paths are always **inside** the container and if you need additional files for the frontend, they will need to be mounted into the container as well.)

[JSKOS]: https://gbv.github.io/jskos/jskos.html
