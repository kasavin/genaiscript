---
title: Containers
description: Learn how to use containers for secure and isolated execution of untrusted code with Docker in software development.
keywords: Docker, Containers, Software Development, Code Isolation, Execution Environment
sidebar:
    order: 20
---

Containers, like [Docker](https://www.docker.com/), are a way to package software and its dependencies into a standardized unit for software development. Containers are lightweight, standalone, and executable software packages that include everything needed to run an application: code, runtime, system tools, system libraries, and settings.

:::caution[Untrusted Code Execution]

If you are planning to execute code generated by an LLM, you **should** treat it as **untrusted** and use containers to isolate the execution environment.

:::

## Requirements

GenAIScript uses Docker to orchestrate the containers.

-   [Install docker](https://docs.docker.com/engine/install/)

## start a container

Start by creating and starting a new container. GenAIScript will pull the container image on demand
and will remove the container when it is no longer needed.

```js
const container = await host.container()
```

### Custom image

By default, the container uses the [python:alpine](https://hub.docker.com/_/python/) image, which provides a minimal python environment. You can change the image using the `image` option.

```js
const container = await host.container({ image: "python:slim" })
```

### Disable auto-purge

By default, the container is removed when it is no longer needed. You can disable this behavior using the `disablePurge` option.

```js
const container = await host.container({ disablePurge: true })
```

## Run a command

You can run a command in the container using the `exec` method. It returns the exit code, standard output and error streams.

```js
const { stdout } = await container.exec("python", ["--version"])
```

## Read and write files

The container has a volume mounted in the host file system, which allows to read and write files to the container.

```js
await container.writeText("hello.txt", "Hello, world!")
const content = await container.readText("hello.txt")
```
