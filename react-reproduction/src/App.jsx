import { useMemo, useState } from "react";
import {
  AppBar, Box, Button, Card, CardContent, Chip, Container, InputAdornment,
  MenuItem, Select, Stack, TextField, Toolbar, Typography
} from "@mui/material";

const opportunities = [
  { title: "Frontend Developer", company: "Northstar Digital", mark: "N", color: "#dfeddd", city: "Tiranë", type: "Me kohë të plotë", field: "Teknologji", pay: "1,200–1,800 €", days: 1 },
  { title: "Marketing Intern", company: "Bleta Studio", mark: "B", color: "#fae7d9", city: "Tiranë · Hibride", type: "Praktikë", field: "Marketing", pay: "Praktikë e paguar", days: 2 },
  { title: "Product Designer", company: "Forma", mark: "F", color: "#e9e3f6", city: "Remote · Shqipëri", type: "Me kohë të plotë", field: "Dizajn", pay: "1,500–2,200 €", days: 3 },
  { title: "Asistent/e Finance", company: "Arka Group", mark: "A", color: "#f3ebd6", city: "Durrës", type: "Me kohë të plotë", field: "Financë", pay: "700–950 €", days: 4 },
  { title: "People Operations Intern", company: "Kora", mark: "K", color: "#dfeef2", city: "Tiranë", type: "Praktikë", field: "Burime njerëzore", pay: "Praktikë e paguar", days: 5 },
  { title: "Sales Representative", company: "Lumo", mark: "L", color: "#e9f0d9", city: "Shkodër", type: "Me kohë të plotë", field: "Shitje", pay: "900–1,300 € + bonus", days: 7 }
];

const relativeDate = (days) => new Intl.RelativeTimeFormat("sq", { numeric: "auto" }).format(-days, "day");

export default function App() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Të gjitha");
  const [sort, setSort] = useState("newest");
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("sq");
    const result = opportunities.filter((item) => {
      const matchesText = !needle || `${item.title} ${item.company} ${item.field} ${item.city}`.toLocaleLowerCase("sq").includes(needle);
      return matchesText && (type === "Të gjitha" || item.type === type) && (!showSaved || saved.includes(item.title));
    });
    return result.sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "sq") : a.days - b.days);
  }, [query, type, sort, showSaved, saved]);

  const toggleSaved = (title) => setSaved((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title]);

  return (
    <Box>
      <Box className="react-top-note">Mundësi të reja, çdo javë <span>·</span> Hapi yt i radhës fillon këtu</Box>
      <AppBar position="sticky" color="transparent" elevation={0} className="react-appbar">
        <Container maxWidth="lg">
          <Toolbar disableGutters className="react-toolbar">
            <a href="/" className="react-brand"><span>p.</span> punaime</a>
            <Stack direction="row" spacing={3} className="react-nav"><a href="/">Punë</a><a href="#internships">Praktikat</a><a href="#career">Këshilla karriere</a></Stack>
            <Button variant="contained" href="#profile" size="small">Krijo profil ↗</Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main">
      <Box className="react-hero">
        <Container maxWidth="lg" className="react-hero-content">
          <Typography className="react-eyebrow">01 / MUNDËSI TË KURUARA</Typography>
          <Typography variant="h1">Gjej një vend<br />ku <em>rritesh.</em></Typography>
          <Typography className="react-hero-subtitle">Mundësi pune dhe praktike që përputhen me ty. Hapi yt i radhës fillon këtu.</Typography>
          <Card className="react-search-card" elevation={0}>
            <TextField fullWidth size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titulli, aftësia ose kompania" inputProps={{ "aria-label": "Kërko sipas titullit, aftësisë ose kompanisë" }} InputProps={{ startAdornment: <InputAdornment position="start">⌕</InputAdornment> }} />
            <Button variant="contained" onClick={() => document.querySelector("#opportunities")?.scrollIntoView({ behavior: "smooth" })}>Kërko mundësi →</Button>
          </Card>
          <Stack direction="row" spacing={1} className="react-popular"><Typography>Të kërkuara:</Typography>{["dizajn", "praktikë", "remote"].map((item) => <Chip key={item} label={item} size="small" onClick={() => setQuery(item)} />)}</Stack>
          <Box className="react-art" aria-hidden="true"><div className="react-art-circle"></div><div className="react-art-profile"><span>E</span><i></i><i></i><small>Profili yt, mundësi të reja</small></div><div className="react-float-card">✳ &nbsp; Një mundësi e re <b>↗</b></div><div className="react-float-note">✓ &nbsp; Hapi yt i radhës</div></Box>
        </Container>
      </Box>

      <Container maxWidth="lg" id="opportunities" className="react-listing">
        <Box className="react-section-head">
          <Box><Typography className="react-eyebrow">PANELI I MUNDËSIVE</Typography><Typography variant="h2">{filtered.length} mundësi <span>për ty</span></Typography></Box>
          <Button variant={showSaved ? "contained" : "outlined"} onClick={() => setShowSaved((value) => !value)}>♡ Të ruajturat ({saved.length})</Button>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} className="react-filters">
          <Select size="small" value={type} onChange={(event) => setType(event.target.value)} aria-label="Filtro sipas llojit"><MenuItem value="Të gjitha">Të gjitha llojet</MenuItem><MenuItem value="Me kohë të plotë">Me kohë të plotë</MenuItem><MenuItem value="Praktikë">Praktikë</MenuItem></Select>
          <Select size="small" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Rendit mundësitë"><MenuItem value="newest">Më të rejat</MenuItem><MenuItem value="title">Titulli A–Z</MenuItem></Select>
          <Typography className="react-listing-hint">Zgjidh pozicionin që përputhet me interesat e tua.</Typography>
        </Stack>
        <Box className="react-job-grid">
          {filtered.map((job) => (
            <Card key={job.title} className="react-job-card" variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box className="react-company-mark" sx={{ backgroundColor: job.color }}>{job.mark}</Box>
                  <Button aria-label={`${saved.includes(job.title) ? "Hiq" : "Ruaj"} ${job.title}`} aria-pressed={saved.includes(job.title)} className="react-save-button" onClick={() => toggleSaved(job.title)}>{saved.includes(job.title) ? "♥" : "♡"}</Button>
                </Stack>
                <Typography className="react-company">{job.company} · {relativeDate(job.days)}</Typography>
                <Typography variant="h3">{job.title}</Typography>
                <Typography className="react-location">⌖ &nbsp; {job.city}</Typography>
                <Stack direction="row" spacing={1} className="react-tags"><Chip label={job.type} size="small" /><Chip label={job.field} size="small" /></Stack>
                <Stack direction="row" justifyContent="space-between" className="react-card-bottom"><Typography>{job.pay}</Typography><Button onClick={() => { setQuery(job.title); document.querySelector("#opportunities")?.scrollIntoView({ behavior: "smooth" }); }}>Shfaq ↗</Button></Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
        {!filtered.length && <Box className="react-empty"><Typography variant="h3">Nuk gjetëm mundësi këtë herë.</Typography><Typography>Provo të ndryshosh fjalët e kërkimit ose filtrat.</Typography></Box>}
      </Container>
      </Box>

      <Box component="footer" className="react-footer"><Container maxWidth="lg"><a href="/" className="react-brand"><span>p.</span> punaime</a><Typography>Gjej mundësinë që të çon përpara.</Typography></Container></Box>
    </Box>
  );
}
