# Cloudflare AMP Optimizer Demo

A demo of `cloudflare-optimizer-scripts`.
All of the files in the `public` directory are served by firebase and reverse-proxied by the Cloudflare Worker.

Live demos:

- The Scenic: https://optimizer-demo.ampdev.workers.dev/the_scenic/templates/template_1_article.amp.html
- Ecommerce Site: https://optimizer-demo.ampdev.workers.dev/ecommerce/templates/landing.amp.html

Consult `wrangler.toml` and `config.json` for how this is configured.

## Developing

- Deploy to beta via `npm run beta`
- Deploy to prod via `npm run prod`
- Deploy static assets via `firebase deploy`
