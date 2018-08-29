# AMP-Toolbox CLI

The AMP Toolbox command line interface consists of a Node.js program called `amp-toolbox-cli` that can be run from a Windows, macOS, of UNIX-compatible command line environment. This way, AMP Toolbox can easily be integrated into a command line build process.

Supported commands:

- [update-cache](#update-cache): updates documents stored in [AMP Caches](https://developers.google.com/amp/cache/update-cache).
- [version](#version): prints the current `amp-toolbox-cli` version.
- [help](#help): displays available commands.

## Commands

### help

Displays the help menu, listing all available commands:

```
./amp-toolbox-cli help
```

Pass a command to get more information about this specific command

```
./amp-toolbox-cli help [command]
```

Example:

```shell
./amp-toolbox help update-cache
```

### version

Prints the current version

Example:
```shell
./amp-toolbox version
```

### update-cache

Uses the [AMP update-cache API](https://developers.google.com/amp/cache/update-cache) to update documents stored in AMP Caches.

It requires the public and private keys to be generated, as [described on the documentation](https://developers.google.com/amp/cache/update-cache#rsa-keys).

By default, the application will look for the private key on a file called `privateKey.pem`, on the current working directory.

```shell
./amp-toolbox-cli update-cache https://www.example.com/
```

Optionally, use the `--privateKey` parameter to specify the path for the private key.

```shell
./amp-toolbox-cli update-cache https://www.example.com/ --privateKey /path/to/private-key.pem
```
