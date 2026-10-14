(() => {
  const { jobs, categories, applications } = window.PUNA_DATA;
  const app = document.querySelector("#app");
  const PAGE_SIZE = 6;
  const state = {
    favorites: new Set(),
    visibleJobs: PAGE_SIZE,
    notice: "",
    profile: {},
    statusFilter: "Të gjitha",
    listFilters: { category: "", type: "", location: "", sort: "newest", savedOnly: false, search: "" }
  };
  let lastRenderedHash = null;

  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const route = () => {
    const [path, query = ""] = (window.location.hash.slice(1) || "/").split("?");
    return { path: path || "/", params: new URLSearchParams(query) };
  };

  const navigate = (path) => {
    window.location.hash = path.startsWith("#") ? path.slice(1) : path;
  };

  const relativeDate = (dateString) => {
    const delta = new Date(dateString).getTime() - Date.now();
    const days = Math.round(delta / 86400000);
    if (Math.abs(days) < 1) {
      const hours = Math.round(delta / 3600000);
      return new Intl.RelativeTimeFormat("sq", { numeric: "auto" }).format(hours, "hour");
    }
    return new Intl.RelativeTimeFormat("sq", { numeric: "auto" }).format(days, "day");
  };

  const jobById = (id) => jobs.find((job) => job.id === id);

  const logo = (job, extra = "") => `
    <span class="company-logo logo-${escapeHTML(job.color)} ${extra}" aria-hidden="true">${escapeHTML(job.logo)}</span>`;

  const header = (activePath) => `
    <a class="skip-link" href="#main-content">Kalo te përmbajtja</a>
    <div class="top-note"><span class="note-dot"></span> Mundësi të reja, çdo javë <span class="top-note-separator">·</span> <a href="#/jobs">Shiko çfarë ka të re <span aria-hidden="true">↗</span></a></div>
    <header class="site-header">
      <div class="container header-inner">
        <a class="brand" href="#/" aria-label="PunaIme, faqja kryesore"><span class="brand-mark">p.</span><span>puna<span class="brand-light">ime</span></span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation"><span class="sr-only">Hap menynë</span><span></span><span></span></button>
        <nav id="primary-navigation" class="primary-nav" aria-label="Navigimi kryesor">
          <a class="${activePath === "/jobs" ? "active" : ""}" href="#/jobs">Punë</a>
          <a class="${activePath === "/jobs" && route().params.get("type") === "Praktikë" ? "active" : ""}" href="#/jobs?type=Praktikë">Praktika</a>
          <a href="#/resources">Këshilla karriere</a>
        </nav>
        <div class="header-actions">
          <a class="header-login" href="#/login?return=%2Fprofile">Hyr</a>
          <a class="button button-small button-dark" href="#/register">Krijo profil <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </header>`;

  const footer = () => `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand-block">
          <a class="brand brand-footer" href="#/"><span class="brand-mark">p.</span><span>puna<span class="brand-light">ime</span></span></a>
          <p>Hapi yt i radhës meriton një vend të mirë për të nisur.</p>
          <span class="footer-motto">Punë dhe praktika për hapin tënd të radhës.</span>
        </div>
        <div><h2>Eksploro</h2><a href="#/jobs">Të gjitha punët</a><a href="#/jobs?type=Praktikë">Praktikat</a><a href="#/resources">Këshilla karriere</a></div>
        <div><h2>Për ty</h2><a href="#/profile">Profili dhe CV-ja</a><a href="#/applications">Aplikimet e mia</a><a href="#/register">Krijo profil</a></div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} PunaIme · Të gjitha të drejtat e rezervuara.</span><a href="#/admin">Administrimi</a><span>Zgjedh mundësinë që të çon përpara.</span></div>
      </div>
    </footer>`;

  const noticeBanner = () => state.notice
    ? `<div class="notice-banner" role="status"><span aria-hidden="true">✓</span> ${escapeHTML(state.notice)}<button type="button" class="notice-close" data-action="dismiss-notice" aria-label="Mbyll njoftimin">×</button></div>`
    : "";

  const jobCard = (job) => `
    <article class="job-card">
      <div class="job-card-top">${logo(job)}
        <button class="favorite-button ${state.favorites.has(job.id) ? "is-saved" : ""}" type="button" data-action="favorite" data-id="${escapeHTML(job.id)}" aria-label="${state.favorites.has(job.id) ? "Hiq nga" : "Shto te"} të ruajturat: ${escapeHTML(job.title)}" aria-pressed="${state.favorites.has(job.id)}"><span aria-hidden="true">${state.favorites.has(job.id) ? "♥" : "♡"}</span></button>
      </div>
      <div class="job-company">${escapeHTML(job.company)} <span>· ${escapeHTML(relativeDate(job.publishedAt))}</span></div>
      <h3><a href="#/jobs/${escapeHTML(job.id)}">${escapeHTML(job.title)}</a></h3>
      <p class="job-location"><span aria-hidden="true">⌖</span> ${escapeHTML(job.location)}</p>
      <div class="job-tags"><span>${escapeHTML(job.type)}</span><span>${escapeHTML(job.category)}</span></div>
      <div class="job-card-bottom"><span class="job-salary">${escapeHTML(job.salary)}</span><a class="text-link" href="#/jobs/${escapeHTML(job.id)}" aria-label="Shiko detajet e ${escapeHTML(job.title)}">Detajet <span aria-hidden="true">↗</span></a></div>
    </article>`;

  const searchForm = (value = "", location = "") => `
    <form class="search-bar" data-form="job-search" role="search">
      <label class="search-field"><span aria-hidden="true">⌕</span><span class="sr-only">Titulli, aftësia ose kompania</span><input name="q" value="${escapeHTML(value)}" placeholder="Titulli, aftësia ose kompania" autocomplete="off"></label>
      <label class="search-field search-location"><span aria-hidden="true">⌖</span><span class="sr-only">Qyteti ose remote</span><input name="location" value="${escapeHTML(location)}" placeholder="Qyteti ose remote"></label>
      <button class="button button-dark" type="submit">Kërko mundësi <span aria-hidden="true">→</span></button>
    </form>`;

  const homePage = () => `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-line"></span> NJË HAP MË AFËR ASAJ QË DO</div>
          <h1>Puna e duhur<br>të <em>gjen</em> kur je gati.</h1>
          <p class="hero-description">Mundësi pune dhe praktike që përputhen me ty. Pa zhurmë, pa humbur kohë — vetëm hapi yt i radhës.</p>
          ${searchForm()}
          <p class="popular-searches"><span>Të kërkuara:</span> <a href="#/jobs?q=dizajn">dizajn</a><a href="#/jobs?type=Praktikë">praktikë</a><a href="#/jobs?q=remote">remote</a></p>
          <div class="hero-proof"><span class="hero-proof-icon" aria-hidden="true">✳</span><span><strong>9 mundësi</strong> për t’u eksploruar</span></div>
        </div>
        <div class="hero-art" aria-label="Ilustrim i një kandidati që kërkon mundësi">
          <div class="art-sun"></div><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
          <div class="art-profile"><div class="art-profile-head">E</div><span class="art-profile-line line-wide"></span><span class="art-profile-line"></span><span class="art-profile-label">Profili yt, mundësi të reja</span></div>
          <div class="art-card art-card-top"><span class="art-card-icon">✳</span><span><strong>Një mundësi e re</strong><small>që përputhet me ty</small></span><span class="art-arrow">↗</span></div>
          <div class="art-card art-card-bottom"><span class="art-check">✓</span><span><strong>Hapi yt i radhës</strong><small>fillon sot</small></span></div>
          <span class="art-spark spark-a">✳</span><span class="art-spark spark-b">✦</span><span class="art-caption">Nis nga ajo që të frymëzon.</span>
        </div>
      </div>
      <div class="container hero-meta"><span>01 <i></i> MUNDËSI TË KURUARA</span><span>Gjej ritmin tënd <span aria-hidden="true">↓</span></span></div>
    </section>
    <section class="section jobs-preview" aria-labelledby="latest-heading">
      <div class="container">
        <div class="section-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> VENDI I MIRË PËR TË FILLUAR</div><h2 id="latest-heading">Mundësi të reja,<br><em>hapa të rinj.</em></h2></div><a class="text-link text-link-large" href="#/jobs">Shiko të gjitha <span aria-hidden="true">↗</span></a></div>
        <div class="job-grid">${jobs.slice(0, 3).map(jobCard).join("")}</div>
      </div>
    </section>
    <section class="section categories-section" aria-labelledby="categories-heading">
      <div class="container">
        <div class="section-heading section-heading-compact"><div><div class="eyebrow"><span class="eyebrow-line"></span> ÇFARË TË PËLQEN?</div><h2 id="categories-heading">Nis nga <em>interesi yt.</em></h2></div><a class="text-link" href="#/jobs">Të gjitha kategoritë <span aria-hidden="true">↗</span></a></div>
        <div class="category-grid">${categories.map((category) => `<a class="category-card" href="#/jobs?category=${encodeURIComponent(category.name)}"><span class="category-icon" aria-hidden="true">${category.icon}</span><span class="category-name">${escapeHTML(category.name)}</span><span class="category-count">${category.count} mundësi <span aria-hidden="true">↗</span></span></a>`).join("")}</div>
      </div>
    </section>
    <section class="section how-section" aria-labelledby="how-heading">
      <div class="container how-layout">
        <div class="how-intro"><div class="eyebrow"><span class="eyebrow-line"></span> MË E THJESHTË SE MENDON</div><h2 id="how-heading">Tre hapa.<br><em>Mundësi të reja.</em></h2><p>Një fillim i mirë nuk duhet të jetë i ndërlikuar. Përgatitu, eksploro dhe bëj hapin e parë.</p><a class="button button-dark" href="#/register">Fillo profilin tënd <span aria-hidden="true">→</span></a></div>
        <div class="steps">
          <article class="step"><span class="step-number">01</span><div><h3>Trego kush je</h3><p>Krijo profilin dhe përgatit një CV që tregon më të mirën tënde.</p><a href="#/profile">Përgatit profilin <span aria-hidden="true">↗</span></a></div><span class="step-symbol" aria-hidden="true">◎</span></article>
          <article class="step"><span class="step-number">02</span><div><h3>Gjej çfarë të përshtatet</h3><p>Filtro mundësitë sipas interesit, vendndodhjes dhe mënyrës së punës.</p><a href="#/jobs">Eksploro mundësitë <span aria-hidden="true">↗</span></a></div><span class="step-symbol" aria-hidden="true">⌕</span></article>
          <article class="step"><span class="step-number">03</span><div><h3>Bëj hapin tënd</h3><p>Apliko me vetëbesim dhe ndiq ecurinë e aplikimeve në një vend.</p><a href="#/applications">Ndiq aplikimet <span aria-hidden="true">↗</span></a></div><span class="step-symbol" aria-hidden="true">↗</span></article>
        </div>
      </div>
    </section>
    <section class="section resources-section" id="resources" aria-labelledby="resources-heading">
      <div class="container">
        <div class="section-heading section-heading-compact"><div><div class="eyebrow"><span class="eyebrow-line"></span> PAK MË SHUMË BESIM</div><h2 id="resources-heading">Përgatitu për <em>hapin tjetër.</em></h2></div></div>
        <div class="resource-grid">
          <a class="resource-card resource-mint" href="#/profile"><span class="resource-number">01 / PROFILI</span><span class="resource-art" aria-hidden="true">↗</span><h3>CV që tregon<br>historinë tënde.</h3><span class="resource-link">Përgatit profilin <span aria-hidden="true">↗</span></span></a>
          <a class="resource-card resource-yellow" href="#/jobs?type=Praktikë"><span class="resource-number">02 / FILLIMI</span><span class="resource-art" aria-hidden="true">✳</span><h3>Një praktikë e mirë<br>ndryshon gjithçka.</h3><span class="resource-link">Eksploro praktikat <span aria-hidden="true">↗</span></span></a>
          <a class="resource-card resource-lilac" href="#/applications"><span class="resource-number">03 / RRUGËTIMI</span><span class="resource-art" aria-hidden="true">◎</span><h3>Çdo hap i vogël<br>të çon përpara.</h3><span class="resource-link">Shiko aplikimet <span aria-hidden="true">↗</span></span></a>
        </div>
      </div>
    </section>
    <section class="closing-cta"><div class="container closing-cta-inner"><div><span class="eyebrow eyebrow-light">KOHA JOTE ËSHTË TANI</span><h2>Hapi i parë mund<br>të jetë edhe <em>i vogël.</em></h2></div><a class="button button-lime" href="#/jobs">Gjej mundësinë tënde <span aria-hidden="true">→</span></a><span class="cta-decoration" aria-hidden="true">✳</span></div></section>
  `;

  const jobsPage = () => {
    const filters = state.listFilters;

    const normalizedQuery = (filters.search || "").trim().toLocaleLowerCase("sq");
    const filtered = jobs.filter((job) => {
      const searchable = [job.title, job.company, job.location, job.category, job.description, job.type].join(" ").toLocaleLowerCase("sq");
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (!filters.category || job.category === filters.category)
        && (!filters.type || job.type === filters.type)
        && (!filters.location || job.location.toLocaleLowerCase("sq").includes(filters.location.toLocaleLowerCase("sq")))
        && (!filters.savedOnly || state.favorites.has(job.id));
    });
    const sorted = [...filtered].sort((a, b) => {
      if (filters.sort === "title") return a.title.localeCompare(b.title, "sq");
      if (filters.sort === "company") return a.company.localeCompare(b.company, "sq");
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
    const visible = sorted.slice(0, state.visibleJobs);
    return `
      <section class="page-hero page-hero-small"><div class="container"><div class="eyebrow"><span class="eyebrow-line"></span> MUNDËSIA JOTE ËSHTË KËTU</div><h1>Gjej një vend<br>ku <em>rritesh.</em></h1><p>Puno në mënyrën tënde, me njerëzit e duhur.</p>${searchForm(filters.search, filters.location)}</div></section>
      <section class="listing-section"><div class="container">
        <div class="listing-heading"><div><span class="eyebrow">PANELI I MUNDËSIVE</span><h2>${filtered.length} mundësi <span class="heading-light">për ty</span></h2></div><button type="button" class="filter-pill ${filters.savedOnly ? "selected" : ""}" data-action="toggle-saved">♡ Të ruajturat (${state.favorites.size})</button></div>
        <div class="filter-row">
          <label class="filter-control"><span class="sr-only">Kategoria</span><select data-filter="category"><option value="">Të gjitha kategoritë</option>${categories.map((c) => `<option value="${escapeHTML(c.name)}" ${filters.category === c.name ? "selected" : ""}>${escapeHTML(c.name)}</option>`).join("")}</select></label>
          <label class="filter-control"><span class="sr-only">Lloji i punës</span><select data-filter="type"><option value="">Të gjitha llojet</option>${["Me kohë të plotë", "Me kohë të pjesshme", "Praktikë", "Freelance"].map((type) => `<option ${filters.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
          <label class="filter-control filter-location"><span aria-hidden="true">⌖</span><span class="sr-only">Vendndodhja</span><input data-filter="location" value="${escapeHTML(filters.location)}" placeholder="Qytet ose remote"></label>
          <label class="filter-control filter-sort"><span>Rendit:</span><select data-filter="sort" aria-label="Rendit punët"><option value="newest" ${filters.sort === "newest" ? "selected" : ""}>Më të rejat</option><option value="title" ${filters.sort === "title" ? "selected" : ""}>Titulli A–Z</option><option value="company" ${filters.sort === "company" ? "selected" : ""}>Kompania A–Z</option></select></label>
        </div>
        <div class="job-grid listing-grid">${visible.map(jobCard).join("")}</div>
        ${visible.length === 0 ? `<div class="empty-state"><span aria-hidden="true">⌕</span><h3>Nuk gjetëm mundësi këtë herë.</h3><p>Provo të ndryshosh fjalët e kërkimit ose filtrat.</p><button class="button button-outline" data-action="clear-filters" type="button">Pastro filtrat</button></div>` : ""}
        ${visible.length > 0 && visible.length < sorted.length ? `<div class="load-more-wrap"><span>Po shfaqen ${visible.length} nga ${sorted.length} mundësi</span><button class="button button-outline" data-action="load-more" type="button">Shfaq më shumë <span aria-hidden="true">↓</span></button></div>` : ""}
        <p class="section-hint">Eksploro mundësitë dhe filtro rezultatet sipas asaj që të përshtatet.</p>
      </div></section>`;
  };

  const detailPage = (id) => {
    const job = jobById(id);
    if (!job) return `<section class="container not-found"><span class="eyebrow">MUNDËSIA NUK U GJET</span><h1>Kjo shpallje nuk është më këtu.</h1><a class="button button-dark" href="#/jobs">Kthehu te punët</a></section>`;
    return `
      <section class="detail-top"><div class="container"><a class="back-link" href="#/jobs">← Të gjitha mundësitë</a>
        <div class="detail-company">${logo(job, "company-logo-large")}<div><span class="eyebrow">${escapeHTML(job.category)} · ${escapeHTML(relativeDate(job.publishedAt))}</span><h1>${escapeHTML(job.title)}</h1><p>${escapeHTML(job.company)} <span>·</span> ${escapeHTML(job.location)}</p></div></div>
        <div class="detail-meta"><span>${escapeHTML(job.type)}</span><span>${escapeHTML(job.level)}</span><span>${escapeHTML(job.salary)}</span><button type="button" class="favorite-button detail-favorite ${state.favorites.has(job.id) ? "is-saved" : ""}" data-action="favorite" data-id="${escapeHTML(job.id)}" aria-pressed="${state.favorites.has(job.id)}">♡ ${state.favorites.has(job.id) ? "E ruajtur" : "Ruaje"}</button></div>
      </div></section>
      <section class="detail-layout container">
        <article class="detail-content"><div class="eyebrow">RRETH ROLIT</div><p class="detail-description">${escapeHTML(job.description)}</p><h2>Çfarë kërkojmë</h2><ul class="detail-list">${job.requirements.map((item) => `<li><span aria-hidden="true">✓</span>${escapeHTML(item)}</li>`).join("")}</ul><h2>Çfarë ofrojmë</h2><ul class="detail-list">${job.benefits.map((item) => `<li><span aria-hidden="true">✳</span>${escapeHTML(item)}</li>`).join("")}</ul>
          <div class="apply-card" id="apply"><div><span class="eyebrow">TË PËRSHTATET?</span><h2>Bëj hapin tënd.</h2><p>Plotëso të dhënat për të përgatitur kërkesën tënde, pastaj kontakto punëdhënësin për të vazhduar.</p></div>
            <form data-form="application" class="stacked-form"><label>Emri dhe mbiemri<input name="name" autocomplete="name" required minlength="3" placeholder="p.sh. Era Hoxha"></label><label>Email-i<input name="email" type="email" autocomplete="email" required placeholder="ti@shembull.com"></label><label>Një shënim i shkurtër<textarea name="message" rows="4" maxlength="500" placeholder="Pse të intereson kjo mundësi?"></textarea></label><button class="button button-dark" type="submit">Përgatit aplikimin <span aria-hidden="true">→</span></button></form>
          </div>
        </article>
        <aside class="detail-aside"><div class="aside-card"><span class="aside-label">PËRPARA SE TË APLIKOSH</span><div class="aside-tip"><span>01</span><p>Përditëso profilin dhe CV-në tënde.</p></div><div class="aside-tip"><span>02</span><p>Lexo me kujdes kërkesat e rolit.</p></div><a href="#/profile" class="text-link">Hap profilin tënd <span aria-hidden="true">↗</span></a></div></aside>
      </section>`;
  };

  const profilePage = () => {
    const profile = {
      name: "",
      title: "",
      email: "",
      location: "",
      about: "",
      skills: "",
      ...state.profile
    };
    const completion = Math.round((Object.values(profile).filter(Boolean).length / 6) * 100);
    return `
      <section class="page-hero page-hero-small profile-hero"><div class="container"><div class="eyebrow"><span class="eyebrow-line"></span> PROFILI YT PROFESIONAL</div><h1>Hape derën<br>për <em>mundësi.</em></h1><p>Një profil i plotë e bën hapin tjetër më të lehtë.</p></div></section>
      <section class="container profile-layout"><aside class="profile-side"><div class="profile-avatar" aria-hidden="true">P</div><h2>Profili yt</h2><p>Informacion profesional</p><div class="profile-progress"><span>Plotësia e profilit</span><strong>${completion}%</strong><span class="progress-track"><i style="width: ${completion}%"></i></span></div><a href="#/applications" class="text-link">Aplikimet e mia <span aria-hidden="true">↗</span></a></aside>
        <div class="profile-main"><div class="profile-heading"><div><span class="eyebrow">INFORMACIONI YT</span><h2>Profili profesional</h2></div></div>
        <form class="profile-form" data-form="profile">
          <div class="form-two-col"><label>Emri<input name="name" value="${escapeHTML(profile.name)}" placeholder="Emri dhe mbiemri" required minlength="3" autocomplete="name"></label><label>Titulli profesional<input name="title" value="${escapeHTML(profile.title)}" placeholder="p.sh. Dizajner/e produkti" maxlength="80" required></label></div>
          <div class="form-two-col"><label>Email<input name="email" type="email" value="${escapeHTML(profile.email)}" placeholder="ti@shembull.com" required autocomplete="email"></label><label>Vendndodhja<input name="location" value="${escapeHTML(profile.location)}" placeholder="Qyteti, Shqipëria" required></label></div>
          <label>Përshkrim i shkurtër<textarea name="about" rows="4" maxlength="400" required minlength="20" placeholder="Përshkruaj përvojën dhe interesat e tua profesionale.">${escapeHTML(profile.about)}</textarea><span class="field-hint">Shkruaj 20–400 karaktere për veten.</span></label>
          <label>Aftësitë <input name="skills" value="${escapeHTML(profile.skills)}" placeholder="Figma, UX Research, HTML/CSS" required><span class="field-hint">Ndaji aftësitë me presje.</span></label>
          <label>CV-ja jote <span class="file-input-wrap"><input name="cv" type="file" accept=".pdf,.doc,.docx"><span class="file-input-faux">Zgjidh një skedar <span aria-hidden="true">↑</span></span><span class="file-name">Asnjë skedar nuk është zgjedhur</span></span><span class="field-hint">Formate të pranueshme: PDF ose Word.</span></label>
          <div class="profile-actions"><button class="button button-dark" type="submit">Përditëso profilin</button></div>
        </form></div>
      </section>`;
  };

  const applicationsPage = () => {
    const filters = ["Të gjitha", "Dërguar", "Në shqyrtim", "Intervistë", "Të pranuara", "Mbyllur"];
    const matching = [];
    return `
      <section class="page-hero page-hero-small applications-hero"><div class="container"><div class="eyebrow"><span class="eyebrow-line"></span> RRUGËTIMI YT</div><h1>Çdo hap<br>ka <em>rëndësi.</em></h1><p>Ndiq mundësitë që ke eksploruar dhe hapat e radhës.</p></div></section>
      <section class="container applications-content"><div class="listing-heading"><div><span class="eyebrow">PANELI YT</span><h2>Aplikimet <span class="heading-light">e mia</span></h2></div></div>
        <div class="status-tabs" role="group" aria-label="Filtro aplikimet">${filters.map((filter) => `<button class="${state.statusFilter === filter ? "selected" : ""}" type="button" data-action="status-filter" data-value="${escapeHTML(filter)}" aria-pressed="${state.statusFilter === filter}">${escapeHTML(filter)} <span>${filter === "Të gjitha" ? applications.length : applications.filter((a) => a.status === filter).length}</span></button>`).join("")}</div>
        ${matching.length ? `<div class="application-list">${matching.map((application) => {
          const job = jobById(application.jobId);
          if (!job) return "";
          return `<article class="application-card">${logo(job)}<div class="application-summary"><h3><a href="#/jobs/${escapeHTML(job.id)}">${escapeHTML(job.title)}</a></h3><p>${escapeHTML(job.company)} · ${escapeHTML(job.location)}</p></div><span class="status-badge status-${application.status === "Intervistë" ? "interview" : application.status === "Mbyllur" ? "closed" : application.status === "Në shqyrtim" ? "review" : "sent"}">${escapeHTML(application.status)}</span><time datetime="${escapeHTML(application.date)}">${escapeHTML(new Intl.DateTimeFormat("sq-AL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(application.date)))}</time></article>`;
        }).join("")}</div>` : `<div class="empty-state application-empty"><span aria-hidden="true">↗</span><h3>Asnjë aplikim në këtë filtër.</h3><p>Eksploro mundësitë dhe bëj hapin tënd kur të jesh gati.</p><a href="#/jobs" class="button button-dark">Shiko punët <span aria-hidden="true">→</span></a></div>`}
        <p class="section-hint">Apliko për pozicionet që të interesojnë dhe mbaj gjurmët e hapave të tu.</p>
      </section>`;
  };

  const authPage = (mode) => {
    const isRegister = mode === "register";
    return `
      <section class="auth-section"><div class="container auth-layout">
        <div class="auth-copy"><div class="eyebrow"><span class="eyebrow-line"></span> ${isRegister ? "FILLIMI YT I RI" : "MIRË SE U KTHEVE"}</div><h1>${isRegister ? "Një hap i vogël.<br><em>Mundësi të mëdha.</em>" : "Vazhdo aty ku<br><em>e le.</em>"}</h1><p>${isRegister ? "Krijo profilin tënd dhe bëhu gati për atë që vjen." : "Rruga drejt mundësisë së duhur është vetëm disa hapa larg."}</p></div>
        <div class="auth-card"><span class="eyebrow">${isRegister ? "KRIJO PROFIL" : "HYR NË PROFIL"}</span><h2>${isRegister ? "Nis me veten." : "Mirë se erdhe."}</h2><p>${isRegister ? "Plotëso të dhënat për të krijuar profilin tënd." : "Plotëso të dhënat e llogarisë për të vazhduar."}</p>
          <form class="stacked-form" data-form="${mode}">
            ${isRegister ? `<label>Emri dhe mbiemri<input name="name" autocomplete="name" required minlength="3" placeholder="Era Hoxha"></label>` : ""}
            <label>Email-i<input name="email" type="email" autocomplete="email" required placeholder="ti@shembull.com"></label>
            <label>Fjalëkalimi<input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" required minlength="8" placeholder="Të paktën 8 karaktere"><span class="field-hint">Të paktën 8 karaktere.</span></label>
            <button class="button button-dark button-full" type="submit">${isRegister ? "Vazhdo regjistrimin" : "Hyr"} <span aria-hidden="true">→</span></button>
          </form>
          <p class="auth-switch">${isRegister ? "Ke profil?" : "Nuk ke profil?"} <a href="#/${isRegister ? "login" : "register"}">${isRegister ? "Hyr këtu" : "Krijo një profil"}</a></p>
        </div>
      </div></section>`;
  };

  const adminPage = () => `
    <section class="container admin-unavailable"><div class="admin-lock" aria-hidden="true">⌑</div><div class="eyebrow"><span class="eyebrow-line"></span> PËR PUNËDHËNËSIT</div><h1>Gjej njerëzit<br>që <em>kërkon.</em></h1><p>Publiko mundësi të reja dhe lidhu me kandidatët që kërkojnë hapin e tyre të radhës.</p><a class="button button-dark" href="#/jobs">Shiko mundësitë <span aria-hidden="true">→</span></a></section>`;

  const resourcesPage = () => `
    <section class="page-hero page-hero-small"><div class="container"><div class="eyebrow"><span class="eyebrow-line"></span> UDHËRRËFYESI YT I KARRIERËS</div><h1>Një hap i mirë<br>fillon me <em>përgatitje.</em></h1><p>Burime të vogla për vendime më të qarta.</p></div></section>
    <section class="section resource-page-section"><div class="container"><div class="resource-grid">
      <a class="resource-card resource-mint" href="#/profile"><span class="resource-number">01 / CV-JA</span><span class="resource-art" aria-hidden="true">↗</span><h3>CV që tregon<br>historinë tënde.</h3><p class="resource-description">Fillo me një profil të qartë që nxjerr në pah aftësitë dhe përvojat e tua.</p><span class="resource-link">Përgatit profilin <span aria-hidden="true">↗</span></span></a>
      <a class="resource-card resource-yellow" href="#/jobs?type=Praktikë"><span class="resource-number">02 / FILLIMI</span><span class="resource-art" aria-hidden="true">✳</span><h3>Një praktikë e mirë<br>ndryshon gjithçka.</h3><p class="resource-description">Eksploro role praktike që të ndihmojnë të mësosh duke bërë.</p><span class="resource-link">Eksploro praktikat <span aria-hidden="true">↗</span></span></a>
      <a class="resource-card resource-lilac" href="#/applications"><span class="resource-number">03 / RRUGËTIMI</span><span class="resource-art" aria-hidden="true">◎</span><h3>Çdo hap i vogël<br>të çon përpara.</h3><p class="resource-description">Mbaj një pasqyrë të qartë të mundësive që po shqyrton.</p><span class="resource-link">Shiko aplikimet <span aria-hidden="true">↗</span></span></a>
    </div></div></section>`;

  function render() {
    const { path, params } = route();
    const currentHash = window.location.hash;
    if (currentHash !== lastRenderedHash) {
      lastRenderedHash = currentHash;
      if (path === "/jobs") {
        state.listFilters.category = params.get("category") || "";
        state.listFilters.type = params.get("type") || "";
        state.listFilters.search = params.get("q") || "";
        state.listFilters.location = params.get("location") || "";
        state.listFilters.savedOnly = false;
        state.visibleJobs = PAGE_SIZE;
      }
    }
    let page;
    let activePath = path.startsWith("/jobs/") ? "/jobs" : path;
    if (path === "/") page = homePage();
    else if (path === "/jobs") page = jobsPage();
    else if (path.startsWith("/jobs/")) page = detailPage(path.slice("/jobs/".length));
    else if (path === "/profile") page = profilePage();
    else if (path === "/applications") page = applicationsPage();
    else if (path === "/login" || path === "/register") page = authPage(path.slice(1));
    else if (path === "/admin") page = adminPage();
    else if (path === "/resources") page = resourcesPage();
    else page = homePage();
    app.innerHTML = `${header(activePath)}${noticeBanner()}<main id="main-content">${page}</main>${footer()}`;
    document.title = `${path.startsWith("/jobs/") ? `${jobById(path.slice("/jobs/".length))?.title || "Shpallje"} | ` : ""}PunaIme — hapi yt i radhës`;
  }

  const applySearch = (form) => {
    const data = new FormData(form);
    state.listFilters.search = String(data.get("q") || "").trim();
    state.listFilters.location = String(data.get("location") || "").trim();
    state.visibleJobs = PAGE_SIZE;
    const params = new URLSearchParams();
    if (state.listFilters.search) params.set("q", state.listFilters.search);
    if (state.listFilters.location) params.set("location", state.listFilters.location);
    const query = params.toString();
    navigate(`/jobs${query ? `?${query}` : ""}`);
  };

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (actionTarget) {
      const action = actionTarget.dataset.action;
      if (action === "favorite") {
        const id = actionTarget.dataset.id;
        if (state.favorites.has(id)) state.favorites.delete(id);
        else state.favorites.add(id);
        render();
      } else if (action === "load-more") {
        state.visibleJobs += PAGE_SIZE;
        render();
      } else if (action === "toggle-saved") {
        state.listFilters.savedOnly = !state.listFilters.savedOnly;
        state.visibleJobs = PAGE_SIZE;
        render();
      } else if (action === "clear-filters") {
        state.listFilters = { category: "", type: "", location: "", sort: "newest", savedOnly: false, search: "" };
        state.visibleJobs = PAGE_SIZE;
        navigate("/jobs");
        render();
      } else if (action === "status-filter") {
        state.statusFilter = actionTarget.dataset.value;
        render();
      } else if (action === "dismiss-notice") {
        state.notice = "";
        render();
      }
      return;
    }
    if (event.target.closest(".menu-toggle")) {
      const button = event.target.closest(".menu-toggle");
      const nav = document.querySelector("#primary-navigation");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("nav-open", !expanded);
    }
  });

  document.addEventListener("change", (event) => {
    const filter = event.target.dataset.filter;
    if (filter) {
      state.listFilters[filter] = event.target.value;
      state.visibleJobs = PAGE_SIZE;
      render();
    }
    if (event.target.name === "cv") {
      const nameTarget = event.target.closest(".file-input-wrap").querySelector(".file-name");
      nameTarget.textContent = event.target.files?.[0]?.name || "Asnjë skedar nuk është zgjedhur";
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    const formType = form.dataset.form;
    if (!formType) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (formType === "job-search") {
      applySearch(form);
    } else if (formType === "application") {
      state.notice = "Forma u plotësua. Rishiko të dhënat përpara se të vazhdosh.";
      render();
      document.querySelector("#apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (formType === "profile") {
      state.profile = Object.fromEntries(
        [...new FormData(form).entries()]
          .filter(([key, value]) => key !== "cv" && typeof value === "string")
          .map(([key, value]) => [key, value.trim()])
      );
      state.notice = "Profili u plotësua me sukses.";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (formType === "login" || formType === "register") {
      state.notice = formType === "login"
        ? "Hyrja në llogari nuk është ende e disponueshme."
        : "Krijimi i llogarisë nuk është ende i disponueshëm.";
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    state.notice = "";
    render();
    window.scrollTo(0, 0);
  });

  render();
})();
