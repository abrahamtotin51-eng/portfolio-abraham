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

/* ---------- Texte qui s'écrit tout seul ---------- */
(function typed() {
  const words = ['directeur artistique', 'créateur de logos', 'designer social media'];
  const t = $('#typed'); let w = 0, c = 0, del = false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { t.textContent = words[0]; return; }
  (function tick() {
    const word = words[w];
    t.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 40 : 90);
  })();
})();

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
    if (img) { thumb = el('img', 'card__thumb'); thumb.src = img.url; thumb.alt = p.nom; thumb.loading = 'lazy'; }
    else thumb = el('div', 'card__thumb', (p.fichiers || []).length ? 'PDF' : p.categorie);
    card.append(thumb, el('span', 'card__n', String(i + 1).padStart(2, '0')), el('span', 'card__t', p.nom), el('span', 'card__c', p.categorie));
    card.addEventListener('click', () => openModal(p));
    track.appendChild(card);
  });
}
function openModal(p) {
  $('#m-title').textContent = p.nom; $('#m-desc').textContent = p.description || '';
  const box = $('#m-files'); box.innerHTML = '';
  (p.fichiers || []).forEach(f => {
    if (f.type === 'image') { const i = el('img'); i.src = f.url; i.alt = p.nom; box.appendChild(i); }
    else {
      const fr = el('iframe'); fr.src = f.url; fr.title = f.name || p.nom; box.appendChild(fr);
      const a = el('a', 'modal__link', 'Ouvrir le PDF en plein écran'); a.href = f.url; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a);
    }
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

async function loadProjects(sb) {
  const { data, error } = await sb.from('projets').select('*').order('created_at', { ascending: false });
  projects = error ? [] : data; renderCards();
}
renderFilters();
if (configured) {
  const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  loadProjects(sb);
  sb.channel('projets-live').on('postgres_changes', { event: '*', schema: 'public', table: 'projets' }, () => loadProjects(sb)).subscribe();
} else { projects = DEMO; renderCards(); }
