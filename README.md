# PunaIme

PunaIme is an Albanian-language jobs and internships website built with HTML, CSS, and JavaScript. Job listings and their categories are maintained in `src/data.js`.

## Run the main site

Open `index.html` directly, or serve the repository root with any static HTTP server. For example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. The main app has no build step or package install.

## React + MUI reproduction

`react-reproduction/` is a separate reproduction of the jobs listing page built with React, Vite, and Material UI. It is intentionally isolated from the static main app.

```sh
cd react-reproduction
npm install
npm run dev
```

## Platform setup

The repository does not include a server, database, or authentication service. Search, filters, sorting, pagination, and favorites work in the browser. Login and registration need an authentication service; profile changes do not persist after refresh, CV files are not uploaded, and the application form does not send submissions. The administration page is reserved for a future authenticated employer service.
