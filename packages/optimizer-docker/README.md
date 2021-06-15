## Introduction

[ampproject/toolbox-optimizer](https://hub.docker.com/r/ampproject/toolbox-optimizer) is a [Docker](https://www.docker.com/) container that exposes an [AMP Optimizer](https://github.com/ampproject/amp-toolbox/tree/main/packages/optimizer) server for optimizing your amphtml using the same server-side-rendering optimizations as the [Google AMP Cache](https://developers.google.com/amp/cache).

## How it works

The AMP Optimizer server accepts `POST` requests at port `3000` and requires an HTML body. It then runs the HTML through the [optimizer](https://github.com/ampproject/amp-toolbox/tree/main/packages/optimizer) package, and returns the result as the response.

## Configuration

There are two different kinds of configuration you can supply to the container:
1. Static configuration via environment variables: On startup, the container will search for environment variables prefixed with `AMP_OPTIMIZER_` and pass the values as configuration options when initializing the underlying optimizer library. The full list of options are available [here](https://github.com/ampproject/amp-toolbox/tree/main/packages/optimizer#options). Options should be specified in SCREAMING_SNAKE_CASE as opposed to camelCase. For example, in order to configure the `optimizeHeroImages` option, you would declare the environment variable named: `AMP_OPTIMIZER_OPTIMIZE_HERO_IMAGES`.
2. Per-request configuration: there are some options that can only be set on a per-request basis. For example, the `canonical` flag for specifying an AMP page's canonical link. These can be specified via query params, e.g. `/?canonical=http://example.com`.

## Monitoring

By default, the docker image gathers metrics about the NodeJS process, and the time spent on applying the transformations.

Metrics are exposed in the prometheus format on the `http://localhost:3001/metrics` endpoint.

A sample dashboard for grafana is available [here](demo/grafana-dashboard.json).
Checkout the grafana [documentation](https://grafana.com/docs/grafana/latest/dashboards/export-import/#import-dashboard) to import it.

If you want to disable it, run the container with the `AMP_OPTIMIZER_PROFILE=false` environment variable.

## Usage

### Running a basic optimizer server

```
$ docker pull ampproject/toolbox-optimizer
$ docker run -it ampproject/toolbox-optimizer
```

### More complex configurations

The `amp-toolbox-docker-optimizer` image can be layered and composed using any of the usual container orchestration tools, like [Docker Compose](https://docs.docker.com/compose/) or [Kubernetes](https://kubernetes.io/). An example of using Docker Compose is provided under the `demo` directory.

## Best Practice: Cache server-side-rendered AMPs

To achieve best performance, transformations shouldn't be applied for
every request. Instead, transformations should only be applied the *first time*
a page is requested, and the results then cached. Caching can happen on the CDN
level, on the site's internal infrastructure (e.g.: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory.
