const WHATSAPP = '2290159020025';
const CATEGORIES = ['Branding', 'Social Media Design', 'Publicité & Communication', 'Logofolio', 'Projets conceptuels'];
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

/* ---------- Menu mobile ---------- */
const toggle = $('#nav-toggle'), list = $('#nav-list');
const closeMenu = () => { list.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; };
toggle.addEventListener('click', () => {
  const open = list.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open); toggle.textContent = open ? 'Fermer' : 'Menu';
});
list.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

/* ---------- Lien actif, barre de progression, bouton haut ---------- */
const links = [...document.querySelectorAll('.nav__link')];
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
links.forEach(l => { const s = $(l.getAttribute('href')); if (s) spy.observe(s); });
addEventListener('scroll', () => {
  const h = document.documentElement;
  $('#progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
  $('#up').classList.toggle('show', h.scrollTop > 500);
  $('#header').classList.toggle('scrolled', h.scrollTop > 20);
}, { passive: true });

/* ---------- Texte circulaire du badge ---------- */
const bt = $('#badge-text');
[...bt.dataset.text].forEach((ch, i, a) => {
  const s = el('span', '', ch); s.style.transform = `translateX(-50%) rotate(${i * 360 / a.length}deg)`; bt.appendChild(s);
});

/* ---------- Apparition au scroll ---------- */
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(e => rv.observe(e));

/* ---------- Accordéon des services ---------- */
document.querySelectorAll('.acc__item').forEach(item => {
  const head = $('.acc__head', item);
  const body = $('.acc__body', item); body.innerHTML = `<div>${body.innerHTML}</div>`;
  head.addEventListener('click', () => {
    const was = item.classList.contains('open');
    document.querySelectorAll('.acc__item').forEach(i => { i.classList.remove('open'); $('.acc__head', i).setAttribute('aria-expanded', 'false'); });
    if (!was) { item.classList.add('open'); head.setAttribute('aria-expanded', 'true'); }
  });
});

/* ---------- Témoignages : on duplique pour un défilement continu ---------- */
const row = $('#marquee'); row.innerHTML += row.innerHTML;

/* ---------- Curseur personnalisé ---------- */
const cur = $('#cursor');
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  addEventListener('mousemove', e => { cur.classList.add('on'); cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; });
  document.addEventListener('mouseover', e => cur.classList.toggle('big', !!e.target.closest('a,button,.card')));
}

/* ---------- Formulaire -> WhatsApp ---------- */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const txt = `Bonjour Abraham, je suis ${$('#nom').value.trim()}.\nProjet : ${$('#type').value}.\n${$('#message').value.trim()}`;
  open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
  $('#form-note').textContent = 'WhatsApp s’ouvre avec votre message. Appuyez sur Envoyer pour le transmettre.';
  e.target.reset();
});
$('#year').textContent = new Date().getFullYear();

/* ---------- Projets ---------- */
let projects = [], current = 'all';
const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('VOTRE');
const DEMO = CATEGORIES.map((c, i) => ({ nom: 'Projet exemple ' + (i + 1), categorie: c, description: 'Projet de démonstration. Ajoutez vos vrais projets depuis la page admin.', fichiers: [] }));

function renderFilters() {
  const box = $('#filters'); box.innerHTML = '';
  ['all', ...CATEGORIES].forEach(c => {
    const b = el('button', 'filter' + (c === current ? ' is-active' : ''), c === 'all' ? 'Tous' : c);
    b.addEventListener('click', () => { current = c; renderFilters(); renderCards(); });
    box.appendChild(b);
  });
}
function renderCards() {
  const track = $('#track'); track.innerHTML = '';
  const shown = projects.filter(p => current === 'all' || p.categorie === current);
  $('#empty').hidden = shown.length > 0;
  shown.forEach((p, i) => {
    const card = el('button', 'card'); card.type = 'button';
    const img = (p.fichiers || []).find(f => f.type === 'image');
    let thumb;
    if (img) { thumb = el('img', 'card__thumb'); thumb.src = img.thumb || img.url; thumb.alt = p.nom; thumb.width = 600; thumb.height = 450; thumb.decoding = 'async'; thumb.loading = i < 3 ? 'eager' : 'lazy'; }
    else thumb = el('div', 'card__thumb', (p.fichiers || []).length ? 'PDF' : p.categorie);
    card.append(thumb, el('span', 'card__n', String(i + 1).padStart(2, '0')), el('span', 'card__t', p.nom), el('span', 'card__c', p.categorie));
    card.addEventListener('click', () => openModal(p));
    track.appendChild(card);
  });
}

/* PDF : on dessine chaque page (marche aussi sur téléphone, sans téléchargement) */
let pdfjsReady;
function loadPdfJs() {
  return pdfjsReady ||= new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(); };
    s.onerror = ko; document.head.appendChild(s);
  });
}
async function showPdf(f, box) {
  const note = el('p', 'muted', 'Chargement du PDF…'); box.appendChild(note);
  try {
    await loadPdfJs();
    const pdf = await pdfjsLib.getDocument(f.url).promise;
    for (let n = 1; n <= Math.min(pdf.numPages, 15); n++) {
      const page = await pdf.getPage(n);
      const w = Math.min(box.clientWidth || 800, 900);
      const vp = page.getViewport({ scale: (w / page.getViewport({ scale: 1 }).width) * 1.5 });
      const c = el('canvas', 'pdfpage'); c.width = vp.width; c.height = vp.height;
      box.insertBefore(c, note);
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    }
    note.remove();
  } catch { note.textContent = 'Aperçu indisponible. Utilisez le lien ci-dessous.'; }
}

function openModal(p) {
  $('#m-title').textContent = p.nom; $('#m-desc').textContent = p.description || '';
  const box = $('#m-files'); box.innerHTML = '';
  (p.fichiers || []).forEach(f => {
    if (f.type === 'image') { const i = el('img'); i.src = f.url; i.alt = p.nom; box.appendChild(i); }
    else { showPdf(f, box); const a = el('a', 'modal__link', 'Ouvrir le PDF en plein écran'); a.href = f.url; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a); }
  });
  $('#modal').hidden = false; $('#m-close').focus();
}
const closeModal = () => { $('#modal').hidden = true; };
$('#m-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
const step = d => $('#track').scrollBy({ left: d * 320, behavior: 'smooth' });
$('#prev').addEventListener('click', () => step(-1));
$('#next').addEventListener('click', () => step(1));

const API = `${window.SUPABASE_URL}/rest/v1/projets?select=id,nom,categorie,description,fichiers&order=created_at.desc`;
function skeleton() {
  const t = $('#track'); t.innerHTML = '';
  for (let i = 0; i < 3; i++) t.appendChild(el('div', 'card card--sk'));
}
async function loadProjects() {
  try { const c = JSON.parse(localStorage.getItem('projets-v1') || 'null'); if (c) { projects = c; renderCards(); } else skeleton(); }
  catch { skeleton(); }
  try {
    const r = await fetch(API, { headers: { apikey: window.SUPABASE_KEY } });
    if (!r.ok) throw new Error(r.status);
    projects = await r.json(); renderCards();
    try { localStorage.setItem('projets-v1', JSON.stringify(projects)); } catch {}
  } catch { if (!projects.length) renderCards(); }
}
renderFilters();
if (configured) loadProjects(); else { projects = DEMO; renderCards(); }
/* ---------- Salutation selon l'heure ---------- */
const greet = $('#greet');
if (greet) greet.textContent = new Date().getHours() >= 13 ? 'Bonsoir' : 'Bonjour';
