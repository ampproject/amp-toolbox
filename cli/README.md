# AMP-Toolbox CLI

A command line interface (CLI) for AMP-Toolbox

Supported commands:
- [update-cache](#update-cache): CLI for the [AMP update-cache](https://developers.google.com/amp/cache/update-cache).
- [version](#version): Prints the current version.
- [help](#help): Displays available commands.

## Commands

### help

Displays the help menu, listing available commands:
```
./amp-toolbox-cli help
```

It also supports help for one of the available commands:
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
A CLI for the [AMP update-cache](https://developers.google.com/amp/cache/update-cache) API.

It requires the public and private keys to be generated, as [described on the documentation](https://developers.google.com/amp/cache/update-cache#rsa-keys). 



```shell
./amp-toolbox-cli update-cache https://www.example.com/
```