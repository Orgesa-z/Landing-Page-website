# React jobs-listing reproduction

This folder is a standalone React reproduction of PunaIme's jobs-listing page. It uses Vite for development/build and Material UI for the interface components and theme. It is kept separate so the main static site does not depend on React or a package installation.

```sh
npm install
npm run dev
npm run build
```

The listings, search, type/sort filters, and saved jobs use in-memory illustrative data. They reset on refresh and do not connect to the main site, an API, or an account service.
