# toolbox-optimizer-cheerio-demo

This example demonstrates the use of
[Cheerio](https://github.com/cheeriojs/cheerio) to apply jQuery-like
transformations to a DOM, as an alternative to the
[domutils](https://github.com/fb55/domutils)-style transformations of the
built-in transformers.

Usage:

```sh
node index.js example.html
```

The output is transformed by some of built-in transformers, and the
`CheerioTransformer` is used to: (1) prepend "Optimized" to the `<title>`; and (2)
enable the `amp-fx-parallax` experiment.
