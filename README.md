# Leesonmech Singapore — website

Static marketing site for **Leesonmech Singapore Pte Ltd** — stockist and distributor of
valves, pumps, instrumentation, control and safety products.

Four pages, no build step and no framework: plain HTML, CSS and JavaScript.

| Page | File |
| --- | --- |
| Home | `index.html` |
| Products | `products.html` |
| About Us | `about.html` |
| Contact | `contact.html` |

## Running it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 4391
```

Then open <http://localhost:4391>. Opening the `.html` files directly with `file://`
also mostly works, but a server is closer to production.

## Project layout

```
assets/
  css/style.css          all styling (brand colours are CSS variables at the top)
  js/main.js             loader, navigation, scroll reveals, hero motion, WhatsApp, contact form
  js/products.js         products page: category filter, search, detail popup
  js/products-data.js    the product catalogue — edit this to add or change products
  js/globe.js            interactive globe in the "Regional presence" section
  js/globe-data.js       land dots for the globe (generated; no need to edit)
  img/products/          product photos, one square JPG per product
  img/brands/            principal logos (Okumura, Speck, Circutec, Meidinger, Yasiki)
  img/bg/                page background photos
  img/valve.webp/.png    cut-out valve used in the home hero
```

## Common edits

**Phone, email, address** — these are written into each page's HTML (header menu, contact
page and footer). Search for `6795 8885` to find them.

**WhatsApp number** — set once at the top of `assets/js/main.js`:

```js
var CONFIG = {
  WHATSAPP: '6567958885',   // country code + number, digits only, must be on WhatsApp
  ...
};
```

**Products** — each entry in `assets/js/products-data.js` looks like this:

```js
{
  "slug": "yasiki-a105-ball-valve",         // unique id, used in links
  "name": "YASIKI A105 Ball Valve",
  "group": "ball",                           // category id from LM_GROUPS at the top of the file
  "families": ["valves"],                    // broad family for the About page tiles (LM_FAMILIES)
  "brand": "YASIKI",
  "origin": "Malaysia",
  "summary": "…",                            // shown on the card and in the popup
  "features": ["…"],                         // listed as spec chips in the popup
  "images": ["assets/img/products/yasiki-a105-ball-valve.jpg"]
}
```

Add the photo to `assets/img/products/` (square, white background, around 800×800 works
best) and add the entry. The category filters, counts and home page tiles update themselves.

## Contact form

The form has no back end. "Send Enquiry" opens the visitor's email app with the message
pre-filled to `leesonmech@singnet.com.sg`; "Send via WhatsApp" opens WhatsApp instead.
To collect submissions on a server, point the `<form id="enquiry-form">` in
`contact.html` at a form service and remove the submit handler in `assets/js/main.js`.

## Publishing with GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch
`main`, folder `/ (root)`. The site then serves from
`https://sgleesonmech-svg.github.io/website/`. For a custom domain, add it under
Settings → Pages and point the DNS at GitHub.

## Credits

Product photography and company copy are Leesonmech's own. Globe land data is derived
from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
