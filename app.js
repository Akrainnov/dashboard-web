/**
 * ==============================================================================
 * COMPASS SOLUTION POS — CLOUD DASHBOARD
 * Application Logic & Supabase Integration
 * 
 * ⚠️ AVERTISSEMENT DE SÉCURITÉ CRITIQUE :
 * Ce dashboard web s'exécute côté client dans un navigateur public.
 * Vous devez utiliser EXCLUSIVEMENT la clé publique "anon" de Supabase en lecture seule.
 * Ne JAMAIS inclure, copier, stocker ou injecter la clé secrète "service_role"
 * dans cette application web ou dans son code source !
 * ==============================================================================
 */

// Initial configuration state
const STATE = {
  supabase: null,
  user: null,
  isDemo: false,
  period: 'today', // 'today', 'week', 'month'
  activeStockTab: 'alerts', // 'all', 'alerts', 'rupture'
  charts: {},
  data: {
    resumeToday: null,
    historyVentes: [],
    produitsVendus: [],
    stocks: [],
    ventesRecentes: [],
    caisseStatut: null
  }
};

// Demo mock data for previewing without cloud setup
const DEMO_DATA = {
  resumeToday: {
    date: new Date().toISOString().split('T')[0],
    total_ca: 3840.00,
    nombre_transactions: 142,
    panier_moyen: 27.04,
    total_annulations: 65.00,
    nombre_annulations: 2,
    par_mode_paiement: { especes: 2450.00, carte: 1190.00, cheque: 200.00 },
    par_type_vente: { surPlace: 2890.00, emporter: 950.00 },
    total_depenses: 320.00,
    derniere_sync: new Date().toISOString()
  },
  historyVentes: [
    { date: '2026-09-03', total_ca: 2980.00, nombre_transactions: 112 },
    { date: '2026-09-04', total_ca: 3410.50, nombre_transactions: 128 },
    { date: '2026-09-05', total_ca: 4120.00, nombre_transactions: 156 },
    { date: '2026-09-06', total_ca: 4680.00, nombre_transactions: 178 },
    { date: '2026-09-07', total_ca: 3250.00, nombre_transactions: 120 },
    { date: '2026-09-08', total_ca: 3620.00, nombre_transactions: 135 },
    { date: new Date().toISOString().split('T')[0], total_ca: 3840.00, nombre_transactions: 142 }
  ],
  produitsVendus: [
    { produit_id: 'p1', produit_nom: 'Café Espresso', categorie: 'Cafeterie', quantite_vendue: 94, montant_total: 1410.00 },
    { produit_id: 'p2', produit_nom: 'Croissant Beurre', categorie: 'Viennoiserie', quantite_vendue: 68, montant_total: 680.00 },
    { produit_id: 'p3', produit_nom: 'Jus d\'Orange Frais', categorie: 'Boissons', quantite_vendue: 42, montant_total: 840.00 },
    { produit_id: 'p4', produit_nom: 'Formule Petit-Déjeuner', categorie: 'Formules', quantite_vendue: 28, montant_total: 1120.00 },
    { produit_id: 'p5', produit_nom: 'Thé à la Menthe', categorie: 'Cafeterie', quantite_vendue: 25, montant_total: 375.00 }
  ],
  stocks: [
    { article_id: 's1', nom: 'Café Grains Supremo', article_type: 'matierePremiere', quantite_restante: 1.2, seuil_alerte: 5.0, unite: 'kg', statut: 'bas' },
    { article_id: 's2', nom: 'Lait Entier 1L', article_type: 'matierePremiere', quantite_restante: 0.0, seuil_alerte: 10.0, unite: 'bouteille', statut: 'rupture' },
    { article_id: 's3', nom: 'Croissants Surgelés', article_type: 'produit', quantite_restante: 8, seuil_alerte: 20, unite: 'unite', statut: 'bas' },
    { article_id: 's4', nom: 'Sucre Morceaux 1kg', article_type: 'matierePremiere', quantite_restante: 15.0, seuil_alerte: 3.0, unite: 'boîte', statut: 'ok' },
    { article_id: 's5', nom: 'Gobelets Carton 8oz', article_type: 'matierePremiere', quantite_restante: 250, seuil_alerte: 50, unite: 'unite', statut: 'ok' }
  ],
  ventesRecentes: [
    { id: 'v1', date_vente: new Date(Date.now() - 4 * 60000).toISOString(), total_ttc: 45.00, mode_paiement: 'carte', type_vente: 'surPlace', statut: 'validee', nb_articles: 3 },
    { id: 'v2', date_vente: new Date(Date.now() - 14 * 60000).toISOString(), total_ttc: 25.00, mode_paiement: 'especes', type_vente: 'emporter', statut: 'validee', nb_articles: 2 },
    { id: 'v3', date_vente: new Date(Date.now() - 25 * 60000).toISOString(), total_ttc: 120.00, mode_paiement: 'carte', type_vente: 'surPlace', statut: 'validee', nb_articles: 5 }
  ],
  caisseStatut: {
    caisse_id: 'caisse_principale',
    nom_etablissement: 'Compass Café & Lounge',
    derniere_sync: new Date(Date.now() - 2 * 60000).toISOString(),
    statut: 'en_ligne',
    session_ouverte: true,
    version_app: '1.7.0'
  }
};

// Formatting helpers
function formatMoney(amount, currency = 'DH') {
  const num = Number(amount) || 0;
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(isoStr) {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(isoStr) {
  if (!isoStr) return 'Inconnu';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  return `Il y a ${Math.floor(diff / 3600)} h`;
}

// Config & Supabase Initialization
function getStoredConfig() {
  let envUrl = '';
  let envKey = '';

  // 1. Variables d'environnement Vite injectées au build (Vercel / Netlify / Vite dev)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      envUrl = import.meta.env.VITE_SUPABASE_URL || '';
      envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch {}

  // 2. Objet global window.ENV (pour hébergement statique sans Vite)
  try {
    if (!envUrl && typeof window !== 'undefined' && window.ENV) {
      envUrl = window.ENV.VITE_SUPABASE_URL || '';
      envKey = window.ENV.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch {}

  // 3. Saisie utilisateur mémorisée dans le navigateur (localStorage)
  let localUrl = '';
  let localKey = '';
  try {
    localUrl = localStorage.getItem('compass_supabase_url') || '';
    localKey = localStorage.getItem('compass_supabase_key') || '';
  } catch {}

  return {
    url: localUrl || envUrl,
    key: localKey || envKey
  };
}

function initSupabase() {
  const config = getStoredConfig();
  if (config.url && config.key && window.supabase) {
    try {
      STATE.supabase = window.supabase.createClient(config.url, config.key);
      return true;
    } catch (e) {
      console.warn('Erreur init Supabase:', e);
    }
  }
  return false;
}

// Auth handlers
async function checkAuth() {
  const authModal = document.getElementById('auth-modal');
  const userGreeting = document.getElementById('user-greeting');
  const logoutBtn = document.getElementById('logout-btn');

  // Check demo mode flag
  if (localStorage.getItem('compass_demo_mode') === 'true') {
    STATE.isDemo = true;
    authModal.classList.remove('open');
    if (userGreeting) userGreeting.textContent = 'Mode Démonstration';
    if (logoutBtn) logoutBtn.textContent = 'Quitter Démo';
    loadDemoData();
    return;
  }

  if (!initSupabase()) {
    // Open config / auth modal with guidance
    authModal.classList.add('open');
    return;
  }

  try {
    const { data: { session } } = await STATE.supabase.auth.getSession();
    if (session && session.user) {
      STATE.user = session.user;
      authModal.classList.remove('open');
      if (userGreeting) userGreeting.textContent = session.user.email || 'Admin';
      if (logoutBtn) logoutBtn.textContent = 'Déconnexion';
      loadCloudData();
    } else {
      authModal.classList.add('open');
    }
  } catch (err) {
    console.warn('Erreur vérification session:', err);
    authModal.classList.add('open');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');

  errorEl.textContent = '';
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Connexion...';

  if (!initSupabase()) {
    errorEl.textContent = 'Veuillez configurer l\'URL et la clé Supabase (icône réglages en haut à droite).';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
    return;
  }

  try {
    const { data, error } = await STATE.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    STATE.user = data.user;
    document.getElementById('auth-modal').classList.remove('open');
    document.getElementById('user-greeting').textContent = data.user.email;
    document.getElementById('logout-btn').textContent = 'Déconnexion';
    loadCloudData();
  } catch (err) {
    errorEl.textContent = err.message || 'Identifiants invalides.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
  }
}

function enableDemoMode() {
  STATE.isDemo = true;
  localStorage.setItem('compass_demo_mode', 'true');
  document.getElementById('auth-modal').classList.remove('open');
  document.getElementById('user-greeting').textContent = 'Mode Démonstration';
  document.getElementById('logout-btn').textContent = 'Quitter Démo';
  loadDemoData();
}

async function handleLogout() {
  if (STATE.isDemo) {
    localStorage.removeItem('compass_demo_mode');
    STATE.isDemo = false;
    location.reload();
    return;
  }
  if (STATE.supabase) {
    await STATE.supabase.auth.signOut();
  }
  location.reload();
}

// Data Fetching
function loadDemoData() {
  STATE.data = { ...DEMO_DATA };
  renderAll();
}

async function loadCloudData() {
  if (!STATE.supabase) return;
  const refreshIcon = document.getElementById('refresh-icon');
  if (refreshIcon) refreshIcon.classList.add('spin-anim');

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Statut Caisse
    const { data: caisseData } = await STATE.supabase
      .from('caisse_statut')
      .select('*')
      .limit(1)
      .maybeSingle();

    // 2. Ventes aujourd'hui
    const { data: resumeToday } = await STATE.supabase
      .from('ventes_journalieres')
      .select('*')
      .eq('date', todayStr)
      .maybeSingle();

    // 3. Historique 14 jours
    const { data: historyVentes } = await STATE.supabase
      .from('ventes_journalieres')
      .select('*')
      .order('date', { ascending: true })
      .limit(14);

    // 4. Produits vendus aujourd'hui (Top)
    const { data: produitsVendus } = await STATE.supabase
      .from('produits_vendus_resume')
      .select('*')
      .eq('date', todayStr)
      .order('montant_total', { ascending: false })
      .limit(10);

    // 5. Stock snapshot
    const { data: stocks } = await STATE.supabase
      .from('stock_snapshot')
      .select('*')
      .order('quantite_restante', { ascending: true });

    // 6. Ventes récentes
    const { data: ventesRecentes } = await STATE.supabase
      .from('ventes_recentes')
      .select('*')
      .order('date_vente', { ascending: false })
      .limit(15);

    STATE.data = {
      resumeToday: resumeToday || { total_ca: 0, nombre_transactions: 0, panier_moyen: 0, par_mode_paiement: {}, par_type_vente: {} },
      historyVentes: historyVentes || [],
      produitsVendus: produitsVendus || [],
      stocks: stocks || [],
      ventesRecentes: ventesRecentes || [],
      caisseStatut: caisseData || null
    };

    renderAll();
  } catch (err) {
    console.error('Erreur chargement données cloud:', err);
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('spin-anim');
  }
}

// Rendering UI
function renderAll() {
  renderHeaderStatus();
  renderKPIs();
  renderCharts();
  renderTopProducts();
  renderStockTable();
  renderRecentSales();
}

function renderHeaderStatus() {
  const dot = document.getElementById('caisse-status-dot');
  const text = document.getElementById('caisse-status-text');
  const time = document.getElementById('caisse-last-sync');
  const shopName = document.getElementById('shop-name');

  const status = STATE.data.caisseStatut;
  if (!status) {
    dot.className = 'status-dot offline';
    text.textContent = 'En attente';
    time.textContent = 'Aucune sync';
    return;
  }

  if (shopName && status.nom_etablissement) {
    shopName.textContent = status.nom_etablissement;
  }

  const lastSyncDate = new Date(status.derniere_sync);
  const isRecent = (Date.now() - lastSyncDate.getTime()) < 35 * 60 * 1000; // < 35 minutes

  if (isRecent && status.statut === 'en_ligne') {
    dot.className = 'status-dot pulse';
    text.textContent = 'Caisse Connectée';
  } else {
    dot.className = 'status-dot offline';
    text.textContent = 'Caisse Hors-Ligne';
  }
  time.textContent = `Sync : ${timeAgo(status.derniere_sync)}`;
}

function renderKPIs() {
  const r = STATE.data.resumeToday || {};
  const ca = r.total_ca || 0;
  const nb = r.nombre_transactions || 0;
  const pm = r.panier_moyen || 0;
  const depenses = r.total_depenses || 0;
  const caNet = Math.max(0, ca - depenses);

  document.getElementById('kpi-ca-today').textContent = formatMoney(ca);
  document.getElementById('kpi-transactions').textContent = `${nb} vente${nb > 1 ? 's' : ''}`;
  document.getElementById('kpi-panier-moyen').textContent = formatMoney(pm);
  document.getElementById('kpi-ca-net').textContent = formatMoney(caNet);

  // Count stock alerts
  const stocks = STATE.data.stocks || [];
  const ruptures = stocks.filter(s => s.statut === 'rupture').length;
  const bas = stocks.filter(s => s.statut === 'bas').length;
  const alertCount = ruptures + bas;

  document.getElementById('kpi-stock-alerts').textContent = alertCount;
  document.getElementById('kpi-stock-detail').textContent = `${ruptures} rupture(s) • ${bas} critique(s)`;
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Evolution du CA
  const ctxCA = document.getElementById('chart-ca')?.getContext('2d');
  if (ctxCA) {
    if (STATE.charts.ca) STATE.charts.ca.destroy();

    const history = STATE.data.historyVentes.length > 0 ? STATE.data.historyVentes : [STATE.data.resumeToday || { date: 'Aujourd\'hui', total_ca: 0 }];
    const labels = history.map(h => {
      const d = new Date(h.date);
      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    });
    const dataPoints = history.map(h => h.total_ca || 0);

    const gradient = ctxCA.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    STATE.charts.ca = new Chart(ctxCA, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Chiffre d\'affaires (DH)',
          data: dataPoints,
          borderColor: '#3b82f6',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `CA: ${formatMoney(ctx.raw)}`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  // Chart 2: Modes de Paiement
  const ctxPaiements = document.getElementById('chart-paiements')?.getContext('2d');
  if (ctxPaiements) {
    if (STATE.charts.paiements) STATE.charts.paiements.destroy();

    const modes = STATE.data.resumeToday?.par_mode_paiement || {};
    const labels = Object.keys(modes).map(m => m.charAt(0).toUpperCase() + m.slice(1));
    const values = Object.values(modes);

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

    STATE.charts.paiements = new Chart(ctxPaiements, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Aucune vente'],
        datasets: [{
          data: values.length > 0 ? values : [1],
          backgroundColor: values.length > 0 ? colors.slice(0, labels.length) : ['#334155'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } }
        },
        cutout: '72%'
      }
    });
  }
}

function renderTopProducts() {
  const tbody = document.getElementById('top-products-tbody');
  if (!tbody) return;
  const list = STATE.data.produitsVendus || [];

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Aucun produit vendu aujourd'hui</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((p, idx) => `
    <tr>
      <td><span class="badge ${idx < 3 ? 'badge-warning' : 'badge-info'}">#${idx + 1}</span></td>
      <td><strong>${escapeHtml(p.produit_nom)}</strong></td>
      <td><span class="badge">${escapeHtml(p.categorie || 'Général')}</span></td>
      <td style="text-align: right;">${p.quantite_vendue}</td>
      <td style="text-align: right; font-weight: 600; color: #60a5fa;">${formatMoney(p.montant_total)}</td>
    </tr>
  `).join('');
}

function renderStockTable() {
  const tbody = document.getElementById('stock-tbody');
  if (!tbody) return;
  let items = STATE.data.stocks || [];

  if (STATE.activeStockTab === 'alerts') {
    items = items.filter(s => s.statut === 'rupture' || s.statut === 'bas');
  } else if (STATE.activeStockTab === 'rupture') {
    items = items.filter(s => s.statut === 'rupture');
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Aucune alerte de stock à signaler ✨</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(s => {
    let badgeClass = 'badge-success';
    let label = 'OK';
    if (s.statut === 'rupture') {
      badgeClass = 'badge-danger';
      label = 'Rupture';
    } else if (s.statut === 'bas') {
      badgeClass = 'badge-warning';
      label = 'Stock bas';
    }

    return `
      <tr>
        <td><strong>${escapeHtml(s.nom)}</strong></td>
        <td><span class="badge">${s.article_type === 'matierePremiere' ? 'Ingrédient' : 'Produit'}</span></td>
        <td style="text-align: right; font-weight: 600;">${s.quantite_restante} ${s.unite}</td>
        <td style="text-align: right; color: var(--text-muted);">${s.seuil_alerte != null ? `${s.seuil_alerte} ${s.unite}` : '--'}</td>
        <td><span class="badge ${badgeClass}">${label}</span></td>
      </tr>
    `;
  }).join('');
}

function renderRecentSales() {
  const tbody = document.getElementById('recent-sales-tbody');
  if (!tbody) return;
  const list = STATE.data.ventesRecentes || [];

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Aucune transaction synchronisée</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => `
    <tr>
      <td>${formatDate(v.date_vente)}</td>
      <td><strong>${formatMoney(v.total_ttc)}</strong></td>
      <td><span class="badge badge-info">${escapeHtml(v.mode_paiement)}</span></td>
      <td><span class="badge">${escapeHtml(v.type_vente)}</span></td>
      <td><span class="badge badge-success">${escapeHtml(v.statut)}</span></td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
  // Auth & Form Handlers
  document.getElementById('auth-form')?.addEventListener('submit', handleLogin);
  document.getElementById('demo-mode-btn')?.addEventListener('click', enableDemoMode);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Refresh
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    if (STATE.isDemo) {
      loadDemoData();
    } else {
      loadCloudData();
    }
  });

  // Period buttons
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      STATE.period = e.target.dataset.period;
      // Re-filter if needed
    });
  });

  // Stock Filter tabs
  document.querySelectorAll('.stock-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.stock-tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      STATE.activeStockTab = e.target.dataset.tab;
      renderStockTable();
    });
  });

  // Config Modal
  const configModal = document.getElementById('config-modal');
  document.getElementById('config-btn')?.addEventListener('click', () => {
    const config = getStoredConfig();
    document.getElementById('cfg-url').value = config.url || '';
    document.getElementById('cfg-key').value = config.key || '';
    configModal.classList.add('open');
  });

  document.getElementById('cfg-close-btn')?.addEventListener('click', () => {
    configModal.classList.remove('open');
  });

  document.getElementById('config-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('cfg-url').value.trim();
    const key = document.getElementById('cfg-key').value.trim();
    localStorage.setItem('compass_supabase_url', url);
    localStorage.setItem('compass_supabase_key', key);
    localStorage.removeItem('compass_demo_mode');
    configModal.classList.remove('open');
    location.reload();
  });

  // Initialize
  checkAuth();

  // Periodic background refresh every 60s
  setInterval(() => {
    if (!STATE.isDemo && STATE.supabase) {
      loadCloudData();
    }
  }, 60000);
});
