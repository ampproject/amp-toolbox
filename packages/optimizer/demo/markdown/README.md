# AMP to Markdown conversion with AMP Optimizer

AMP Optimizer supports converting Markdown to AMPHTML. A typical conversion flow would be:

```
README.md => HTML => AMP Optimizer => valid AMP
```

If markdown mode is enabled via `markdown: true`, AMP Optimizer will convert `<img>` tags into
either `amp-img` or `amp-anim` tags. All other Markdown features are
already supported by AMP. AMP Optimizer will try to resolve image
dimensions from the actual files. Images larger than 320px will automatically
get an intrinsic layout. 

Here is an image declared in markdown syntax: 

![A random image](https://unsplash.it/800/600).

You can also directly use AMP components:

  <amp-twitter width="375" 
               height="472" 
               layout="responsive" 
               data-tweetid="1182321926473162752">
  </amp-twitter>

Any missing extensions will be automatically imported.
