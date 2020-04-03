# AMP-Toolbox CLI

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-cli.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-cli)

The AMP Toolbox command line interface consists of a Node.js program called `amp` that can be run from a Windows, macOS, of UNIX-compatible command line environment. This way, AMP Toolbox can easily be integrated into a command line build process.

Supported commands:

- [curls](#curls): generate AMP cache URL(s)
- [download](#download): download the AMP runtime
- [help](#help): lists all commands
- [lint](#lint): checks document for errors
- [optimize](#optimize): runs AMP Optimizer for a given URL or file
- [runtime-version](#runtime-version): shows the current AMP runtime version [production]
- [update-cache](#update-cache) removes documents from the AMP Caches
- [version](#version): shows the current AMP Toolbox version

## Installation

Install via:

```shell
$ npm install @ampproject/toolbox-cli -g
```

## Commands

### curls

Translate a URL to AMP Cache URLs:

```shell
$ amp curls https://amp.dev
```

### download

Download a complete AMP runtime:

```shell
$ amp download
```

Supports options for specifying a custom host, version, and destination directory. See `amp help download` for the complete list.

### help

Displays the help menu, listing all available commands:

```shell
$ amp help
```

Pass a command to get more information about this specific command

```shell
$ amp help [command]
```

Example:

```shell
$ amp help update-cache
```

### lint

Runs the AMP Linter for the given URL:

```shell
$ amp lint https://amp.dev
```

### optimize

Runs AMP Optimizer for the given file or URL:

```shell
$ amp optimize https://amp.dev
```

or

```shell
$ amp optimize file.html
```

### runtime-version

Prints the current AMP version:

```shell
$ amp runtime-version
=> 011905291911450
```

Supports options for specifying a custom host or getting the canary version. See `amp help runtime-version` for the complete list.

### update-cache

Uses the [AMP update-cache API](https://developers.google.com/amp/cache/update-cache) to update documents stored in AMP Caches.

It requires the public and private keys to be generated, as [described on the documentation](https://developers.google.com/amp/cache/update-cache#rsa-keys). Only the private key is required to generate the cache invalidation URLs, but the public key must be made available to the AMP Caches, as described in the [guidelines](https://developers.google.com/amp/cache/update-cache#update-cache-guidelines).

By default, the application will look for the private key on a file called `privateKey.pem`, on the current working directory.

```shell
$ amp update-cache https://www.example.com/
```

Optionally, use the `--privateKey` parameter to specify the path for the private key.

```shell
$ amp update-cache https://www.example.com/ --privateKey /path/to/private-key.pem
```

### version

Prints the current AMP Toolbox version:
```shell
$ amp version

=> 011905291911450
```
