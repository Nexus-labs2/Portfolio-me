// ============================================================
// Portfolio App — driven entirely by data/portfolio.json
// ============================================================
let DATA = null;

async function init() {
  try {
    const res = await fetch('data/portfolio.json');
    DATA = await res.json();
  } catch(e) {
    console.error('Could not load portfolio.json', e);
    dismissLoader(); return;
  }
  renderAll();
  initCursor();
  initSignalMatrix();
  initScrollReveal();
  initSmoothScroll();
  initTyped();
  initHamburger();
  initNavScroll();
  dismissLoader();
}

function dismissLoader() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('loading');
    const l = document.getElementById('loader');
    l.classList.add('done');
    setTimeout(() => l.remove(), 520);
  }));
}

function renderAll() {
  renderHero();
  renderSkills();
  renderBoards();
  renderSensors();
  renderAchievements();
  renderMajorProjects();
  renderFeaturedProjects();
  renderMinorProjects();
  renderCertifications();
  renderFooter();
}

// ── HERO ──────────────────────────────────────────────────────
function renderHero() {
  const p = DATA.personal;
  document.getElementById('hero-name').innerHTML = formatName(p.name);
  document.getElementById('hero-bio').textContent = p.bio;
  document.getElementById('stat-major').innerHTML = `${p.stats.major_projects}<span>+</span>`;
  document.getElementById('stat-fun').innerHTML   = `${p.stats.fun_builds}<span>+</span>`;
  document.getElementById('stat-proto').innerHTML = `${p.stats.protocols}<span>+</span>`;
  document.title = `${p.name} — ECE Portfolio`;

  // WIP ticker
  const wip = (DATA.major_projects||[]).filter(pr => pr.status === 'wip').map(pr => pr.title);
  const ticker = document.getElementById('currently-building');
  if (ticker && wip.length) {
    ticker.innerHTML = `<span class="wip-dot"></span>Currently Building:&nbsp;<strong>${wip.join('&nbsp; · &nbsp;')}</strong>`;
    ticker.style.display = 'flex';
  }

  // GitHub live stats
  const username = (p.github||'').replace('https://github.com/','').replace(/\/$/,'');
  const ghLink = document.getElementById('github-link-href');
  if (ghLink) ghLink.href = p.github;
  const ghUser = document.getElementById('github-username');
  if (ghUser) ghUser.textContent = username;
  if (username) {
    fetch(`https://api.github.com/users/${username}`)
      .then(r => r.json())
      .then(d => {
        const r = document.getElementById('gh-repos');
        const f = document.getElementById('gh-followers');
        if (r) r.textContent = d.public_repos ?? '—';
        if (f) f.textContent = d.followers ?? '—';
      }).catch(()=>{});
  }
}

function formatName(name) {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return `<span>${name}</span>`;
  const last = parts.pop();
  return `${parts.join(' ')}<br><span>${last}</span>`;
}

// ── TYPED ANIMATION ───────────────────────────────────────────
function initTyped() {
  const el = document.getElementById('typed-title');
  if (!el) return;
  const phrases = DATA.personal.typed_phrases || [
    'Embedded Systems','IoT ',
    'PCB Designing'
  ];
  let pi=0, ci=0, deleting=false;
  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting=true; setTimeout(tick,1800); return; }
    } else {
      el.textContent = phrase.slice(0, --ci);
      if (ci===0) { deleting=false; pi=(pi+1)%phrases.length; }
    }
    setTimeout(tick, deleting ? 40 : 80);
  }
  tick();
}

// ── SKILLS ────────────────────────────────────────────────────
function renderSkills() {
  const s = DATA.skills;
  document.getElementById('tags-boards').innerHTML    = s.boards.map(t=>`<span class="tag accent">${t}</span>`).join('');
  document.getElementById('tags-protocols').innerHTML = s.protocols.map(t=>`<span class="tag purple">${t}</span>`).join('');
  document.getElementById('tags-languages').innerHTML = s.languages.map(t=>`<span class="tag amber">${t}</span>`).join('');
  document.getElementById('tags-tools').innerHTML     = s.tools.map(t=>`<span class="tag">${t}</span>`).join('');
}

// ── BOARDS DETAIL ─────────────────────────────────────────────
function renderBoards() {
  const container = document.getElementById('boards-grid');
  if (!container || !DATA.boards_detail) return;
  container.innerHTML = DATA.boards_detail.map(b => `
    <div class="board-card reveal">
      <div class="board-top">
        <div class="board-emoji">${b.emoji}</div>
        <div class="board-name">${b.name}</div>
      </div>
      <div class="board-desc">${b.desc}</div>
      <div class="board-used">Used in: <span>${b.used_in}</span></div>
    </div>`).join('');
}

// ── SENSORS ───────────────────────────────────────────────────
function renderSensors() {
  const container = document.getElementById('sensors-grid');
  if (!container || !DATA.sensors) return;
  container.innerHTML = Object.entries(DATA.sensors).map(([cat, sensors]) => `
    <div class="sensor-card reveal">
      <div class="sensor-cat-icon">${sensors[0]?.icon||'📡'}</div>
      <div class="sensor-cat-title">${cat}</div>
      <div class="sensor-tags">
        ${sensors.map(s => `<span class="sensor-tag" title="${s.note||''}">${s.name}</span>`).join('')}
      </div>
    </div>`).join('');
}

// ── ACHIEVEMENTS ──────────────────────────────────────────────
function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if (!container || !DATA.achievements) return;
  container.innerHTML = DATA.achievements.map(a => {
    const hasImg = a.image && a.image.trim();
    const hasPdf = a.pdf && a.pdf.trim();
    const meta = [a.organizer, a.year].filter(Boolean).join(' &nbsp;·&nbsp; ');
    return `
    <div class="achieve-card reveal">
      <div class="achieve-trophy">${a.trophy}</div>
      <div class="achieve-right">
        <div class="achieve-position">${a.position}</div>
        <div class="achieve-event">${a.event}</div>
        <div class="achieve-project">"${a.project}"</div>
        <div class="achieve-meta">${meta}</div>
        ${hasPdf ? `<a class="achieve-document-link" href="${a.pdf}" target="_blank" rel="noopener noreferrer">📄 View Copyright PDF ↗</a>` : ''}
      </div>
      ${hasImg ? `<div class="achieve-img-wrap" onclick="openLightbox('images/achievements/${a.image}')">
        <img src="images/achievements/${a.image}" alt="${a.event}" loading="lazy">
        <span class="achieve-view">View</span>
      </div>` : ''}
    </div>`;
  }).join('');
}

// ── MAJOR PROJECTS ────────────────────────────────────────────
function renderMajorProjects() {
  const featuredIds = new Set(DATA.featured_project_ids || []);
  const projects = DATA.major_projects.filter(p => !featuredIds.has(p.id) && !p.parent_id);
  renderProjectEntries('major-projects-list', projects);
}

function renderFeaturedProjects() {
  const featuredIds = new Set(DATA.featured_project_ids || []);
  const projects = DATA.major_projects
    .filter(p => featuredIds.has(p.id) && !p.parent_id)
    .concat(DATA.additional_projects || []);
  renderProjectEntries('featured-projects-list', projects);
}

function renderProjectEntries(containerId, projects) {
  document.getElementById(containerId).innerHTML =
    projects.map((p,i) => buildProjectEntry(p,i+1)).join('');
}

function buildProjectEntry(p, num, isNested = false) {
  const isWip = p.status === 'wip';
  const nestedProjects = DATA.major_projects.filter(project => project.parent_id === p.id);
  const statusHtml = isWip
    ? `<span class="project-status status-wip">⟳ In Development</span>`
    : `<span class="project-status status-done">✓ Completed</span>`;
  const nestedProjectsHtml = nestedProjects.length
    ? `<div class="nested-projects">${nestedProjects.map((project, index) => buildProjectEntry(project, index + 1, true)).join('')}</div>`
    : '';
  return `
  <div class="project-entry reveal${isNested ? ' nested-project-entry' : ''}" id="${p.id}">
    <div class="project-header" onclick="toggleProject('${p.id}')">
      <div>
        <div class="project-num">${isNested ? 'NESTED PROJECT' : `PROJECT — ${String(num).padStart(2,'0')}`}</div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-summary-short">${p.short_desc}</p>
        <div class="project-badges">${p.badges.map(b=>`<span class="badge">${b}</span>`).join('')}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;flex-shrink:0">
        ${statusHtml}
        <span style="font-family:'Space Mono',monospace;font-size:.65rem;color:var(--muted)">[ Expand ▾ ]</span>
      </div>
    </div>
    <div class="project-body" style="display:none">${isWip ? buildWipBody(p) : buildProjectBody(p)}${nestedProjectsHtml}</div>
  </div>`;
}

function renderArchItems(items) {
  if (Array.isArray(items)) {
    return items.map(i => `<div class="arch-item">${i}</div>`).join('');
  }
  if (items && typeof items === 'object') {
    return Object.entries(items).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `
          <div class="arch-subtitle">${key}</div>
          ${value.map(i => `<div class="arch-item">${i}</div>`).join('')}`;
      }
      return `<div class="arch-item"><strong>${key}:</strong> ${value}</div>`;
    }).join('');
  }
  return '';
}

function buildProjectBody(p) {
  const swBlocks = Object.entries(p.sw_arch||{}).map(([t,items])=>`
    <div class="arch-block"><div class="arch-block-title">${t}</div>
    ${renderArchItems(items)}</div>`).join('');
  const hwBlocks = Object.entries(p.hw_arch||{}).map(([t,items])=>`
    <div class="arch-block"><div class="arch-block-title">${t}</div>
    ${renderArchItems(items)}</div>`).join('');
  const hasRequirements = p.requirements && Object.keys(p.requirements).length;
  const requirementsTabHtml = hasRequirements
    ? `<button class="ptab" onclick="switchTab('${p.id}','requirements',this)">Requirements</button>`
    : '';
  const requirementsContentHtml = hasRequirements
    ? `<div id="${p.id}-requirements" class="ptab-content">
        <div class="arch-grid">${renderArchItems(p.requirements)}</div>
        ${p.technical_report ? `<a href="${p.technical_report}" target="_blank" rel="noopener noreferrer" class="github-link">View technical report ↗</a>` : ''}
      </div>`
    : '';

  const github = Array.isArray(p.github) ? p.github : [p.github];
  const ghHtml = github.filter(Boolean).map(url=>`
    <a href="${url}" target="_blank" class="github-link">
      <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.415-4.033-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
      ${url}
    </a>`).join('');
  const apkHtml = p.android_app
    ? `<a href="${p.android_app}" class="github-link" download="${p.android_app.split('/').pop()}">⬇ Download ${p.title} Android APK</a>`
    : '';

  return `
    <div class="project-tabs">
      <button class="ptab active" onclick="switchTab('${p.id}','summary',this)">Summary</button>
      ${requirementsTabHtml}
      <button class="ptab" onclick="switchTab('${p.id}','sw-arch',this)">SW Architecture</button>
      <button class="ptab" onclick="switchTab('${p.id}','hw-arch',this)">HW Architecture</button>
      <button class="ptab" onclick="switchTab('${p.id}','images',this)">Images</button>
      <button class="ptab" onclick="switchTab('${p.id}','protocols',this)">Protocols</button>
      <button class="ptab" onclick="switchTab('${p.id}','github',this)">GitHub</button>
    </div>
    <div id="${p.id}-summary"  class="ptab-content active"><p class="summary-text">${p.summary}</p>${apkHtml}</div>
    ${requirementsContentHtml}
    <div id="${p.id}-sw-arch"  class="ptab-content"><div class="arch-grid">${swBlocks}</div></div>
    <div id="${p.id}-hw-arch"  class="ptab-content"><div class="arch-grid">${hwBlocks}</div></div>
    <div id="${p.id}-images"   class="ptab-content">
      <div class="project-images-grid">${buildProjectImages(p)}</div>
      ${!(p.images||[]).filter(Boolean).length?`<p style="color:var(--muted);font-size:.78rem;margin-top:1.5rem;font-family:'Space Mono',monospace">// Drop images into images/projects/major/${p.id}/ and update portfolio.json</p>`:''}
    </div>
    <div id="${p.id}-protocols" class="ptab-content">
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1.2rem">Protocols implemented in this project:</p>
      <div class="protocols-list">${(p.protocols||[]).map(pr=>`<span class="proto-pill">${pr}</span>`).join('')}</div>
    </div>
    <div id="${p.id}-github"   class="ptab-content">
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:1.5rem">Source code, schematics and documentation.</p>
      ${ghHtml}
    </div>`;
}

function buildProjectImages(p) {
  const imgs = (p.images||[]).filter(Boolean);
  if (!imgs.length) return ['Hardware Setup','PCB Closeup','Dashboard','Field View']
    .map(l=>`<div class="proj-img-placeholder">📷<span>${l}</span></div>`).join('');
  return imgs.map(src => {
    const imagePath = p.image_dir
      ? `images/${p.image_dir}/${src}`
      : `images/projects/major/${p.id}/${src}`;
    return `
    <div class="proj-img-wrapper">
      <img src="${imagePath}" alt="${src}" loading="lazy" onclick="openLightbox(this.src)">
    </div>`;
  }).join('');
}

function buildWipBody(p) {
  return `<div class="wip-body">
    <div class="wip-icon">🔭</div>
    <div class="wip-label">Under Development</div>
    <p class="wip-sub">${p.wip_note}</p>
    <div class="wip-progress"><div class="wip-bar"></div></div>
  </div>`;
}

// ── MINOR PROJECTS ────────────────────────────────────────────
function renderMinorProjects() {
  document.getElementById('minor-projects-list').innerHTML =
    DATA.minor_projects.map((p,idx) => buildMinorCard(p,idx)).join('');
}

function buildMinorCard(p, idx) {
  const imgs = [p.image, p.image2].filter(Boolean);
  let mediaHtml;
  if (!imgs.length) {
    mediaHtml = `<div class="minor-img"><span style="font-size:3rem">${p.emoji||'🔧'}</span></div>`;
  } else if (imgs.length === 1) {
    mediaHtml = `<div class="minor-img single-img" onclick="openLightbox('images/projects/minor/${imgs[0]}')">
      <img src="images/projects/minor/${imgs[0]}" alt="${p.name}" loading="lazy"></div>`;
  } else {
    mediaHtml = `
      <div class="minor-img-slider" id="slider-${idx}">
        <div class="minor-slide active" onclick="openLightbox('images/projects/minor/${imgs[0]}')">
          <img src="images/projects/minor/${imgs[0]}" alt="${p.name} 1" loading="lazy"></div>
        <div class="minor-slide" onclick="openLightbox('images/projects/minor/${imgs[1]}')">
          <img src="images/projects/minor/${imgs[1]}" alt="${p.name} 2" loading="lazy"></div>
        <div class="slider-nav">
          <button class="slider-btn" onclick="event.stopPropagation();slideMinor(${idx},0)">●</button>
          <button class="slider-btn" onclick="event.stopPropagation();slideMinor(${idx},1)">○</button>
        </div>
        <div class="slider-arrow left-arrow"  onclick="event.stopPropagation();slideMinor(${idx},'prev')">‹</div>
        <div class="slider-arrow right-arrow" onclick="event.stopPropagation();slideMinor(${idx},'next')">›</div>
      </div>`;
  }
  return `<div class="minor-card">
    ${mediaHtml}
    <div class="minor-body">
      <div class="minor-name">${p.name}</div>
      <div class="minor-desc">${p.desc}</div>
      <div class="minor-chip">${p.chip}</div>
    </div>
  </div>`;
}

function slideMinor(idx, target) {
  const slider = document.getElementById(`slider-${idx}`);
  const slides = slider.querySelectorAll('.minor-slide');
  const dots   = slider.querySelectorAll('.slider-btn');
  let cur = [...slides].findIndex(s=>s.classList.contains('active'));
  let next = target==='prev'?(cur-1+slides.length)%slides.length
           : target==='next'?(cur+1)%slides.length : target;
  slides[cur].classList.remove('active'); slides[next].classList.add('active');
  dots[cur].textContent='○'; dots[next].textContent='●';
}

// ── CERTIFICATIONS ────────────────────────────────────────────
function renderCertifications() {
  renderCertSection('cert-matters-list',  DATA.certifications.matters,  'matters');
  renderCertSection('cert-curiosity-list',DATA.certifications.curiosity,'curiosity');
  renderCertSection('cert-internships-list',DATA.certifications.internships || [],'internships');
}
function renderCertSection(id, certs, folder) {
  document.getElementById(id).innerHTML = certs.map(c => {
    const imagePath = c.image_path || (c.image ? `images/certifications/${folder}/${c.image}` : '');
    const hasImg = imagePath.trim().length > 0;
    const hasPdf = c.pdf && c.pdf.trim().length > 0;
    const details = [c.year, c.note].filter(Boolean).join(' · ');
    const issuerHtml = c.issuer ? `<div class="cert-issuer">${c.issuer}</div>` : '';
    const detailsHtml = details ? `<div class="cert-year">${details}</div>` : '';
    const viewTag = hasPdf
      ? `<a class="cert-view-tag" href="${c.pdf}" target="_blank" rel="noopener noreferrer">📄 View Offer Letter</a>`
      : hasImg
        ? `<div class="cert-view-tag">📄 View Certificate</div>`
        : `<div class="cert-placeholder-tag">// Add image in portfolio.json</div>`;
    return `<div class="cert-card ${hasImg?'cert-has-img':''}" ${hasImg?`onclick="openLightbox('${imagePath}')"`:''}">
      <div class="cert-icon">${c.icon}</div>
      <div>
        <div class="cert-name">${c.name}</div>
        ${issuerHtml}
        ${detailsHtml}
        ${viewTag}
      </div>
    </div>`;
  }).join('');
}

// ── FOOTER ────────────────────────────────────────────────────
function renderFooter() {
  const p = DATA.personal;
  document.getElementById('footer-email').href    = `mailto:${p.email}`;
  document.getElementById('footer-linkedin').href = p.linkedin;
  document.getElementById('footer-github').href   = p.github;
}

// ── CV MODAL ──────────────────────────────────────────────────
function openCV() {
  document.getElementById('cv-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeCV(e) {
  if (!e || e.target === document.getElementById('cv-modal') || e.currentTarget.classList.contains('cv-close-btn')) {
    document.getElementById('cv-modal').style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ── LIGHTBOX ──────────────────────────────────────────────────
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

// ── PROJECT TOGGLE & TABS ─────────────────────────────────────
function toggleProject(id) {
  const b = document.querySelector(`#${id} .project-body`);
  b.style.display = b.style.display === 'block' ? 'none' : 'block';
}
function switchTab(projId, tabId, btn) {
  const proj = document.getElementById(projId);
  proj.querySelectorAll('.ptab-content').forEach(c=>c.classList.remove('active'));
  proj.querySelectorAll('.ptab').forEach(t=>t.classList.remove('active'));
  document.getElementById(`${projId}-${tabId}`).classList.add('active');
  btn.classList.add('active');
}

// ── HAMBURGER ─────────────────────────────────────────────────
function initHamburger() {
   const btn     = document.getElementById('menu-trigger');
   const drawer  = document.getElementById('mobile-drawer');
   const overlay = document.getElementById('drawer-overlay');
   const closeBtn = document.getElementById('drawer-close');
   if (!btn || !drawer || !overlay) return;
 
   function openDrawer()  {
     drawer.classList.add('open');
     overlay.classList.add('open');
     drawer.style.right = '0';
     drawer.style.visibility = 'visible';
     drawer.style.opacity = '1';
     overlay.style.display = 'block';
     btn.classList.add('open');
     btn.textContent = 'CLOSE';
     document.body.style.overflow = 'hidden';
   }
   function closeDrawer() {
     drawer.classList.remove('open');
     overlay.classList.remove('open');
     drawer.style.right = '-100vw';
     drawer.style.visibility = 'hidden';
     drawer.style.opacity = '0';
     overlay.style.display = 'none';
     btn.classList.remove('open');
     btn.textContent = 'MENU';
     document.body.style.overflow = '';
   }
 
   closeDrawer();
 
   btn.addEventListener('click', () =>
     drawer.classList.contains('open') ? closeDrawer() : openDrawer());
   overlay.addEventListener('click', closeDrawer);
   if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
   drawer.querySelectorAll('a[href="#boards-section"], a[href="#sensors-section"]').forEach(link => {
     link.addEventListener('click', e => {
       const targetId = link.getAttribute('href').substring(1);
       const section = document.getElementById(targetId);
       if (section) {
         e.preventDefault();
         section.classList.remove('hidden-section');
         closeDrawer();
         setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
       }
     });
   });
   drawer.querySelectorAll('a:not([href="#boards-section"]):not([href="#sensors-section"]), button').forEach(element =>
     element.addEventListener('click', closeDrawer));
   document.addEventListener('keydown', e => {
     if (e.key === 'Escape' && drawer.classList.contains('open')) {
       closeDrawer();
     }
   });
 }

function initSignalMatrix() {
  const canvas = document.getElementById('signal-matrix');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const nodes = [
    { x: .16, y: .27, label: 'SENSORS', meta: 'INPUT / I2C', color: '#a78bfa' },
    { x: .82, y: .25, label: 'WIRELESS', meta: 'BLE / LINK', color: '#00e5ff' },
    { x: .85, y: .69, label: 'CONTROL', meta: 'LOGIC / I-O', color: '#f59e0b' },
    { x: .19, y: .74, label: 'OUTPUT', meta: 'DISPLAY / ACTUATION', color: '#00e5ff' }
  ];
  let width = 0, height = 0, dpr = 1, frame = 0, visible = false;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointOnPath(points, progress) {
    const sections = points.length - 1;
    const scaled = progress * sections;
    const index = Math.min(Math.floor(scaled), sections - 1);
    const local = scaled - index;
    const start = points[index];
    const end = points[index + 1];
    return {
      x: start.x + (end.x - start.x) * local,
      y: start.y + (end.y - start.y) * local
    };
  }

  function draw(timestamp = 0) {
    frame = 0;
    if (!width || !height) resize();
    if (!width || !height) return;

    pointerX += (targetX - pointerX) * .045;
    pointerY += (targetY - pointerY) * .045;
    const cx = width * .5 + pointerX;
    const cy = height * .5 + pointerY;
    const time = reducedMotion ? 0 : timestamp;
    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * .48);
    glow.addColorStop(0, 'rgba(0,229,255,.13)');
    glow.addColorStop(.55, 'rgba(124,58,237,.055)');
    glow.addColorStop(1, 'rgba(10,10,15,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    [width * .23, width * .34].forEach((radius, index) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.setLineDash(index ? [2, 12] : [1, 7]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = index ? 'rgba(124,58,237,.24)' : 'rgba(0,229,255,.23)';
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const paths = nodes.map(node => {
      const x = node.x * width;
      const y = node.y * height;
      const elbowX = cx + (x - cx) * .58;
      return [{ x: cx, y: cy }, { x: elbowX, y: cy }, { x: elbowX, y }, { x, y }];
    });

    nodes.forEach((node, index) => {
      const x = node.x * width;
      const y = node.y * height;
      const points = paths[index];
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(160,177,205,.27)';
      ctx.stroke();

      if (!reducedMotion) {
        const packet = pointOnPath(points, (time * .00012 + index * .23) % 1);
        ctx.beginPath();
        ctx.arc(packet.x, packet.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(x, y, 7 + (reducedMotion ? 0 : Math.sin(time * .003 + index) * 1.2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10,10,15,.95)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = node.color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      const rightSide = node.x > .5;
      const labelX = x + (rightSide ? -14 : 14);
      ctx.textAlign = rightSide ? 'right' : 'left';
      ctx.font = '700 10px "Space Mono", monospace';
      ctx.fillStyle = node.color;
      ctx.fillText(node.label, labelX, y - 7);
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillStyle = 'rgba(215,225,240,.55)';
      ctx.fillText(node.meta, labelX, y + 10);
    });

    const chipWidth = 148, chipHeight = 88;
    const chipX = cx - chipWidth * .5, chipY = cy - chipHeight * .5;
    ctx.shadowColor = 'rgba(0,229,255,.25)';
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(8,10,16,.96)';
    ctx.fillRect(chipX, chipY, chipWidth, chipHeight);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,229,255,.7)';
    ctx.strokeRect(chipX, chipY, chipWidth, chipHeight);
    ctx.strokeStyle = 'rgba(124,58,237,.55)';
    ctx.strokeRect(chipX + 5, chipY + 5, chipWidth - 10, chipHeight - 10);

    for (let pin = 0; pin < 7; pin++) {
      const pinX = chipX + 18 + pin * 18.5;
      ctx.beginPath();
      ctx.moveTo(pinX, chipY - 7);
      ctx.lineTo(pinX, chipY);
      ctx.moveTo(pinX, chipY + chipHeight);
      ctx.lineTo(pinX, chipY + chipHeight + 7);
      ctx.strokeStyle = 'rgba(0,229,255,.65)';
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = '8px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(0,229,255,.72)';
    ctx.fillText('NEXUS  /  SYSTEMS', cx, cy - 15);
    ctx.font = '800 16px Syne, sans-serif';
    ctx.fillStyle = '#e8e8f0';
    ctx.fillText('SIGNAL CORE', cx, cy + 6);
    ctx.font = '7px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(215,225,240,.58)';
    ctx.fillText('HARDWARE  ·  SOFTWARE', cx, cy + 25);

    ctx.textAlign = 'left';
    ctx.font = '8px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(0,229,255,.7)';
    ctx.fillText('SIGNAL MAP  /  04 NODES', 24, height - 24);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(215,225,240,.42)';
    ctx.fillText('ECE SYSTEMS', width - 24, height - 24);

    if (visible && !reducedMotion) frame = requestAnimationFrame(draw);
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) {
      if (reducedMotion) draw();
      else if (!frame) frame = requestAnimationFrame(draw);
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });

  window.addEventListener('resize', () => {
    resize();
    if (reducedMotion) draw();
  }, { passive: true });

  if (finePointer && !reducedMotion) {
    window.addEventListener('pointermove', event => {
      targetX = ((event.clientX / window.innerWidth) - .5) * 10;
      targetY = ((event.clientY / window.innerHeight) - .5) * 10;
    }, { passive: true });
  }

  resize();
  draw();
  observer.observe(canvas);
}

// ── NAV SCROLL ────────────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const progress = document.getElementById('scroll-progress');
  const links = Array.from(nav.querySelectorAll('.nav-links a[href^="#"]'));
  const update = () => {
    nav.classList.toggle('nav-scrolled', window.scrollY > 60);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) {
      progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0})`;
    }

    let activeHref = links[0]?.getAttribute('href');
    links.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section && section.getBoundingClientRect().top <= window.innerHeight * .35) {
        activeHref = link.getAttribute('href');
      }
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === activeHref);
    });
  };
  let scheduled = false;
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// ── CURSOR ────────────────────────────────────────────────────
function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY;});
  (function anim(){
    cursor.style.left=mx+'px'; cursor.style.top=my+'px';
    rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(anim);
  })();
}

// ── SCROLL REVEAL ─────────────────────────────────────────────
function initScrollReveal() {
  const obs = new IntersectionObserver(entries=>{
    entries.forEach((e,i)=>{
      if(e.isIntersecting) setTimeout(()=>e.target.classList.add('visible'),i*70);
    });
  },{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
}

// ── SMOOTH SCROLL ─────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
    });
  });
}

window.addEventListener('DOMContentLoaded', init);
