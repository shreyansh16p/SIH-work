/* =============================================================
   ArogyaX — Main Application (Vanilla JS SPA)
   Patient Case-Taking & Clinical Summarization Platform
   SIH26047 Hackathon Demo
   ============================================================= */

// ---- Global State ----
const State = {
  currentPage: 'login',       // login | home | patientDash | wizard | aiSummary | doctorDash | comingSoon
  authMode: 'doctor',         // doctor | patient
  patientAuthTab: 'login',    // login | register
  currentUser: null,          // { role, name, id, email }
  wizardStep: 1,
  wizardData: {
    step1: {}, step2: {}, step3: {}, step4: {}, step5: {}
  },
  patients: [],
  sidebarCollapsed: false,
  activeNav: 'dashboard',
  toast: null,
  comingSoonSection: null,    // { label, icon } — set before routing to 'comingSoon'
};

// ---- Demo Doctor Credentials ----
const DOCTOR_CREDENTIALS = { email: 'doctor@arogyax.in', password: 'Demo@1234' };

// ---- Helpers ----
function generatePatientId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return 'UHD-' + id;
}
function saveState() {
  try { localStorage.setItem('arogyax_state', JSON.stringify({ currentUser: State.currentUser, patients: State.patients })); }
  catch(e) {}
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('arogyax_state') || '{}');
    if (s.currentUser) State.currentUser = s.currentUser;
    if (s.patients)    State.patients    = s.patients;
  } catch(e) {}
}
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.getElementById('toast-container');
  if (!t) return;
  t.innerHTML = `<div class="toast ${type}">${icons[type]} ${msg}</div>`;
  setTimeout(() => { t.innerHTML = ''; }, 3500);
}
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ---- SVG LOGO ----
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="38" height="38">
  <defs>
    <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0EA5A0"/>
      <stop offset="50%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#22C55E"/>
    </linearGradient>
  </defs>
  <!-- Cross body -->
  <rect x="30" y="10" width="40" height="80" rx="8" fill="url(#lg1)" opacity="0.9"/>
  <rect x="10" y="30" width="80" height="40" rx="8" fill="url(#lg1)" opacity="0.9"/>
  <!-- White inset cross -->
  <rect x="34" y="14" width="32" height="72" rx="6" fill="white" opacity="0.15"/>
  <rect x="14" y="34" width="72" height="32" rx="6" fill="white" opacity="0.15"/>
  <!-- Pulse line -->
  <polyline points="22,50 32,50 36,38 41,62 46,44 51,56 56,50 78,50" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Leaf motif at end -->
  <ellipse cx="84" cy="48" rx="7" ry="4" fill="white" opacity="0.85" transform="rotate(-30,84,48)"/>
  <line x1="79" y1="50" x2="84" y2="44" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

const LOGO_SVG_LARGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="56" height="56">
  <defs>
    <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0EA5A0"/>
      <stop offset="50%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#22C55E"/>
    </linearGradient>
  </defs>
  <rect x="30" y="10" width="40" height="80" rx="8" fill="url(#lg2)" opacity="0.9"/>
  <rect x="10" y="30" width="80" height="40" rx="8" fill="url(#lg2)" opacity="0.9"/>
  <rect x="34" y="14" width="32" height="72" rx="6" fill="white" opacity="0.15"/>
  <rect x="14" y="34" width="72" height="32" rx="6" fill="white" opacity="0.15"/>
  <polyline points="22,50 32,50 36,38 41,62 46,44 51,56 56,50 78,50" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="84" cy="48" rx="7" ry="4" fill="white" opacity="0.85" transform="rotate(-30,84,48)"/>
  <line x1="79" y1="50" x2="84" y2="44" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

// ---- WORDMARK ----
function logoWordmark(size = 'md') {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };
  return `<span class="font-black ${sizes[size]} tracking-tight" style="color:#1E3A8A">AROGYA</span><span class="font-black ${sizes[size]} tracking-tight gradient-text">X</span>`;
}

// ===========================
//   RENDER ENGINE
// ===========================
function render() {
  const app = document.getElementById('app');
  if (!app) return;
  switch(State.currentPage) {
    case 'home':        app.innerHTML = renderHome();       break;
    case 'login':       app.innerHTML = renderLogin();      break;
    case 'patientDash': app.innerHTML = renderAppShell(renderPatientDashboard()); break;
    case 'wizard':      app.innerHTML = renderAppShell(renderWizard()); break;
    case 'aiSummary':   app.innerHTML = renderAppShell(renderAISummary()); break;
    case 'doctorDash':  app.innerHTML = renderAppShell(renderDoctorDashboard()); break;
    case 'patientsPage':app.innerHTML = renderAppShell(renderPatientsPage()); break;
    case 'reportsPage': app.innerHTML = renderAppShell(renderReportsPage()); break;
    case 'recordsPage': app.innerHTML = renderAppShell(renderRecordsPage()); break;
    case 'profilePage': app.innerHTML = renderAppShell(renderProfilePage()); break;
    case 'comingSoon':  app.innerHTML = renderAppShell(renderComingSoon(State.comingSoonSection?.label || 'Section', State.comingSoonSection?.icon || '🚧')); break;
    default:            app.innerHTML = renderHome();
  }
  attachEvents();
}

// ===========================
//   SIDEBAR
// ===========================
function renderSidebar() {
  const role = State.currentUser?.role;
  const patientNavItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'newcase',   icon: '📋', label: 'New Case' },
    { id: 'records',   icon: '📁', label: 'My Records' },
    { id: 'reports',   icon: '📄', label: 'Reports' },
    { id: 'profile',   icon: '👤', label: 'My Profile' },
    { id: 'settings',  icon: '⚙️',  label: 'Settings' },
  ];
  const doctorNavItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'patients',  icon: '🧑‍⚕️', label: 'Patients' },
    { id: 'newcase',   icon: '📋', label: 'New Case' },
    { id: 'reports',   icon: '📄', label: 'Reports' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: 'settings',  icon: '⚙️',  label: 'Settings' },
  ];
  const navItems = role === 'doctor' ? doctorNavItems : patientNavItems;
  const collapsed = State.sidebarCollapsed;

  return `
  <aside class="sidebar ${collapsed ? 'collapsed' : ''}" id="sidebar">
    <div class="sidebar-logo">
      ${LOGO_SVG}
      ${collapsed ? '' : `<div>${logoWordmark('md')}</div>`}
      <button class="ml-auto btn-ghost p-1 text-lg" id="sidebar-toggle" title="Toggle sidebar">☰</button>
    </div>

    <!-- Search -->
    ${!collapsed ? `
    <div class="px-3 py-2">
      <div class="search-bar">
        <span class="text-slate-400">🔍</span>
        <input type="text" placeholder="Search..." class="text-sm" />
      </div>
    </div>` : ''}

    <!-- Nav -->
    <nav class="flex-1 py-2 overflow-y-auto">
      ${navItems.map(item => `
        <button class="nav-item ${State.activeNav === item.id ? 'active' : ''}" data-nav="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          ${collapsed ? '' : `<span>${item.label}</span>`}
        </button>
      `).join('')}
    </nav>

    <!-- Bottom -->
    <div class="border-t border-slate-100 p-3">
      ${!collapsed ? `
      <div class="flex items-center gap-2 px-2 py-1 mb-2">
        <div class="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          ${(State.currentUser?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-700 truncate">${State.currentUser?.name || 'User'}</div>
          <div class="text-xs text-slate-400 truncate">${State.currentUser?.role === 'doctor' ? 'Doctor' : 'Patient'}</div>
        </div>
      </div>` : ''}
      <button class="nav-item w-full text-red-400" id="logout-btn">
        <span class="nav-icon">🚪</span>
        ${collapsed ? '' : '<span>Sign Out</span>'}
      </button>
    </div>
  </aside>`;
}

function renderAppShell(content) {
  const ml = State.sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]';
  return `
  <div class="flex min-h-screen">
    ${renderSidebar()}
    <div class="main-content flex-1 ${ml} transition-all duration-300" style="margin-left: ${State.sidebarCollapsed ? '72px' : '260px'}">
      <!-- Top Bar -->
      <header class="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40" style="box-shadow: 0 2px 20px rgba(30,58,138,0.06)">
        <div>
          <h2 class="text-sm font-semibold text-slate-400">${getPageTitle()}</h2>
        </div>
        <div class="flex items-center gap-3">
          <button class="relative btn-ghost p-2 text-xl" title="Notifications">
            🔔
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400"></span>
          </button>
          ${State.currentUser?.role === 'patient' ? `<div class="patient-id-badge hidden sm:flex">🪪 ${State.currentUser?.id || ''}</div>` : `
          <div class="hidden sm:flex items-center gap-1 badge badge-navy">
            <span>👨‍⚕️</span> Dr. ${State.currentUser?.name || ''}
          </div>`}
        </div>
      </header>
      <!-- Page Content -->
      <main class="p-4 md:p-6 page">
        ${content}
      </main>
    </div>
  </div>
  <div id="toast-container"></div>`;
}

function getPageTitle() {
  const titles = {
    patientDash: 'Patient Dashboard', wizard: 'Case Taking Wizard',
    aiSummary: 'Clinical Summary', doctorDash: 'Doctor Dashboard'
  };
  return titles[State.currentPage] || 'ArogyaX';
}

// ===========================
//   LOGIN PAGE
// ===========================
function renderLogin() {
  const isDoctor  = State.authMode === 'doctor';
  const isPLogin  = State.patientAuthTab === 'login';
  return `
  <div class="login-bg">
    <!-- Floating decorative circles -->
    <div style="position:absolute;top:10%;left:5%;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
    <div style="position:absolute;bottom:15%;right:8%;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

    <div class="login-card">
      <!-- Logo -->
      <div class="text-center mb-6">
        <div class="flex justify-center mb-3">${LOGO_SVG_LARGE}</div>
        <div class="flex justify-center items-center gap-1 mb-1">${logoWordmark('lg')}</div>
        <p class="text-slate-500 text-sm">Patient Case-Taking &amp; Clinical Summarization</p>
        <div class="badge badge-navy mt-2">SIH26047</div>
      </div>

      <!-- Auth Mode Tabs -->
      <div class="tab-bar mb-6">
        <button class="tab-btn ${isDoctor ? 'active' : ''}" id="tab-doctor">👨‍⚕️ Doctor Login</button>
        <button class="tab-btn ${!isDoctor ? 'active' : ''}" id="tab-patient">🧑‍💼 Patient Login</button>
      </div>

      <!-- Doctor Login Form -->
      ${isDoctor ? `
      <div id="doctor-form">
        <div class="input-group">
          <label class="input-label" for="doc-email">Email Address</label>
          <input type="email" id="doc-email" class="input-field" placeholder="doctor@arogyax.in" value="doctor@arogyax.in" autocomplete="email"/>
        </div>
        <div class="input-group">
          <label class="input-label" for="doc-pass">Password</label>
          <div class="relative">
            <input type="password" id="doc-pass" class="input-field" placeholder="Enter password" value="Demo@1234" autocomplete="current-password"/>
            <button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" onclick="togglePassword('doc-pass',this)">👁</button>
          </div>
        </div>
        <div class="flex items-center justify-between mb-4 text-sm">
          <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked class="accent-teal-500"/> <span class="text-slate-600">Remember me</span></label>
          <a href="#" class="text-primary font-medium hover:underline">Forgot password?</a>
        </div>
        <button class="btn-primary w-full py-3 text-base" id="doctor-login-btn">Sign In as Doctor</button>
        <div class="mt-4 p-3 rounded-xl bg-gradient-card border border-teal-100">
          <p class="text-xs text-slate-500 text-center">Demo credentials: <span class="font-semibold text-slate-700">doctor@arogyax.in</span> / <span class="font-semibold text-slate-700">Demo@1234</span></p>
        </div>
      </div>` : `
      <!-- Patient Auth -->
      <div id="patient-form">
        <div class="tab-bar mb-4">
          <button class="tab-btn ${isPLogin ? 'active' : ''}" id="ptab-login">Login</button>
          <button class="tab-btn ${!isPLogin ? 'active' : ''}" id="ptab-register">Register</button>
        </div>
        ${isPLogin ? renderPatientLogin() : renderPatientRegister()}
      </div>`}

      <p class="text-center text-xs text-slate-400 mt-6">
        &copy; 2026 ArogyaX &mdash; Secure Healthcare Platform &middot; SIH26047
      </p>
    </div>
  </div>
  <div id="toast-container"></div>`;
}

function renderPatientLogin() {
  return `
  <div class="input-group">
    <label class="input-label" for="p-email">Patient ID or Email</label>
    <input type="text" id="p-email" class="input-field" placeholder="UHD-XXXXXX or email@example.com"/>
  </div>
  <div class="input-group">
    <label class="input-label" for="p-pass">Password</label>
    <div class="relative">
      <input type="password" id="p-pass" class="input-field" placeholder="Enter your password" autocomplete="current-password"/>
      <button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" onclick="togglePassword('p-pass',this)">👁</button>
    </div>
  </div>
  <button class="btn-primary w-full py-3 text-base mt-2" id="patient-login-btn">Sign In</button>
  <p class="text-center text-sm text-slate-500 mt-3">Don't have an account? <button class="text-primary font-semibold" id="goto-register">Register here</button></p>`;
}

function renderPatientRegister() {
  return `
  <div class="grid grid-cols-2 gap-3">
    <div class="input-group col-span-2">
      <label class="input-label" for="r-name">Full Name *</label>
      <input type="text" id="r-name" class="input-field" placeholder="Your full name"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="r-email">Email *</label>
      <input type="email" id="r-email" class="input-field" placeholder="email@example.com"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="r-phone">Phone *</label>
      <input type="tel" id="r-phone" class="input-field" placeholder="+91 9876543210"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="r-pass">Password *</label>
      <input type="password" id="r-pass" class="input-field" placeholder="Create password" autocomplete="new-password"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="r-cpass">Confirm Password *</label>
      <input type="password" id="r-cpass" class="input-field" placeholder="Confirm password" autocomplete="new-password"/>
    </div>
  </div>
  <!-- Captcha Placeholder -->
  <div class="input-group">
    <label class="input-label">Security Verification</label>
    <div class="captcha-box" id="captcha-box">
      <div class="flex items-center gap-3">
        <div id="captcha-check" class="w-5 h-5 border-2 border-slate-300 rounded flex items-center justify-center text-sm transition-all" style="cursor:pointer">
          <span id="captcha-tick" class="hidden">✓</span>
        </div>
        <span class="text-sm text-slate-600">I am not a robot</span>
      </div>
      <div class="flex items-center gap-1">
        <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="24" height="24" style="opacity:0.5" alt="reCAPTCHA" onerror="this.style.display='none'" />
        <div class="text-right">
          <div class="text-xs text-slate-400 font-semibold">reCAPTCHA</div>
          <div class="text-xs text-slate-300">Privacy · Terms</div>
        </div>
      </div>
    </div>
  </div>
  <button class="btn-primary w-full py-3 text-base mt-1" id="patient-register-btn">Create Account</button>
  <p class="text-center text-sm text-slate-500 mt-3">Already registered? <button class="text-primary font-semibold" id="goto-login">Sign in here</button></p>`;
}

// ===========================
//   PATIENT DASHBOARD
// ===========================
function renderPatientDashboard() {
  const patient = State.currentUser;
  const hasCase = State.wizardData?.step1?.fullName;

  return `
  <div class="animate-fade-in">
    <!-- Welcome Banner -->
    <div class="rounded-2xl p-6 mb-6 text-white overflow-hidden relative" style="background: linear-gradient(135deg,#1E3A8A 0%,#0EA5A0 60%,#22C55E 100%)">
      <div style="position:absolute;top:-30px;right:-30px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
      <div style="position:absolute;bottom:-20px;left:30%;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>
      <div class="relative">
        <p class="text-white/70 text-sm mb-1">Welcome back 👋</p>
        <h1 class="text-2xl font-bold mb-2">${patient?.name || 'Patient'}</h1>
        <div class="flex flex-wrap gap-3 items-center">
          <div class="patient-id-badge bg-white/20 border border-white/30" style="background:rgba(255,255,255,0.2)">🪪 ${patient?.id || generatePatientId()}</div>
          <span class="badge" style="background:rgba(255,255,255,0.2);color:white">🩺 Patient Account</span>
        </div>
        <p class="text-white/60 text-xs mt-3">Last updated: ${new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      ${[
        { icon: '📋', label: 'Total Cases', value: hasCase ? '1' : '0', color: 'badge-teal' },
        { icon: '✅', label: 'Completed', value: hasCase ? '1' : '0', color: 'badge-green' },
        { icon: '⏳', label: 'Pending Review', value: '0', color: 'badge-orange' },
        { icon: '📄', label: 'Reports', value: hasCase ? '1' : '0', color: 'badge-navy' },
      ].map(s => `
      <div class="card-stat">
        <div class="flex items-center justify-between mb-2">
          <div class="text-2xl">${s.icon}</div>
          <span class="badge ${s.color}">${s.value}</span>
        </div>
        <div class="text-2xl font-bold text-navy mb-1">${s.value}</div>
        <div class="text-xs font-medium text-slate-400">${s.label}</div>
      </div>`).join('')}
    </div>

    <!-- Quick Actions -->
    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <div class="card p-5 col-span-2">
        <h3 class="font-bold text-navy mb-4 flex items-center gap-2">📋 Quick Actions</h3>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn-primary flex items-center justify-center gap-2 py-3" id="start-new-case-btn">
            ➕ Start New Case
          </button>
          <button class="btn-outline flex items-center justify-center gap-2 py-3" onclick="showToast('No reports available yet.','info')">
            📄 View Reports
          </button>
          <button class="btn-ghost border border-slate-200 flex items-center justify-center gap-2 py-3" onclick="showToast('Records will appear here.','info')">
            📁 My Records
          </button>
          <button class="btn-ghost border border-slate-200 flex items-center justify-center gap-2 py-3" onclick="showToast('No upcoming appointments.','info')">
            📅 Appointments
          </button>
        </div>
      </div>
      <div class="card p-5">
        <h3 class="font-bold text-navy mb-4">🔔 Health Reminders</h3>
        <div class="space-y-3">
          ${[
            { icon: '💊', text: 'Take prescribed medication at 8:00 AM', color: 'bg-teal-50' },
            { icon: '🩺', text: 'Scheduled checkup in 7 days', color: 'bg-blue-50' },
            { icon: '💧', text: 'Drink 8 glasses of water daily', color: 'bg-green-50' },
          ].map(r => `
          <div class="flex items-start gap-2 p-2 rounded-lg ${r.color}">
            <span>${r.icon}</span>
            <span class="text-xs text-slate-600">${r.text}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Recent Cases -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-navy flex items-center gap-2">📁 Case History</h3>
        <button class="btn-primary text-sm px-4 py-2" id="start-new-case-btn2">New Case</button>
      </div>
      ${hasCase ? `
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr>
            <th>Case ID</th><th>Date</th><th>Chief Complaint</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody>
            <tr>
              <td><span class="font-mono text-xs font-semibold text-primary">CASE-001</span></td>
              <td>${new Date().toLocaleDateString('en-IN')}</td>
              <td>${State.wizardData.step2?.complaintName || 'General Checkup'}</td>
              <td><span class="badge badge-green">Completed</span></td>
              <td><button class="btn-primary text-xs px-3 py-1" id="view-summary-btn">View Summary</button></td>
            </tr>
          </tbody>
        </table>
      </div>` : `
      <div class="text-center py-12 text-slate-400">
        <div class="text-5xl mb-3">📋</div>
        <p class="font-semibold">No cases yet</p>
        <p class="text-sm mt-1">Start a new case to begin your health journey</p>
        <button class="btn-primary mt-4" id="start-new-case-btn3">Start Your First Case</button>
      </div>`}
    </div>
  </div>`;
}

// ===========================
//   WIZARD
// ===========================
function renderWizard() {
  const step = State.wizardStep;
  // 4 data-entry steps + 1 review step (review page is step 5, not counted in stepper)
  const stepperSteps = ['Patient Registration','Chief Complaints','Medical History','Allergy & Social History'];
  const isReview = step === 5;
  return `
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-navy">Case-Taking Wizard</h1>
        <p class="text-sm text-slate-400">${isReview ? 'Review & Submit' : 'Step ' + step + ' of 4 — ' + stepperSteps[step-1]}</p>
      </div>
      <div class="badge badge-navy">📋 New Case</div>
    </div>

    <!-- Stepper (4 data steps only) -->
    <div class="card p-4 mb-6">
      <div class="stepper">
        ${stepperSteps.map((label, i) => {
          const n = i + 1;
          // when on review page (step 5), all 4 are completed
          const cls = isReview || n < step ? 'completed' : n === step ? 'active' : '';
          return `
          <div class="step-item ${cls}">
            <div class="step-circle ${cls}">
              ${(isReview || n < step) ? '✓' : n}
            </div>
            <span class="step-label ${cls} hidden sm:block">${label}</span>
          </div>`;
        }).join('')}
        <!-- Review indicator -->
        <div class="step-item ${isReview ? 'active' : ''}">
          <div class="step-circle ${isReview ? 'active' : ''}" style="font-size:1rem;">✅</div>
          <span class="step-label ${isReview ? 'active' : ''} hidden sm:block">Review</span>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="card p-6 section-card">
      ${step === 1 ? renderStep1() :
        step === 2 ? renderStep2() :
        step === 3 ? renderStep3() :
        step === 4 ? renderStep4() :
                     renderStep5()}
    </div>

    <!-- Navigation Buttons (steps 1–4 only; step 5/review has its own submit button) -->
    ${step < 5 ? `
    <div class="flex justify-between mt-4">
      ${step > 1
        ? `<button class="btn-outline" id="wizard-back">← Back</button>`
        : `<div></div>`}
      <button class="btn-primary px-8" id="wizard-next">${step === 4 ? 'Review & Submit →' : 'Next Step →'}</button>
    </div>` : ''}
  </div>`;
}

// ---------- STEP 1 ----------
function renderStep1() {
  const d = State.wizardData.step1;
  return `
  <h2 class="text-lg font-bold text-navy mb-5 flex items-center gap-2">👤 Patient Registration</h2>

  <!-- Photo Upload -->
  <div class="flex justify-center mb-6">
    <div class="text-center">
      <div class="photo-upload mx-auto" id="photo-upload-area" onclick="document.getElementById('photo-file').click()">
        <img id="photo-preview" src="${d.photoUrl || ''}" style="display:${d.photoUrl ? 'block' : 'none'}" alt="Photo"/>
        <div id="photo-placeholder" style="display:${d.photoUrl ? 'none' : 'flex'}" class="flex-col items-center text-slate-400">
          <span class="text-2xl">📷</span>
          <span class="text-xs mt-1">Upload Photo</span>
          <span class="text-xs">(Optional)</span>
        </div>
      </div>
      <input type="file" id="photo-file" accept="image/*" class="hidden" onchange="handlePhotoUpload(this)"/>
      <p class="text-xs text-slate-400 mt-2">Click to upload (JPG, PNG)</p>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div class="input-group">
      <label class="input-label" for="s1-name">Full Name *</label>
      <input type="text" id="s1-name" class="input-field" placeholder="Full legal name" value="${d.fullName || ''}"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-gender">Gender *</label>
      <select id="s1-gender" class="input-field">
        <option value="">Select gender</option>
        ${['Male','Female','Other','Prefer not to say'].map(g => `<option ${d.gender===g?'selected':''}>${g}</option>`).join('')}
      </select>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-dob">Date of Birth</label>
      <input type="date" id="s1-dob" class="input-field" value="${d.dob || ''}"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-age">Age (years)</label>
      <input type="number" id="s1-age" class="input-field" placeholder="Or enter age directly" value="${d.age || ''}" min="0" max="150"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-blood">Blood Group</label>
      <select id="s1-blood" class="input-field">
        <option value="">Select blood group</option>
        ${['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => `<option ${d.bloodGroup===g?'selected':''}>${g}</option>`).join('')}
      </select>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-contact">Contact Number *</label>
      <input type="tel" id="s1-contact" class="input-field" placeholder="+91 9876543210" value="${d.contact || ''}"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-weight">Weight (kg)</label>
      <input type="number" id="s1-weight" class="input-field" placeholder="e.g. 65" value="${d.weight || ''}" min="1" max="500" step="0.1"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-height">Height (cm)</label>
      <input type="number" id="s1-height" class="input-field" placeholder="e.g. 165" value="${d.height || ''}" min="50" max="300"/>
    </div>
    <div class="input-group col-span-full">
      <label class="input-label" for="s1-bmi">BMI (auto-calculated)</label>
      <input type="text" id="s1-bmi" class="input-field bg-slate-50" placeholder="Enter weight and height above" value="${d.bmi || ''}" readonly/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-ec-name">Emergency Contact Name</label>
      <input type="text" id="s1-ec-name" class="input-field" placeholder="Contact person name" value="${d.ecName || ''}"/>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-ec-phone">Emergency Contact Phone</label>
      <input type="tel" id="s1-ec-phone" class="input-field" placeholder="+91 9876543210" value="${d.ecPhone || ''}"/>
    </div>
    <div class="input-group col-span-full">
      <label class="input-label" for="s1-address">Address</label>
      <textarea id="s1-address" class="input-field" rows="2" placeholder="House number, street, city, state, PIN code">${d.address || ''}</textarea>
    </div>
    ${State.currentUser?.role !== 'patient' ? `
    <div class="input-group">
      <label class="input-label" for="s1-pass">Create Password *</label>
      <div class="relative">
        <input type="password" id="s1-pass" class="input-field" placeholder="Create a secure password" value="${d.password || ''}"/>
        <button class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" onclick="togglePassword('s1-pass',this)">👁</button>
      </div>
    </div>
    <div class="input-group">
      <label class="input-label" for="s1-cpass">Confirm Password *</label>
      <input type="password" id="s1-cpass" class="input-field" placeholder="Confirm your password" value="${d.cpassword || ''}"/>
    </div>
    <!-- Captcha -->
    <div class="input-group col-span-full">
      <label class="input-label">Security Verification</label>
      <div class="captcha-box" id="captcha-step">
        <div class="flex items-center gap-3">
          <div id="captcha-s1-check" class="w-5 h-5 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer" onclick="toggleCaptcha('captcha-s1-check','captcha-s1-tick')">
            <span id="captcha-s1-tick" class="hidden text-green-500 font-bold">✓</span>
          </div>
          <span class="text-sm text-slate-600">I am not a robot</span>
        </div>
        <span class="text-xs text-slate-400">reCAPTCHA</span>
      </div>
    </div>` : ''}
  </div>`;
}

// ---------- STEP 2 ----------
function renderStep2() {
  const d = State.wizardData.step2;
  const symptoms = ['Fever','Headache','Cough','Body Pain','Weakness','Itching','Diarrhea','Vomiting','Nausea','Chest Pain','Breathlessness','Joint Pain','Fatigue','Loss of Appetite','Swelling'];
  const selected = d.symptoms || [];
  const selectedBodyRegions = d.bodyRegions || [];
  const bodyMapView = d.bodyMapView || '2d';
  return `
  <h2 class="text-lg font-bold text-navy mb-5 flex items-center gap-2">🩺 Chief Complaints &amp; Present Illness</h2>

  <div class="grid md:grid-cols-2 gap-4 mb-4">
    <div class="input-group">
      <label class="input-label" for="s2-complaint">Complaint Name *</label>
      <input type="text" id="s2-complaint" class="input-field" placeholder="Main reason for visit" value="${d.complaintName || ''}"/>
    </div>
    <div class="input-group">
      <label class="input-label">Duration</label>
      <div class="flex gap-2">
        <input type="number" id="s2-dur-val" class="input-field w-24" placeholder="e.g. 3" value="${d.durationVal || ''}" min="1"/>
        <select id="s2-dur-unit" class="input-field">
          ${['Hours','Days','Weeks','Months','Years'].map(u => `<option ${d.durationUnit===u?'selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="input-group">
      <label class="input-label">Onset of Symptoms</label>
      <div class="flex gap-3">
        ${['Sudden','Gradual'].map(o => `
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="onset" value="${o}" ${d.onset===o?'checked':''} class="accent-teal-500"/>
          <span class="text-sm font-medium ${d.onset===o?'text-primary':'text-slate-600'}">${o}</span>
        </label>`).join('')}
      </div>
    </div>
    <div class="input-group">
      <label class="input-label">Progression</label>
      <select id="s2-progression" class="input-field">
        <option value="">Select</option>
        ${['Improving','Worsening','Static','Fluctuating'].map(p => `<option ${d.progression===p?'selected':''}>${p}</option>`).join('')}
      </select>
    </div>
  </div>

  <!-- Symptom Chips -->
  <div class="input-group">
    <label class="input-label">Associated Symptoms (Select all that apply)</label>
    <div class="flex flex-wrap gap-2 mt-2" id="symptom-chips">
      ${symptoms.map(s => `
      <div class="chip ${selected.includes(s)?'selected':''}" data-symptom="${s}" onclick="toggleSymptom(this,'${s}')">
        ${s}
      </div>`).join('')}
      <div class="chip ${selected.includes('Other')?'selected':''}" data-symptom="Other" onclick="toggleSymptom(this,'Other')">
        + Other
      </div>
    </div>
    <input type="hidden" id="selected-symptoms" value="${selected.join(',')}"/>
  </div>

  <!-- Other symptom text -->
  <div class="input-group ${selected.includes('Other') ? '' : 'hidden'}" id="other-symptom-group">
    <label class="input-label" for="s2-other">Specify Other Symptom</label>
    <input type="text" id="s2-other" class="input-field" placeholder="Describe other symptom" value="${d.otherSymptom || ''}"/>
  </div>

  <!-- Severity Slider -->
  <div class="input-group">
    <label class="input-label">Severity of Symptoms (1 = Mild, 10 = Severe) — Current: <span id="severity-display" class="font-bold text-primary">${d.severity || 5}</span>/10</label>
    <div class="flex items-center gap-3 mt-2">
      <span class="text-xs text-slate-400">Mild</span>
      <input type="range" id="s2-severity" min="1" max="10" value="${d.severity || 5}" oninput="document.getElementById('severity-display').textContent=this.value" class="flex-1"/>
      <span class="text-xs text-slate-400">Severe</span>
    </div>
  </div>

  <!-- ===== BODY MAP ===== -->
  <div class="input-group mb-2">
    <label class="input-label">Symptom Location — Body Map</label>
    <div class="flex items-center gap-3 mb-3">
      <div class="tab-bar" style="width:200px">
        <button class="tab-btn ${bodyMapView === '2d' ? 'active' : ''}" id="bodymap-2d-btn" onclick="switchBodyMap('2d')">🗺 2D View</button>
        <button class="tab-btn ${bodyMapView === '3d' ? 'active' : ''}" id="bodymap-3d-btn" onclick="switchBodyMap('3d')">🌐 3D View</button>
      </div>
      <span class="text-xs text-slate-400">Click body regions to mark affected areas</span>
    </div>

    <!-- 2D Body Map -->
    <div id="bodymap-2d-panel" style="display:${bodyMapView === '3d' ? 'none' : 'block'}">
      <div class="flex gap-4 items-start justify-center flex-wrap">
        <!-- Front SVG -->
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-400 mb-1">Front View</div>
          <svg id="body2d-front" viewBox="0 0 120 280" width="110" height="260" style="cursor:pointer;" xmlns="http://www.w3.org/2000/svg">
            <!-- Head -->
            <ellipse id="br-head" class="body-region" cx="60" cy="22" rx="18" ry="20" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Head',this)" data-region="Head"/>
            <text x="60" y="27" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Head</text>
            <!-- Neck -->
            <rect id="br-neck" class="body-region" x="53" y="41" width="14" height="12" rx="3" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Neck',this)" data-region="Neck"/>
            <!-- Chest -->
            <rect id="br-chest" class="body-region" x="36" y="54" width="48" height="45" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Chest',this)" data-region="Chest"/>
            <text x="60" y="80" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Chest</text>
            <!-- Abdomen -->
            <rect id="br-abdomen" class="body-region" x="36" y="100" width="48" height="38" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Abdomen',this)" data-region="Abdomen"/>
            <text x="60" y="122" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Abdomen</text>
            <!-- Pelvis -->
            <rect id="br-pelvis" class="body-region" x="36" y="139" width="48" height="22" rx="4" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Pelvis',this)" data-region="Pelvis"/>
            <text x="60" y="153" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Pelvis</text>
            <!-- Left arm -->
            <rect id="br-left-arm" class="body-region" x="18" y="54" width="16" height="65" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Arm',this)" data-region="Left Arm"/>
            <text x="26" y="88" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">L.Arm</text>
            <!-- Right arm -->
            <rect id="br-right-arm" class="body-region" x="86" y="54" width="16" height="65" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Arm',this)" data-region="Right Arm"/>
            <text x="94" y="88" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">R.Arm</text>
            <!-- Left hand -->
            <ellipse id="br-left-hand" class="body-region" cx="26" cy="128" rx="9" ry="7" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Hand',this)" data-region="Left Hand"/>
            <!-- Right hand -->
            <ellipse id="br-right-hand" class="body-region" cx="94" cy="128" rx="9" ry="7" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Hand',this)" data-region="Right Hand"/>
            <!-- Left thigh -->
            <rect id="br-left-thigh" class="body-region" x="37" y="163" width="21" height="48" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Thigh',this)" data-region="Left Thigh"/>
            <text x="47" y="190" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">L.Thigh</text>
            <!-- Right thigh -->
            <rect id="br-right-thigh" class="body-region" x="62" y="163" width="21" height="48" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Thigh',this)" data-region="Right Thigh"/>
            <text x="72" y="190" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">R.Thigh</text>
            <!-- Left leg -->
            <rect id="br-left-leg" class="body-region" x="37" y="213" width="21" height="42" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Leg',this)" data-region="Left Leg"/>
            <text x="47" y="237" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">L.Leg</text>
            <!-- Right leg -->
            <rect id="br-right-leg" class="body-region" x="62" y="213" width="21" height="42" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Leg',this)" data-region="Right Leg"/>
            <text x="72" y="237" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">R.Leg</text>
            <!-- Left foot -->
            <ellipse id="br-left-foot" class="body-region" cx="46" cy="260" rx="11" ry="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Foot',this)" data-region="Left Foot"/>
            <!-- Right foot -->
            <ellipse id="br-right-foot" class="body-region" cx="74" cy="260" rx="11" ry="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Foot',this)" data-region="Right Foot"/>
          </svg>
        </div>
        <!-- Back SVG -->
        <div class="text-center">
          <div class="text-xs font-semibold text-slate-400 mb-1">Back View</div>
          <svg id="body2d-back" viewBox="0 0 120 280" width="110" height="260" style="cursor:pointer;" xmlns="http://www.w3.org/2000/svg">
            <ellipse class="body-region" cx="60" cy="22" rx="18" ry="20" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Back of Head',this)" data-region="Back of Head"/>
            <text x="60" y="27" text-anchor="middle" font-size="6" fill="#64748B" pointer-events="none">Head</text>
            <rect class="body-region" x="36" y="54" width="48" height="45" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Upper Back',this)" data-region="Upper Back"/>
            <text x="60" y="80" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Upper Back</text>
            <rect class="body-region" x="36" y="100" width="48" height="38" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Lower Back',this)" data-region="Lower Back"/>
            <text x="60" y="122" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Lower Back</text>
            <rect class="body-region" x="36" y="139" width="48" height="22" rx="4" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Buttocks',this)" data-region="Buttocks"/>
            <text x="60" y="153" text-anchor="middle" font-size="7" fill="#64748B" pointer-events="none">Buttocks</text>
            <rect class="body-region" x="18" y="54" width="16" height="65" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Shoulder',this)" data-region="Left Shoulder"/>
            <rect class="body-region" x="86" y="54" width="16" height="65" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Shoulder',this)" data-region="Right Shoulder"/>
            <rect class="body-region" x="37" y="163" width="21" height="90" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Left Leg (back)',this)" data-region="Left Leg (back)"/>
            <rect class="body-region" x="62" y="163" width="21" height="90" rx="5" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5" onclick="toggle2DRegion('Right Leg (back)',this)" data-region="Right Leg (back)"/>
          </svg>
        </div>
        <!-- Legend -->
        <div class="flex flex-col gap-2 justify-center">
          <div class="flex items-center gap-2 text-xs text-slate-500"><div style="width:14px;height:14px;border-radius:3px;background:#E2E8F0;border:1.5px solid #94A3B8"></div> Not selected</div>
          <div class="flex items-center gap-2 text-xs text-slate-500"><div style="width:14px;height:14px;border-radius:3px;background:linear-gradient(135deg,#0EA5A0,#22C55E)"></div> Selected</div>
        </div>
      </div>
    </div>

    <!-- 3D Body Map -->
    <div id="bodymap-3d-panel" style="display:${bodyMapView === '3d' ? 'block' : 'none'}">
      <div class="rounded-xl border border-slate-200 overflow-hidden" style="background:#0f172a;position:relative;">
        <canvas id="body3d-canvas" style="width:100%;height:340px;display:block;cursor:grab;"></canvas>
        <div style="position:absolute;top:10px;left:12px;" class="flex flex-col gap-1">
          <div class="text-xs text-white/60 font-semibold">🌐 3D Body Model</div>
          <div class="text-xs text-white/40">Drag to rotate • Click to select region</div>
        </div>
        <div id="body3d-region-label" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(14,165,160,0.9);color:white;padding:4px 14px;border-radius:2rem;font-size:0.78rem;font-weight:600;display:none;"></div>
      </div>
    </div>

    <!-- Selected Regions Display -->
    <div class="mt-3">
      <div class="text-xs font-semibold text-slate-500 mb-1">Selected Body Regions:</div>
      <div id="selected-body-regions-display" class="flex flex-wrap gap-2 min-h-[28px]">
        ${selectedBodyRegions.length > 0
          ? selectedBodyRegions.map(r => `<span class="chip selected" style="font-size:0.75rem;padding:0.25rem 0.65rem;" onclick="removeBodyRegion(this,'${r}')">${r} ✕</span>`).join('')
          : '<span class="text-xs text-slate-400 italic">No regions selected yet — click on the body map above</span>'}
      </div>
      <input type="hidden" id="selected-body-regions" value="${selectedBodyRegions.join(',')}"/>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div class="input-group">
      <label class="input-label" for="s2-aggravating">Aggravating Factors</label>
      <textarea id="s2-aggravating" class="input-field" rows="2" placeholder="What makes symptoms worse? (e.g. movement, food, stress)">${d.aggravating || ''}</textarea>
    </div>
    <div class="input-group">
      <label class="input-label" for="s2-relieving">Relieving Factors</label>
      <textarea id="s2-relieving" class="input-field" rows="2" placeholder="What makes symptoms better? (e.g. rest, medication, ice)">${d.relieving || ''}</textarea>
    </div>
    <div class="input-group col-span-full">
      <label class="input-label" for="s2-associated">Additional History of Present Illness</label>
      <textarea id="s2-associated" class="input-field" rows="3" placeholder="Any additional details about your current illness, treatments tried, etc.">${d.associatedHistory || ''}</textarea>
    </div>
  </div>`;
}

// ---- 2D Body Map Helpers ----
function toggle2DRegion(region, el) {
  const hiddenEl = document.getElementById('selected-body-regions');
  if (!hiddenEl) return;
  let regions = hiddenEl.value.split(',').filter(Boolean);
  if (regions.includes(region)) {
    regions = regions.filter(r => r !== region);
    el.setAttribute('fill', '#E2E8F0');
    el.setAttribute('stroke', '#94A3B8');
  } else {
    regions.push(region);
    el.setAttribute('fill', '#0EA5A0');
    el.setAttribute('stroke', '#22C55E');
  }
  hiddenEl.value = regions.join(',');
  updateBodyRegionDisplay(regions);
  // sync back selected state on all SVG regions
  document.querySelectorAll('.body-region').forEach(r => {
    if (r.dataset.region && regions.includes(r.dataset.region)) {
      r.setAttribute('fill','#0EA5A0'); r.setAttribute('stroke','#22C55E');
    } else if (r.dataset.region) {
      r.setAttribute('fill','#E2E8F0'); r.setAttribute('stroke','#94A3B8');
    }
  });
}
function updateBodyRegionDisplay(regions) {
  const el = document.getElementById('selected-body-regions-display');
  if (!el) return;
  if (regions.length === 0) {
    el.innerHTML = '<span class="text-xs text-slate-400 italic">No regions selected yet — click on the body map above</span>';
  } else {
    el.innerHTML = regions.map(r => `<span class="chip selected" style="font-size:0.75rem;padding:0.25rem 0.65rem;" onclick="removeBodyRegion(this,'${r}')">${r} ✕</span>`).join('');
  }
}
function removeBodyRegion(el, region) {
  const hiddenEl = document.getElementById('selected-body-regions');
  if (!hiddenEl) return;
  let regions = hiddenEl.value.split(',').filter(r => r !== region);
  hiddenEl.value = regions.join(',');
  el.remove();
  updateBodyRegionDisplay(regions);
  // deselect on SVG
  document.querySelectorAll(`.body-region[data-region="${region}"]`).forEach(r => {
    r.setAttribute('fill','#E2E8F0'); r.setAttribute('stroke','#94A3B8');
  });
}
function switchBodyMap(view) {
  const panel2d = document.getElementById('bodymap-2d-panel');
  const panel3d = document.getElementById('bodymap-3d-panel');
  const btn2d   = document.getElementById('bodymap-2d-btn');
  const btn3d   = document.getElementById('bodymap-3d-btn');
  if (!panel2d || !panel3d) return;
  if (view === '2d') {
    panel2d.style.display = ''; panel3d.style.display = 'none';
    btn2d?.classList.add('active'); btn3d?.classList.remove('active');
    State.wizardData.step2.bodyMapView = '2d';
  } else {
    panel2d.style.display = 'none'; panel3d.style.display = '';
    btn3d?.classList.add('active'); btn2d?.classList.remove('active');
    State.wizardData.step2.bodyMapView = '3d';
    setTimeout(init3DBodyMap, 100);
  }
}

// ---- 3D Body Map (Three.js) ----
let _3d = null; // holds Three.js scene refs
function init3DBodyMap() {
  if (typeof THREE === 'undefined') {
    document.getElementById('bodymap-3d-panel').innerHTML = `
    <div class="text-center py-10 text-slate-400">
      <div class="text-4xl mb-2">⚠️</div>
      <p class="text-sm">3D renderer requires internet connection to load.<br/>Please use 2D view while offline.</p>
    </div>`;
    return;
  }
  const canvas = document.getElementById('body3d-canvas');
  if (!canvas) return;
  // Avoid re-init if already running
  if (_3d && _3d.canvas === canvas && _3d.running) return;

  const W = canvas.clientWidth || 400;
  const H = canvas.clientHeight || 340;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0f172a, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.set(0, 1, 4.5);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 5, 5);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x0EA5A0, 0.4);
  rimLight.position.set(-3, 0, -3);
  scene.add(rimLight);

  // Build body parts
  const skinMat    = new THREE.MeshPhongMaterial({ color: 0xDEB887, shininess: 30 });
  const selectedMat = new THREE.MeshPhongMaterial({ color: 0x0EA5A0, shininess: 60, emissive: 0x0EA5A0, emissiveIntensity: 0.3 });

  const bodyParts = [];
  function addPart(geo, x, y, z, name, mat) {
    const mesh = new THREE.Mesh(geo, (mat || skinMat).clone());
    mesh.position.set(x, y, z);
    mesh.userData.region = name;
    mesh.userData.selected = false;
    scene.add(mesh);
    bodyParts.push(mesh);
    return mesh;
  }

  // Head
  addPart(new THREE.SphereGeometry(0.32, 16, 16), 0, 2.62, 0, 'Head');
  // Neck
  addPart(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 12), 0, 2.24, 0, 'Neck');
  // Torso upper (chest)
  addPart(new THREE.BoxGeometry(0.78, 0.72, 0.36), 0, 1.72, 0, 'Chest');
  // Torso lower (abdomen)
  addPart(new THREE.BoxGeometry(0.70, 0.52, 0.32), 0, 1.12, 0, 'Abdomen');
  // Pelvis
  addPart(new THREE.BoxGeometry(0.72, 0.36, 0.30), 0, 0.68, 0, 'Pelvis');
  // Left upper arm
  addPart(new THREE.CylinderGeometry(0.11, 0.11, 0.56, 10), -0.55, 1.72, 0, 'Left Arm');
  // Right upper arm
  addPart(new THREE.CylinderGeometry(0.11, 0.11, 0.56, 10), 0.55, 1.72, 0, 'Right Arm');
  // Left forearm
  addPart(new THREE.CylinderGeometry(0.09, 0.09, 0.50, 10), -0.55, 1.12, 0, 'Left Arm');
  // Right forearm
  addPart(new THREE.CylinderGeometry(0.09, 0.09, 0.50, 10), 0.55, 1.12, 0, 'Right Arm');
  // Left hand
  addPart(new THREE.BoxGeometry(0.16, 0.18, 0.10), -0.55, 0.78, 0, 'Left Hand');
  // Right hand
  addPart(new THREE.BoxGeometry(0.16, 0.18, 0.10), 0.55, 0.78, 0, 'Right Hand');
  // Left thigh
  addPart(new THREE.CylinderGeometry(0.14, 0.13, 0.64, 10), -0.20, 0.16, 0, 'Left Thigh');
  // Right thigh
  addPart(new THREE.CylinderGeometry(0.14, 0.13, 0.64, 10), 0.20, 0.16, 0, 'Right Thigh');
  // Left leg (shin)
  addPart(new THREE.CylinderGeometry(0.10, 0.09, 0.60, 10), -0.20, -0.56, 0, 'Left Leg');
  // Right leg (shin)
  addPart(new THREE.CylinderGeometry(0.10, 0.09, 0.60, 10), 0.20, -0.56, 0, 'Right Leg');
  // Left foot
  addPart(new THREE.BoxGeometry(0.16, 0.10, 0.30), -0.20, -0.94, 0.08, 'Left Foot');
  // Right foot
  addPart(new THREE.BoxGeometry(0.16, 0.10, 0.30), 0.20, -0.94, 0.08, 'Right Foot');
  // Upper back (behind torso)
  addPart(new THREE.BoxGeometry(0.78, 0.72, 0.06), 0, 1.72, -0.21, 'Upper Back');
  // Lower back
  addPart(new THREE.BoxGeometry(0.70, 0.52, 0.06), 0, 1.12, -0.19, 'Lower Back');

  // Restore previously selected regions from hidden input
  const hiddenEl = document.getElementById('selected-body-regions');
  const existingRegions = hiddenEl ? hiddenEl.value.split(',').filter(Boolean) : [];
  bodyParts.forEach(m => {
    if (existingRegions.includes(m.userData.region)) {
      m.userData.selected = true;
      m.material = selectedMat.clone();
    }
  });

  // Orbit controls (manual drag)
  let isDragging = false, prevX = 0, prevY = 0;
  const bodyGroup = new THREE.Group();
  bodyParts.forEach(m => { scene.remove(m); bodyGroup.add(m); });
  scene.add(bodyGroup);

  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('mouseup',   e => { isDragging = false; canvas.style.cursor = 'grab'; });
  canvas.addEventListener('mouseleave',() => { isDragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = (e.clientX - prevX) * 0.012;
    const dy = (e.clientY - prevY) * 0.008;
    bodyGroup.rotation.y += dx;
    bodyGroup.rotation.x = Math.max(-0.6, Math.min(0.6, bodyGroup.rotation.x + dy));
    prevX = e.clientX; prevY = e.clientY;
  });
  // Touch support
  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });
  canvas.addEventListener('touchend',   () => { isDragging = false; });
  canvas.addEventListener('touchmove',  e => {
    if (!isDragging) return;
    const dx = (e.touches[0].clientX - prevX) * 0.012;
    bodyGroup.rotation.y += dx;
    prevX = e.touches[0].clientX;
  });

  // Click to select
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(bodyGroup.children);
    if (hits.length === 0) return;
    const mesh = hits[0].object;
    const region = mesh.userData.region;
    mesh.userData.selected = !mesh.userData.selected;
    mesh.material = mesh.userData.selected ? selectedMat.clone() : skinMat.clone();

    // Also toggle all parts with same region name (e.g. both forearm and upper arm = 'Left Arm')
    bodyGroup.children.forEach(m => {
      if (m.userData.region === region) {
        m.userData.selected = mesh.userData.selected;
        m.material = m.userData.selected ? selectedMat.clone() : skinMat.clone();
      }
    });

    // Update hidden input and display
    const hEl = document.getElementById('selected-body-regions');
    if (!hEl) return;
    let regions = hEl.value.split(',').filter(Boolean);
    if (mesh.userData.selected) { if (!regions.includes(region)) regions.push(region); }
    else { regions = regions.filter(r => r !== region); }
    hEl.value = regions.join(',');
    updateBodyRegionDisplay(regions);

    // Show label
    const label = document.getElementById('body3d-region-label');
    if (label) {
      label.textContent = mesh.userData.selected ? '✓ ' + region + ' selected' : region + ' deselected';
      label.style.display = 'block';
      clearTimeout(label._t);
      label._t = setTimeout(() => { label.style.display = 'none'; }, 2000);
    }
  });

  _3d = { canvas, running: true };
  // Animation loop
  (function animate() {
    if (!document.getElementById('body3d-canvas')) { _3d.running = false; return; }
    requestAnimationFrame(animate);
    if (!isDragging) bodyGroup.rotation.y += 0.003; // gentle auto-rotate
    renderer.render(scene, camera);
  })();
}

// ---------- STEP 3 ----------
function renderSurgeryCard(s, i) {
  return `
  <div class="surgery-card card p-4 mb-3" id="surgery-card-${i}" style="border:1.5px solid #E2E8F0;">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-semibold text-navy">Surgery #${i+1}</span>
      <button class="remove-btn" onclick="removeSurgeryCard(${i})">✕ Remove</button>
    </div>
    <div class="grid md:grid-cols-2 gap-3">
      <div class="input-group">
        <label class="input-label">Surgery Name *</label>
        <input type="text" class="input-field surg-name" placeholder="e.g. Appendectomy" value="${s.name || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Date / Year</label>
        <input type="text" class="input-field surg-date" placeholder="e.g. 2018 or March 2020" value="${s.date || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Hospital &amp; Place</label>
        <input type="text" class="input-field surg-hospital" placeholder="e.g. AIIMS Delhi" value="${s.hospital || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Reason for Surgery</label>
        <input type="text" class="input-field surg-reason" placeholder="e.g. Acute appendicitis" value="${s.reason || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Complications (if any)</label>
        <input type="text" class="input-field surg-complication" placeholder="e.g. Post-op infection, None" value="${s.complication || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Outcome</label>
        <select class="input-field surg-outcome">
          <option value="">Select</option>
          ${['Complete Recovery','Partial Recovery','Ongoing Treatment','Complications Persisted'].map(o => `<option ${s.outcome===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="input-group col-span-full">
        <label class="input-label">Anesthesia-related History</label>
        <input type="text" class="input-field surg-anesthesia" placeholder="e.g. General anesthesia — no issues; Local — allergy to lignocaine" value="${s.anesthesia || ''}"/>
      </div>
    </div>
  </div>`;
}


function renderAllergyTag(a) {
  const colors = { Drug: 'badge-red', Food: 'badge-orange', Environmental: 'badge-teal', Other: 'badge-navy' };
  return `<span class="badge ${colors[a.type] || 'badge-navy'} cursor-pointer" onclick="this.remove()">${a.type}: ${a.name} ✕</span>`;
}

function renderStep3() {
  const d = State.wizardData.step3;
  const pmh = d.pastMedical || [];
  const surgeries = d.surgeries || [];
  const hasSurgical = d.hasSurgical || '';
  const docs = d.documents || [];
  const pmhSearch = d.pmhSearch || '';

  const pmhOptions = [
    'Diabetes','Hypertension','Asthma','Tuberculosis (TB)',
    'Heart Disease','Kidney Disease','Liver Disease','Cancer',
    'Previous Infections'
  ];

  const filteredPmh = pmhSearch
    ? pmhOptions.filter(o => o.toLowerCase().includes(pmhSearch.toLowerCase()))
    : pmhOptions;

  const docTypes = ['X-Ray','CT Scan','MRI','Ultrasound','Prescription','Clinical Photo Sheet','Discharge Sheet','Other'];

  return `
  <h2 class="text-lg font-bold text-navy mb-5 flex items-center gap-2">📋 Medical History</h2>

  <!-- Past Medical History with search -->
  <div class="mb-5">
    <h3 class="font-semibold text-slate-700 mb-3">Past Medical History</h3>
    <div class="search-bar mb-3">
      <span class="text-slate-400">🔍</span>
      <input type="text" id="pmh-search" placeholder="Search conditions..." value="${pmhSearch}"
        oninput="filterPMH(this.value)" class="text-sm"/>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2" id="pmh-checkbox-grid">
      ${filteredPmh.map(c => `
      <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-teal-50 transition-colors">
        <input type="checkbox" class="pmh-check accent-teal-500 w-4 h-4" value="${c}" ${pmh.includes(c)?'checked':''}/>
        <span class="text-sm text-slate-700">${c}</span>
      </label>`).join('')}
    </div>
    <div class="input-group mt-3">
      <label class="input-label" for="s3-pmh-other">Other Conditions (free text)</label>
      <input type="text" id="s3-pmh-other" class="input-field" placeholder="Any other conditions not listed above" value="${d.pmhOther || ''}"/>
    </div>
  </div>

  <!-- Past Surgical History with Yes/No toggle -->
  <div class="mb-5">
    <h3 class="font-semibold text-slate-700 mb-3">Past Surgical History</h3>
    <div class="flex gap-3 mb-4">
      <button class="px-5 py-2 rounded-xl font-semibold text-sm transition-all ${hasSurgical==='yes' ? 'bg-gradient-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-teal-50'}"
        id="surgical-yes-btn" onclick="toggleSurgicalSection('yes')">✅ Yes</button>
      <button class="px-5 py-2 rounded-xl font-semibold text-sm transition-all ${hasSurgical==='no' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
        id="surgical-no-btn" onclick="toggleSurgicalSection('no')">❌ No</button>
      ${!hasSurgical ? '<span class="text-xs text-slate-400 self-center ml-2">Select Yes or No</span>' : ''}
    </div>
    <input type="hidden" id="s3-has-surgical" value="${hasSurgical}"/>
    <div id="surgery-detail-section" style="display:${hasSurgical==='yes' ? 'block' : 'none'}">
      <div id="surgery-list">
        ${surgeries.length > 0 ? surgeries.map((s,i) => renderSurgeryCard(s,i)).join('') : renderSurgeryCard({},0)}
      </div>
      <button class="btn-outline text-sm mt-2" id="add-surgery-btn">+ Add Another Surgery</button>
    </div>
  </div>

  <!-- Document Upload Section -->
  <div class="mb-2">
    <h3 class="font-semibold text-slate-700 mb-3">Medical Treatment Records (Upload)</h3>
    <div class="flex flex-wrap gap-2 mb-3" id="doc-type-tags">
      ${docTypes.map(t => `
      <div class="chip ${(docs || []).some(d => d.type===t) ? 'selected' : ''}" data-doctype="${t}" onclick="selectDocType(this,'${t}')">
        ${t === 'X-Ray' ? '🦻' : t === 'CT Scan' ? '🔬' : t === 'MRI' ? '🧲' : t === 'Ultrasound' ? '📡' : t === 'Prescription' ? '💊' : t === 'Discharge Sheet' ? '📋' : '📎'} ${t}
      </div>`).join('')}
    </div>
    <div class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-400 transition-colors cursor-pointer" id="doc-upload-area" onclick="document.getElementById('doc-file-input').click()">
      <div class="text-3xl mb-2">📁</div>
      <p class="text-sm font-semibold text-slate-600">Click to upload medical documents</p>
      <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG accepted • Max 10MB per file</p>
      <p class="text-xs text-primary mt-1">Select a document type above, then upload</p>
    </div>
    <input type="file" id="doc-file-input" accept=".pdf,.jpg,.jpeg,.png" class="hidden" multiple onchange="handleDocUpload(this)"/>
    <div id="doc-file-list" class="mt-3 space-y-2">
      ${(docs || []).map(doc => `
      <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-sm">
        <span class="badge badge-teal">${doc.type}</span>
        <span class="flex-1 truncate text-slate-700">${doc.name}</span>
        <span class="text-xs text-slate-400">${doc.size || ''}</span>
      </div>`).join('')}
    </div>
  </div>`;
}



// ---------- STEP 4 — Allergy & Social History ----------
function renderStep4() {
  const d = State.wizardData.step4;
  const allergyTypes = ['Medicine','Food','Environmental','Other'];
  const substances = [
    { key:'smoking', label:'Smoking', icon:'🚬' },
    { key:'alcohol',  label:'Alcohol', icon:'🍺' },
    { key:'tobacco',  label:'Tobacco (Chewing)', icon:'🌿' },
    { key:'drugs',    label:'Recreational Drugs', icon:'💊' },
    { key:'caffeine', label:'Caffeine', icon:'☕' },
  ];

  return `
  <h2 class="text-lg font-bold text-navy mb-5 flex items-center gap-2">🧬 Allergy &amp; Social History</h2>

  <!-- PART A: Allergy History -->
  <div class="mb-1">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-7 h-7 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-bold">A</span>
      <h3 class="font-semibold text-slate-700 text-base">Allergy History</h3>
      <span class="badge badge-orange ml-1">Optional</span>
    </div>
    <div class="space-y-4">
      ${allergyTypes.map(type => {
        const key = type.toLowerCase().replace(' ','_');
        const saved = (d.allergyHistory || {})[key] || {};
        return `
        <div class="p-4 rounded-xl border border-slate-100 bg-gradient-card">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-sm text-navy">${type === 'Medicine' ? '💊' : type === 'Food' ? '🍽️' : type === 'Environmental' ? '🌿' : '❓'} ${type} Allergy</h4>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="allergy-type-enable accent-teal-500" data-atype="${key}" ${saved.enabled ? 'checked' : ''}
                onchange="toggleAllergyBox(this,'allergy-box-${key}')"/>
              <span class="text-xs font-medium text-slate-500">Add details</span>
            </label>
          </div>
          <div id="allergy-box-${key}" style="display:${saved.enabled ? 'block' : 'none'}">
            <div class="grid md:grid-cols-2 gap-3">
              <div class="input-group mb-0">
                <label class="input-label">Allergen / Description</label>
                <textarea class="input-field allergy-desc" data-atype="${key}" rows="2"
                  placeholder="Describe specific allergens, reactions experienced...">${saved.desc || ''}</textarea>
              </div>
              <div class="input-group mb-0">
                <label class="input-label">Approximate Date / Year</label>
                <input type="text" class="input-field allergy-date" data-atype="${key}"
                  placeholder="e.g. 2022 or Since childhood" value="${saved.date || ''}"/>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <hr class="my-6 border-slate-100"/>

  <!-- PART A cont: Substance Consumption -->
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">B</span>
      <h3 class="font-semibold text-slate-700 text-base">Substance Consumption</h3>
      <span class="badge badge-orange ml-1">Optional</span>
    </div>
    <div class="grid md:grid-cols-2 gap-3">
      ${substances.map(s => {
        const saved = (d.substances || {})[s.key] || {};
        return `
        <div class="p-3 rounded-xl border border-slate-100 bg-white">
          <label class="flex items-center gap-3 cursor-pointer mb-2">
            <input type="checkbox" class="substance-check accent-teal-500 w-4 h-4" data-subkey="${s.key}"
              ${saved.uses ? 'checked' : ''}
              onchange="toggleSubstanceFreq(this,'subfreq-${s.key}')"/>
            <span class="font-semibold text-sm text-slate-700">${s.icon} ${s.label}</span>
          </label>
          <div id="subfreq-${s.key}" style="display:${saved.uses ? 'block' : 'none'}">
            <select class="input-field text-sm substance-freq" data-subkey="${s.key}">
              <option value="">Select frequency</option>
              ${['Rarely (once a month or less)','Occasionally (few times a month)','Regularly (few times a week)','Daily'].map(f =>
                `<option ${saved.freq===f?'selected':''}>${f}</option>`).join('')}
            </select>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <hr class="my-6 border-slate-100"/>

  <!-- PART B: Health Background / Social History -->
  <div class="mb-1">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-7 h-7 rounded-full bg-blue-100 text-navy flex items-center justify-center text-xs font-bold">C</span>
      <h3 class="font-semibold text-slate-700 text-base">Family History &amp; Health Background</h3>
    </div>
    <div class="space-y-3">
      <div class="input-group">
        <label class="input-label" for="s4-family-history">Relevant Family History</label>
        <textarea id="s4-family-history" class="input-field" rows="2"
          placeholder="e.g. Father — Diabetes & Hypertension; Mother — Thyroid disorder; Maternal grandfather — Cardiac disease"
        >${(d.familyBackground || {}).familyHistory || ''}</textarea>
      </div>
      <div class="input-group">
        <label class="input-label" for="s4-mental-history">Mental Health History</label>
        <textarea id="s4-mental-history" class="input-field" rows="2"
          placeholder="Any personal or family history of depression, anxiety, schizophrenia, bipolar disorder, etc."
        >${(d.familyBackground || {}).mentalHistory || ''}</textarea>
      </div>
      <div class="input-group">
        <label class="input-label" for="s4-reproductive-history">Reproductive History <span class="text-slate-400 font-normal">(if applicable)</span></label>
        <textarea id="s4-reproductive-history" class="input-field" rows="2"
          placeholder="For female patients: menstrual cycle, pregnancies, deliveries, miscarriages, contraception use, menopausal status"
        >${(d.familyBackground || {}).reproductiveHistory || ''}</textarea>
      </div>
      <div class="input-group">
        <label class="input-label" for="s4-familial-other">Other Relevant Familial Conditions</label>
        <textarea id="s4-familial-other" class="input-field" rows="2"
          placeholder="Any other relevant conditions running in the family"
        >${(d.familyBackground || {}).familialOther || ''}</textarea>
      </div>
    </div>
  </div>

  <hr class="my-6 border-slate-100"/>

  <!-- Lifestyle -->
  <div>
    <div class="flex items-center gap-2 mb-4">
      <span class="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">D</span>
      <h3 class="font-semibold text-slate-700 text-base">Lifestyle</h3>
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="input-group">
        <label class="input-label">Diet</label>
        <select id="s4-diet" class="input-field">
          <option value="">Select</option>
          ${['Vegetarian','Non-Vegetarian','Vegan','Mixed / Flexitarian'].map(dd => `<option ${(d.lifestyle||{}).diet===dd?'selected':''}>${dd}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Sleep Pattern</label>
        <select id="s4-sleep" class="input-field">
          <option value="">Select</option>
          ${['Less than 5 hours','5–6 hours','7–8 hours (Adequate)','More than 9 hours','Irregular'].map(s => `<option ${(d.lifestyle||{}).sleep===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">Physical Activity</label>
        <select id="s4-activity" class="input-field">
          <option value="">Select</option>
          ${['Sedentary (No exercise)','Lightly Active (1–3 days/week)','Moderately Active (3–5 days/week)','Very Active (Daily exercise)'].map(a => `<option ${(d.lifestyle||{}).activity===a?'selected':''}>${a}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label" for="s4-occupation">Occupation</label>
        <input type="text" id="s4-occupation" class="input-field" placeholder="e.g. Software Engineer, Farmer, Student" value="${(d.lifestyle||{}).occupation || ''}"/>
      </div>
      <div class="input-group">
        <label class="input-label">Marital Status</label>
        <select id="s4-marital" class="input-field">
          <option value="">Select</option>
          ${['Single','Married','Divorced','Widowed'].map(m => `<option ${(d.lifestyle||{}).marital===m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <label class="input-label" for="s4-stress">Stress Level</label>
        <select id="s4-stress" class="input-field">
          <option value="">Select</option>
          ${['Low','Moderate','High','Severe'].map(s => `<option ${(d.lifestyle||{}).stress===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
  </div>`;
}

// ---------- STEP 5 (Review & Submit) ----------
function renderStep5() {
  const d1 = State.wizardData.step1;
  const d2 = State.wizardData.step2;
  const d3 = State.wizardData.step3;
  const d4 = State.wizardData.step4;

  const section = (title, content) => `
  <div class="accordion-item border border-slate-100 rounded-xl overflow-hidden mb-3">
    <div class="accordion-header bg-white" onclick="toggleAccordion(this)">
      <span>${title}</span>
      <div class="flex items-center gap-2">
        <button class="btn-outline text-xs px-3 py-1" onclick="event.stopPropagation(); goToStep(${parseInt(title.match(/\d/)?.[0]||1)})">✏️ Edit</button>
        <span class="text-slate-400 accordion-arrow">▼</span>
      </div>
    </div>
    <div class="accordion-body">${content}</div>
  </div>`;

  const row = (l, v) => v ? `<div class="report-row"><span class="label">${l}</span><span class="value">${v || '—'}</span></div>` : '';

  return `
  <h2 class="text-lg font-bold text-navy mb-2 flex items-center gap-2">✅ Review &amp; Submit</h2>
  <p class="text-sm text-slate-400 mb-5">Please review all information before submitting. Click "Edit" on any section to make changes.</p>

  ${section('Step 1 — Patient Registration', `
    <div class="grid md:grid-cols-2 gap-x-8">
      ${row('Full Name', d1.fullName)}
      ${row('Gender', d1.gender)}
      ${row('Date of Birth', formatDate(d1.dob))}
      ${row('Age', d1.age ? d1.age + ' years' : '')}
      ${row('Blood Group', d1.bloodGroup)}
      ${row('Contact Number', d1.contact)}
      ${row('Weight', d1.weight ? d1.weight + ' kg' : '')}
      ${row('Height', d1.height ? d1.height + ' cm' : '')}
      ${row('BMI', d1.bmi)}
      ${row('Emergency Contact', d1.ecName ? `${d1.ecName} (${d1.ecPhone})` : '')}
      ${row('Address', d1.address)}
    </div>`)}

  ${section('Step 2 — Chief Complaints', `
    ${row('Complaint Name', d2.complaintName)}
    ${row('Duration', d2.durationVal ? `${d2.durationVal} ${d2.durationUnit || ''}` : '')}
    ${row('Onset', d2.onset)}
    ${row('Severity', d2.severity ? d2.severity + '/10' : '')}
    ${row('Associated Symptoms', (d2.symptoms || []).join(', '))}
    ${row('Affected Body Regions', (d2.bodyRegions || []).join(', '))}
    ${row('Aggravating Factors', d2.aggravating)}
    ${row('Relieving Factors', d2.relieving)}
    ${row('Additional History', d2.associatedHistory)}`)}

  ${section('Step 3 — Medical History', `
    ${row('Past Medical History', (d3.pastMedical || []).join(', '))}
    ${row('Other Conditions', d3.pmhOther)}
    ${row('Past Surgical History', d3.hasSurgical === 'yes' ? (d3.surgeries||[]).filter(s=>s.name).map(s=>`${s.name} (${s.date||''})`).join('; ') || 'Yes (details recorded)' : d3.hasSurgical === 'no' ? 'None' : '')}
    ${row('Documents Uploaded', (d3.documents||[]).length > 0 ? d3.documents.map(d=>d.type+': '+d.name).join(', ') : '')}`)}

  ${section('Step 4 — Allergy & Social History', `
    ${row('Medicine Allergy', (d4.allergyHistory||{}).medicine?.enabled ? (d4.allergyHistory.medicine.desc||'Recorded') : '')}
    ${row('Food Allergy', (d4.allergyHistory||{}).food?.enabled ? (d4.allergyHistory.food.desc||'Recorded') : '')}
    ${row('Environmental Allergy', (d4.allergyHistory||{}).environmental?.enabled ? (d4.allergyHistory.environmental.desc||'Recorded') : '')}
    ${row('Substance Use', Object.entries(d4.substances||{}).filter(([k,v])=>v.uses).map(([k,v])=>k.charAt(0).toUpperCase()+k.slice(1)+(v.freq?' ('+v.freq+')':'')).join(', '))}
    ${row('Family History', (d4.familyBackground||{}).familyHistory)}
    ${row('Mental Health History', (d4.familyBackground||{}).mentalHistory)}
    ${row('Reproductive History', (d4.familyBackground||{}).reproductiveHistory)}
    ${row('Diet', (d4.lifestyle||{}).diet)}
    ${row('Sleep', (d4.lifestyle||{}).sleep)}
    ${row('Physical Activity', (d4.lifestyle||{}).activity)}
    ${row('Occupation', (d4.lifestyle||{}).occupation)}
    ${row('Marital Status', (d4.lifestyle||{}).marital)}
    ${row('Stress Level', (d4.lifestyle||{}).stress)}`)}

  <!-- Declaration -->
  <div class="p-4 rounded-xl border-2 border-teal-100 bg-teal-50 mb-4">
    <label class="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" id="declaration-check" class="accent-teal-500 w-5 h-5 mt-0.5 flex-shrink-0" ${d1.declared ? 'checked' : ''}/>
      <span class="text-sm text-slate-700">I hereby declare that all the information provided above is accurate and true to the best of my knowledge. I consent to this data being used for clinical summarization and medical record purposes.</span>
    </label>
  </div>

  <div class="flex justify-center">
    <button class="btn-primary px-12 py-4 text-lg" id="submit-wizard-btn">
      🚀 Submit Case
    </button>
  </div>`;
}

// ===========================
//   AI SUMMARY PAGE
// ===========================
function renderAISummary() {
  const d1 = State.wizardData.step1;
  const d2 = State.wizardData.step2;
  const d3 = State.wizardData.step3;
  const d4 = State.wizardData.step4;
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const name = d1.fullName || State.currentUser?.name || 'Patient';
  const age  = d1.age || (d1.dob ? (new Date().getFullYear() - new Date(d1.dob).getFullYear()) : '');
  const gender = d1.gender || '';
  const complaint = d2.complaintName || 'General consultation';
  const symptoms = (d2.symptoms || []).join(', ');
  const pmh = (d3.pastMedical || []).join(', ') || 'None significant';
  // Build allergy string from new step4 structure
  const allergyParts = [];
  const ah = d4.allergyHistory || {};
  if (ah.medicine?.enabled) allergyParts.push(`Medicine: ${ah.medicine.desc || 'Yes'}`);
  if (ah.food?.enabled) allergyParts.push(`Food: ${ah.food.desc || 'Yes'}`);
  if (ah.environmental?.enabled) allergyParts.push(`Environmental: ${ah.environmental.desc || 'Yes'}`);
  if (ah.other?.enabled) allergyParts.push(`Other: ${ah.other.desc || 'Yes'}`);
  const allergies = allergyParts.length ? allergyParts.join('; ') : 'No known allergies';



  const summaryText = `${name}, a ${age}-year-old ${gender.toLowerCase()} patient, presented with a chief complaint of "${complaint}" for a duration of ${d2.durationVal || '?'} ${d2.durationUnit || 'days'} with ${d2.onset || 'gradual'} onset. The patient reported associated symptoms including ${symptoms || 'no specific additional symptoms'}, rated ${d2.severity || 5}/10 in severity. ${d2.aggravating ? `Symptoms were aggravated by ${d2.aggravating}.` : ''} ${d2.relieving ? `Relief was noted with ${d2.relieving}.` : ''} ${d2.associatedHistory ? d2.associatedHistory : ''}

Past medical history significant for ${pmh}. Allergy history: ${allergies}. ${d4.lifestyle?.occupation ? `Occupation: ${d4.lifestyle.occupation}.` : ''} ${d4.lifestyle?.diet ? `Diet: ${d4.lifestyle.diet}.` : ''}`;



  const treatmentRecs = generateTreatmentRecs(complaint, d2.symptoms || []);


  return `
  <div class="max-w-4xl mx-auto animate-fade-in" id="summary-content">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
      <div>
        <div class="ai-badge mb-2">✨ AI-Generated Clinical Summary</div>
        <h1 class="text-2xl font-bold text-navy">Clinical Case Summary</h1>
        <p class="text-sm text-slate-400 mt-1">Generated on ${today} • Case Reference: CASE-001</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="btn-outline flex items-center gap-2" onclick="window.print()">🖨️ Print</button>
        <button class="btn-primary flex items-center gap-2" onclick="downloadPDF()">📄 Download PDF</button>
        <button class="btn-ghost border border-slate-200" onclick="showToast('Report shared successfully!','success')">🔗 Share</button>
      </div>
    </div>

    <!-- Patient Identity Card -->
    <div class="card p-5 mb-4" style="border-top: 4px solid #0EA5A0;">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            ${name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 class="text-xl font-bold text-navy">${name}</h2>
            <div class="flex flex-wrap gap-2 mt-1">
              <span class="badge badge-navy">${age ? age + ' years' : 'Age N/A'}, ${gender || 'Gender N/A'}</span>
              <span class="badge badge-teal">🩸 ${d1.bloodGroup || 'Blood group N/A'}</span>
              <div class="patient-id-badge" style="font-size:0.75rem;padding:0.2rem 0.65rem;">${State.currentUser?.id || 'UHD-DEMO01'}</div>
            </div>
          </div>
        </div>
        <div class="text-right text-sm text-slate-500">
          <div>📅 ${today}</div>
          <div class="mt-1">📞 ${d1.contact || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Clinical Summary -->
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-3 flex items-center gap-2">📝 History of Present Illness</h3>
      <p class="text-sm text-slate-700 leading-relaxed">${summaryText}</p>
    </div>

    <!-- Allergy & Substance Summary -->
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-3 flex items-center gap-2">🧬 Allergy & Social Summary</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Allergy History</p>
          <p class="text-sm text-slate-700">${allergies}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Substance Use</p>
          <p class="text-sm text-slate-700">${Object.entries(d4.substances||{}).filter(([k,v])=>v.uses).map(([k,v])=>k.charAt(0).toUpperCase()+k.slice(1)+(v.freq?' ('+v.freq+')':'')).join(', ')||'None reported'}</p>
        </div>
      </div>
    </div>

    <!-- Chief Complaint Summary Card -->
    <div class="card p-5 mb-4" style="border-left: 4px solid #1E3A8A;">
      <h3 class="font-bold text-navy mb-3 flex items-center gap-2">🩺 Chief Complaint Summary</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div><p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Complaint</p><p class="font-semibold text-slate-800">${complaint}</p></div>
        <div><p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Severity</p><p class="font-semibold text-slate-800">${d2.severity||'5'}/10</p></div>
        <div><p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Duration</p><p class="font-semibold text-slate-800">${d2.durationVal||'?'} ${d2.durationUnit||'days'}</p></div>
        <div><p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Onset</p><p class="font-semibold text-slate-800">${d2.onset||'Not specified'}</p></div>
      </div>
      ${(d2.bodyRegions||[]).length > 0 ? `<div class="mt-3"><p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Affected Body Regions</p><div class="flex flex-wrap gap-2">${(d2.bodyRegions||[]).map(r=>`<span class="chip selected" style="font-size:0.75rem;padding:0.2rem 0.6rem;">${r}</span>`).join('')}</div></div>` : ''}
    </div>

    <!-- Treatment Recommendations -->
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-3">💊 AI Treatment Recommendations</h3>
      <div class="ai-badge mb-3">✨ AI Suggested based on reported symptoms</div>
      <div class="grid md:grid-cols-2 gap-2">
        ${treatmentRecs.map(rec => `
        <div class="flex items-start gap-2 p-2 rounded-lg bg-teal-50">
          <span class="text-teal-500 flex-shrink-0">→</span>
          <span class="text-sm text-slate-700">${rec}</span>
        </div>`).join('')}
      </div>
      <p class="text-xs text-slate-400 mt-3 italic">⚠️ For clinical guidance only. Refer to treating physician for final management.</p>
    </div>

    <!-- History Summary -->
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-3 flex items-center gap-2">📋 Medical Background</h3>
      <div class="grid md:grid-cols-2 gap-x-8">
        <div class="report-row"><span class="label">Past Medical History</span><span class="value">${pmh}</span></div>
        <div class="report-row"><span class="label">Other Conditions</span><span class="value">${d3.pmhOther || '—'}</span></div>
        <div class="report-row"><span class="label">Known Allergies</span><span class="value">${allergies}</span></div>
        <div class="report-row"><span class="label">Family History</span><span class="value">${(d4.familyBackground||{}).familyHistory || '—'}</span></div>
        <div class="report-row"><span class="label">Mental Health History</span><span class="value">${(d4.familyBackground||{}).mentalHistory || '—'}</span></div>
        <div class="report-row"><span class="label">Occupation</span><span class="value">${(d4.lifestyle||{}).occupation || '—'}</span></div>
        <div class="report-row"><span class="label">Diet</span><span class="value">${(d4.lifestyle||{}).diet || '—'}</span></div>
        <div class="report-row"><span class="label">Physical Activity</span><span class="value">${(d4.lifestyle||{}).activity || '—'}</span></div>
        <div class="report-row"><span class="label">Stress Level</span><span class="value">${(d4.lifestyle||{}).stress || '—'}</span></div>
      </div>
    </div>

    <!-- Footer watermark -->
    <div class="flex items-center justify-between text-xs text-slate-300 border-t border-slate-100 pt-4 mt-4">
      <div class="flex items-center gap-2">
        ${LOGO_SVG.replace('width="38"','width="20"').replace('height="38"','height="20"')}
        <span class="font-bold gradient-text">ArogyaX</span>
        <span>• Patient Case-Taking & Clinical Summarization Platform</span>
      </div>
      <span>Generated ${today} • SIH26047</span>
    </div>
  </div>`;
}

function generateTreatmentRecs(diagnosis, symptoms) {
  const recs = [
    'Symptomatic treatment as appropriate for presenting complaints',
    'Adequate hydration — minimum 2–3 litres of water daily',
    'Rest and avoidance of exertion until symptoms improve',
  ];
  if (symptoms.includes('Fever'))        recs.push('Antipyretics (e.g. Paracetamol 500mg TID) as needed for fever relief');
  if (symptoms.includes('Cough'))        recs.push('Cough suppressants / expectorants based on cough type (dry vs. productive)');
  if (symptoms.includes('Headache'))     recs.push('Analgesics for pain relief; evaluate for secondary causes if persistent');
  if (symptoms.includes('Vomiting'))     recs.push('Antiemetics and oral rehydration therapy if vomiting is present');
  if (symptoms.includes('Diarrhea'))     recs.push('Oral rehydration salts (ORS); evaluate stool culture if diarrhea persists > 3 days');
  if (symptoms.includes('Chest Pain'))   recs.push('Urgent cardiac workup recommended; ECG and troponin levels if chest pain is present');
  if (symptoms.includes('Breathlessness')) recs.push('Oxygen supplementation if SpO2 < 94%; pulmonary function evaluation recommended');
  recs.push('Follow-up review in 7 days or earlier if symptoms worsen');
  recs.push('Await investigation reports before initiating definitive treatment');
  return recs.slice(0, 7);
}

// ===========================
//   DOCTOR DASHBOARD
// ===========================
function renderDoctorDashboard() {
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  const patients = State.patients.length > 0 ? State.patients : getDemoPatients();

  return `
  <div class="animate-fade-in">
    <!-- Welcome Banner -->
    <div class="rounded-2xl p-6 mb-6 text-white relative overflow-hidden" style="background: linear-gradient(135deg,#1E3A8A 0%,#0EA5A0 60%,#22C55E 100%)">
      <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
      <div class="relative">
        <p class="text-white/70 text-sm">${today}</p>
        <h1 class="text-2xl font-bold mt-1">Good afternoon, Dr. ${State.currentUser?.name || 'Smith'} 👋</h1>
        <p class="text-white/70 text-sm mt-1">You have <strong class="text-white">3 pending reviews</strong> and <strong class="text-white">2 upcoming appointments</strong> today.</p>
        <div class="flex gap-3 mt-4 flex-wrap">
          <button class="bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition" onclick="startNewCase()">➕ New Case</button>
          <button class="bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/30 transition" onclick="showToast('Reports section coming soon!','info')">📊 View Reports</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      ${[
        { icon:'👥', label:'Total Patients', value:'142', trend:'+12 this month', color:'text-navy', bg:'bg-blue-50' },
        { icon:'📋', label:'Cases Today', value:'8', trend:'3 completed', color:'text-teal-600', bg:'bg-teal-50' },
        { icon:'⏳', label:'Pending Reviews', value:'3', trend:'Action required', color:'text-orange-500', bg:'bg-orange-50' },
        { icon:'✅', label:'Completed Cases', value:'139', trend:'This month: 28', color:'text-green-600', bg:'bg-green-50' },
      ].map(s => `
      <div class="card-stat">
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-xl">${s.icon}</div>
          <span class="badge badge-teal text-xs">↑</span>
        </div>
        <div class="text-3xl font-extrabold ${s.color} mb-1">${s.value}</div>
        <div class="text-xs font-semibold text-slate-500 mb-1">${s.label}</div>
        <div class="text-xs text-slate-400">${s.trend}</div>
      </div>`).join('')}
    </div>

    <!-- Two Column Layout -->
    <div class="grid md:grid-cols-3 gap-4 mb-6">
      <!-- Recent Patients Table -->
      <div class="card p-5 col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-navy flex items-center gap-2">🧑‍⚕️ Recent Patients</h3>
          <div class="flex gap-2">
            <div class="search-bar py-2">
              <span class="text-slate-400">🔍</span>
              <input type="text" placeholder="Search patients..." id="patient-search-input" oninput="filterPatients(this.value)" />
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table" id="patients-table">
            <thead><tr>
              <th>Patient ID</th><th>Name</th><th>Age / Gender</th><th>Chief Complaint</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody id="patients-tbody">
              ${patients.map(p => renderPatientRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Panel -->
      <div class="flex flex-col gap-4">
        <!-- Today's Appointments -->
        <div class="card p-5">
          <h3 class="font-bold text-navy mb-3 flex items-center gap-2">📅 Today's Schedule</h3>
          ${[
            { time:'10:00 AM', name:'Priya Sharma', type:'Follow-up' },
            { time:'11:30 AM', name:'Rahul Verma', type:'New Case' },
            { time:'2:00 PM',  name:'Anjali Singh', type:'Review' },
          ].map(a => `
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 mb-2">
            <div class="text-center w-16 flex-shrink-0">
              <div class="text-xs font-bold text-primary">${a.time}</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-700">${a.name}</div>
              <div class="text-xs text-slate-400">${a.type}</div>
            </div>
            <span class="badge badge-teal ml-auto text-xs">${a.type}</span>
          </div>`).join('')}
        </div>
        <!-- Quick Actions -->
        <div class="card p-5">
          <h3 class="font-bold text-navy mb-3">⚡ Quick Actions</h3>
          <div class="space-y-2">
            <button class="btn-primary w-full flex items-center justify-center gap-2 py-2.5" onclick="startNewCase()">➕ New Patient Case</button>
            <button class="btn-outline w-full flex items-center justify-center gap-2 py-2.5" onclick="showToast('Lab results module coming soon!','info')">🧪 Lab Results</button>
            <button class="btn-ghost border border-slate-200 w-full flex items-center justify-center gap-2 py-2.5" onclick="showToast('Analytics module coming soon!','info')">📊 Analytics</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function getDemoPatients() {
  return [
    { id:'UHD-A3K7P2', name:'Priya Sharma', age:34, gender:'Female', complaint:'Fever & Headache', status:'Completed', date:'07 Sep 2026' },
    { id:'UHD-B8L2Q9', name:'Rahul Verma', age:45, gender:'Male', complaint:'Chest Pain', status:'Pending Review', date:'07 Sep 2026' },
    { id:'UHD-C5M4R1', name:'Anjali Singh', age:28, gender:'Female', complaint:'Abdominal Pain', status:'Completed', date:'06 Sep 2026' },
    { id:'UHD-D9N6S3', name:'Vikram Patel', age:62, gender:'Male', complaint:'Diabetes Follow-up', status:'In Progress', date:'06 Sep 2026' },
    { id:'UHD-E2P8T5', name:'Meera Nair', age:39, gender:'Female', complaint:'Cough & Cold', status:'Completed', date:'05 Sep 2026' },
  ];
}

function renderPatientRow(p) {
  const statusColors = { 'Completed': 'badge-green', 'Pending Review': 'badge-orange', 'In Progress': 'badge-teal' };
  return `
  <tr>
    <td><span class="font-mono text-xs font-semibold text-primary">${p.id}</span></td>
    <td class="font-medium">${p.name}</td>
    <td>${p.age} / ${p.gender}</td>
    <td>${p.complaint}</td>
    <td><span class="badge ${statusColors[p.status] || 'badge-navy'}">${p.status}</span></td>
    <td>
      <button class="btn-primary text-xs px-3 py-1" onclick="showToast('Opening case for ${p.name}...','info')">View</button>
    </td>
  </tr>`;
}

// ===========================
//   EVENT HANDLERS
// ===========================
function attachEvents() {
  // Home page CTAs → route to login
  const goLogin = () => { State.currentPage = 'login'; render(); };
  bindClick('home-login-btn',  goLogin);
  bindClick('hero-cta-btn',   goLogin);
  bindClick('cta-bottom-btn', goLogin);

  // Login tabs
  bindClick('tab-doctor', () => { State.authMode = 'doctor'; render(); });
  bindClick('tab-patient', () => { State.authMode = 'patient'; render(); });
  bindClick('ptab-login', () => { State.patientAuthTab = 'login'; render(); });
  bindClick('ptab-register', () => { State.patientAuthTab = 'register'; render(); });
  bindClick('goto-register', () => { State.patientAuthTab = 'register'; State.authMode = 'patient'; render(); });
  bindClick('goto-login', () => { State.patientAuthTab = 'login'; State.authMode = 'patient'; render(); });

  // Doctor login
  bindClick('doctor-login-btn', () => {
    const email = val('doc-email');
    const pass  = val('doc-pass');
    if (!email || !pass) { showToast('Please enter your credentials.','error'); return; }
    if (email === DOCTOR_CREDENTIALS.email && pass === DOCTOR_CREDENTIALS.password) {
      State.currentUser = { role: 'doctor', name: 'Arjun Mehta', email, id: 'DOC-001' };
      State.currentPage = 'doctorDash';
      State.activeNav   = 'dashboard';
      saveState();
      render();
    } else {
      showToast('Invalid credentials. Use demo credentials shown below.','error');
    }
  });

  // Patient register
  bindClick('patient-register-btn', () => {
    const name  = val('r-name');
    const email = val('r-email');
    const phone = val('r-phone');
    const pass  = val('r-pass');
    const cpass = val('r-cpass');
    if (!name || !email || !phone || !pass) { showToast('Please fill all required fields.','error'); return; }
    if (pass !== cpass) { showToast('Passwords do not match.','error'); return; }
    if (pass.length < 6) { showToast('Password must be at least 6 characters.','error'); return; }
    const id = generatePatientId();
    State.currentUser = { role: 'patient', name, email, phone, id };
    State.wizardData = { step1: { fullName: name, contact: phone }, step2:{}, step3:{}, step4:{}, step5:{} };
    State.currentPage = 'patientDash';
    State.activeNav   = 'dashboard';
    saveState();
    showToast(`Account created! Your Patient ID: ${id}`, 'success');
    render();
  });

  // Patient login
  bindClick('patient-login-btn', () => {
    const id = val('p-email');
    const pass = val('p-pass');
    if (!id || !pass) { showToast('Please enter your credentials.','error'); return; }
    // Demo: any non-empty creds work
    const pId = id.startsWith('UHD-') ? id : generatePatientId();
    State.currentUser = { role: 'patient', name: 'Patient User', id: pId, email: id };
    State.wizardData = { step1:{}, step2:{}, step3:{}, step4:{}, step5:{} };
    State.currentPage = 'patientDash';
    State.activeNav   = 'dashboard';
    saveState();
    showToast('Welcome back! Logged in successfully.','success');
    render();
  });

  // Captcha
  bindClick('captcha-box', () => {
    const check = document.getElementById('captcha-check');
    const tick  = document.getElementById('captcha-tick');
    if (check && tick) { tick.classList.toggle('hidden'); check.classList.toggle('bg-teal-500'); check.classList.toggle('text-white'); }
  });

  // Sidebar toggle
  bindClick('sidebar-toggle', () => { State.sidebarCollapsed = !State.sidebarCollapsed; render(); });

  // Nav items
  document.querySelectorAll('.nav-item[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = btn.dataset.nav;
      State.activeNav = nav;
      if (nav === 'newcase') { startNewCase(); return; }
      if (nav === 'dashboard') {
        State.currentPage = State.currentUser?.role === 'doctor' ? 'doctorDash' : 'patientDash';
        render();
      } else if (nav === 'patients') {
        State.currentPage = 'patientsPage';
        render();
      } else if (nav === 'reports') {
        State.currentPage = 'reportsPage';
        render();
      } else if (nav === 'records') {
        State.currentPage = 'recordsPage';
        render();
      } else if (nav === 'profile') {
        State.currentPage = 'profilePage';
        render();
      } else if (nav === 'analytics') {
        State.comingSoonSection = { label: 'Analytics', icon: '📊' };
        State.currentPage = 'comingSoon';
        render();
      } else if (nav === 'settings') {
        State.comingSoonSection = { label: 'Settings', icon: '⚙️' };
        State.currentPage = 'comingSoon';
        render();
      } else {
        showToast(`${nav.charAt(0).toUpperCase() + nav.slice(1)} section coming soon!`, 'info');
      }
    });
  });

  // Logout
  bindClick('logout-btn', () => {
    State.currentUser = null;
    State.currentPage = 'home';
    State.wizardData = { step1:{}, step2:{}, step3:{}, step4:{}, step5:{} };
    State.authMode = 'doctor';
    State.comingSoonSection = null;
    localStorage.removeItem('arogyax_state');
    render();
  });

  // Patient dashboard new case
  bindClick('start-new-case-btn', startNewCase);
  bindClick('start-new-case-btn2', startNewCase);
  bindClick('start-new-case-btn3', startNewCase);
  bindClick('view-summary-btn', () => { State.currentPage = 'aiSummary'; render(); });

  // Wizard Navigation
  bindClick('wizard-next', handleWizardNext);
  // BUG FIX: save current step data before going back so no data is lost
  bindClick('wizard-back', () => {
    if (State.wizardStep > 1) {
      saveWizardStep(State.wizardStep); // persist current fields first
      State.wizardStep--;
      render();
    }
  });
  bindClick('submit-wizard-btn', handleWizardSubmit);

  // BMI calculation
  const wEl = document.getElementById('s1-weight');
  const hEl = document.getElementById('s1-height');
  if (wEl) wEl.addEventListener('input', calcBMI);
  if (hEl) hEl.addEventListener('input', calcBMI);

  // Step 3: add another surgery card
  bindClick('add-surgery-btn', addSurgeryCard);

  // Patient filter

  const pSearch = document.getElementById('patient-search-input');
  if (pSearch) pSearch.addEventListener('input', (e) => filterPatients(e.target.value));
}

function bindClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ---- Step 3 Helpers ----
function filterPMH(query) {
  const grid = document.getElementById('pmh-checkbox-grid');
  if (!grid) return;
  grid.querySelectorAll('label').forEach(lbl => {
    const text = lbl.textContent.toLowerCase();
    lbl.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
  });
}

function toggleSurgicalSection(val) {
  const hidden = document.getElementById('s3-has-surgical');
  const section = document.getElementById('surgery-detail-section');
  if (hidden) hidden.value = val;
  if (section) section.style.display = val === 'yes' ? 'block' : 'none';
  const yesBtn = document.getElementById('surgical-yes-btn');
  const noBtn  = document.getElementById('surgical-no-btn');
  if (yesBtn) yesBtn.className = `px-5 py-2 rounded-xl font-semibold text-sm transition-all ${val==='yes' ? 'bg-gradient-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-teal-50'}`;
  if (noBtn)  noBtn.className  = `px-5 py-2 rounded-xl font-semibold text-sm transition-all ${val==='no'  ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
}

function removeSurgeryCard(i) {
  const card = document.getElementById(`surgery-card-${i}`);
  if (card) card.remove();
}

// addSurgeryCard is triggered by "Add Another Surgery" button (id: add-surgery-btn)
function addSurgeryCard() {
  const list = document.getElementById('surgery-list');
  if (!list) return;
  const i = list.children.length;
  list.insertAdjacentHTML('beforeend', renderSurgeryCard({}, i));
}

// Document type selection + upload
let _selectedDocType = '';
function selectDocType(el, type) {
  _selectedDocType = type;
  document.querySelectorAll('#doc-type-tags .chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

function handleDocUpload(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  if (!State.wizardData.step3) State.wizardData.step3 = {};
  if (!State.wizardData.step3.documents) State.wizardData.step3.documents = [];
  const list = document.getElementById('doc-file-list');
  files.forEach(file => {
    const type = _selectedDocType || 'Other';
    const sizeStr = file.size < 1024*1024 ? Math.round(file.size/1024)+'KB' : (file.size/1024/1024).toFixed(1)+'MB';
    const doc = { type, name: file.name, size: sizeStr };
    State.wizardData.step3.documents.push(doc);
    if (list) {
      list.insertAdjacentHTML('beforeend', `
      <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-sm">
        <span class="badge badge-teal">${type}</span>
        <span class="flex-1 truncate text-slate-700">${file.name}</span>
        <span class="text-xs text-slate-400">${sizeStr}</span>
      </div>`);
    }
  });
  showToast(`${files.length} file(s) uploaded successfully!`, 'success');
  input.value = '';
}

// ---- Step 4 Helpers ----
function toggleAllergyBox(checkbox, boxId) {
  const box = document.getElementById(boxId);
  if (box) box.style.display = checkbox.checked ? 'block' : 'none';
}

function toggleSubstanceFreq(checkbox, freqId) {
  const freq = document.getElementById(freqId);
  if (freq) freq.style.display = checkbox.checked ? 'block' : 'none';
}



function handleWizardNext() {
  const step = State.wizardStep;
  if (!saveWizardStep(step)) return;
  if (step < 5) { State.wizardStep++; render(); }
}

function saveWizardStep(step) {
  if (step === 1) {
    const name = val('s1-name');
    if (!name) { showToast('Full Name is required.','error'); return false; }
    const weight = val('s1-weight');
    const height = val('s1-height');
    let bmi = '';
    if (weight && height) { bmi = (parseFloat(weight) / ((parseFloat(height)/100)**2)).toFixed(1); }
    State.wizardData.step1 = {
      ...State.wizardData.step1,
      fullName:   name,
      gender:     val('s1-gender'),
      dob:        val('s1-dob'),
      age:        val('s1-age'),
      bloodGroup: val('s1-blood'),
      contact:    val('s1-contact'),
      weight, height, bmi,
      ecName:     val('s1-ec-name'),
      ecPhone:    val('s1-ec-phone'),
      address:    val('s1-address'),
    };
    return true;
  }
  if (step === 2) {
    const complaint = val('s2-complaint');
    if (!complaint) { showToast('Complaint Name is required.','error'); return false; }
    const symptomsEl   = document.getElementById('selected-symptoms');
    const bodyRegEl    = document.getElementById('selected-body-regions');
    const syms         = symptomsEl ? symptomsEl.value.split(',').filter(Boolean) : [];
    const bodyRegions  = bodyRegEl  ? bodyRegEl.value.split(',').filter(Boolean)  : [];
    const onsetEl      = document.querySelector('input[name="onset"]:checked');
    State.wizardData.step2 = {
      ...State.wizardData.step2,
      complaintName:      complaint,
      durationVal:        val('s2-dur-val'),
      durationUnit:       val('s2-dur-unit'),
      onset:              onsetEl ? onsetEl.value : (State.wizardData.step2.onset || ''),
      progression:        val('s2-progression'),
      symptoms:           syms,
      bodyRegions,
      otherSymptom:       val('s2-other'),
      severity:           document.getElementById('s2-severity')?.value || '5',
      aggravating:        val('s2-aggravating'),
      relieving:          val('s2-relieving'),
      associatedHistory:  val('s2-associated'),
    };
    return true;
  }
  if (step === 3) {
    const pmh = [...document.querySelectorAll('.pmh-check:checked')].map(c => c.value);
    // Collect surgery cards
    const surgeries = [...document.querySelectorAll('.surgery-card')].map(card => ({
      name:        card.querySelector('.surg-name')?.value || '',
      date:        card.querySelector('.surg-date')?.value || '',
      hospital:    card.querySelector('.surg-hospital')?.value || '',
      reason:      card.querySelector('.surg-reason')?.value || '',
      complication:card.querySelector('.surg-complication')?.value || '',
      outcome:     card.querySelector('.surg-outcome')?.value || '',
      anesthesia:  card.querySelector('.surg-anesthesia')?.value || '',
    }));
    // Collect documents (already stored in state during upload)
    const docs = State.wizardData.step3?.documents || [];
    State.wizardData.step3 = {
      ...State.wizardData.step3,
      pastMedical:  pmh,
      pmhOther:     val('s3-pmh-other'),
      pmhSearch:    val('pmh-search'),
      hasSurgical:  document.getElementById('s3-has-surgical')?.value || '',
      surgeries,
      documents:    docs,
    };
    return true;
  }
  if (step === 4) {
    // Collect allergy history
    const allergyHistory = {};
    document.querySelectorAll('.allergy-type-enable').forEach(cb => {
      const atype = cb.dataset.atype;
      allergyHistory[atype] = {
        enabled: cb.checked,
        desc:    document.querySelector(`.allergy-desc[data-atype="${atype}"]`)?.value || '',
        date:    document.querySelector(`.allergy-date[data-atype="${atype}"]`)?.value || '',
      };
    });
    // Collect substance use
    const substances = {};
    document.querySelectorAll('.substance-check').forEach(cb => {
      const k = cb.dataset.subkey;
      substances[k] = {
        uses: cb.checked,
        freq: document.querySelector(`.substance-freq[data-subkey="${k}"]`)?.value || '',
      };
    });
    State.wizardData.step4 = {
      allergyHistory,
      substances,
      familyBackground: {
        familyHistory:       val('s4-family-history'),
        mentalHistory:       val('s4-mental-history'),
        reproductiveHistory: val('s4-reproductive-history'),
        familialOther:       val('s4-familial-other'),
      },
      lifestyle: {
        diet:       val('s4-diet'),
        sleep:      val('s4-sleep'),
        activity:   val('s4-activity'),
        occupation: val('s4-occupation'),
        marital:    val('s4-marital'),
        stress:     val('s4-stress'),
      },
    };
    return true;
  }
  return true;
}

function handleWizardSubmit() {
  const declared = document.getElementById('declaration-check')?.checked;
  if (!declared) { showToast('Please accept the declaration to submit.','error'); return; }

  // Add to patients list
  const newPatient = {
    id: State.currentUser?.id || generatePatientId(),
    name: State.wizardData.step1.fullName || State.currentUser?.name,
    age: State.wizardData.step1.age || '',
    gender: State.wizardData.step1.gender || '',
    complaint: State.wizardData.step2.complaintName || 'General',
    status: 'Completed',
    date: new Date().toLocaleDateString('en-IN'),
  };
  State.patients.unshift(newPatient);
  saveState();

  // Show loading then navigate to summary
  const btn = document.getElementById('submit-wizard-btn');
  if (btn) {
    btn.innerHTML = '<div class="spinner mx-auto" style="width:24px;height:24px;border-width:3px;"></div>';
    btn.disabled = true;
  }
  const mainEl = document.querySelector('.main-content main');
  if (mainEl) {
    mainEl.insertAdjacentHTML('afterbegin', `
    <div id="loading-overlay" style="position:fixed;inset:0;background:rgba(248,250,252,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;gap:1rem;">
      <div class="spinner" style="width:56px;height:56px;border-width:4px;"></div>
      <div class="text-lg font-semibold text-navy">Generating your clinical report...</div>
      <div class="text-sm text-slate-400">AI is analyzing your case data</div>
    </div>`);
  }
  setTimeout(() => {
    State.currentPage = 'aiSummary';
    State.activeNav   = 'reports';
    render();
    showToast('Clinical summary generated successfully!','success');
  }, 2500);
}

// ---- Wizard Helpers ----
function goToStep(n) { if (n >= 1 && n <= 5) { State.wizardStep = n; render(); } }

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.accordion-arrow');
  if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
  if (arrow) arrow.textContent = body?.style.display === 'none' ? '▶' : '▼';
}

function toggleSymptom(el, symptom) {
  el.classList.toggle('selected');
  const hiddenEl = document.getElementById('selected-symptoms');
  if (!hiddenEl) return;
  let syms = hiddenEl.value.split(',').filter(Boolean);
  if (el.classList.contains('selected')) { if (!syms.includes(symptom)) syms.push(symptom); }
  else { syms = syms.filter(s => s !== symptom); }
  hiddenEl.value = syms.join(',');
  // Toggle "Other" text field
  const otherGroup = document.getElementById('other-symptom-group');
  if (otherGroup) otherGroup.classList.toggle('hidden', !syms.includes('Other'));
}

function togglePassword(inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.textContent = el.type === 'password' ? '👁' : '🙈';
}

function toggleCaptcha(checkId, tickId) {
  const check = document.getElementById(checkId);
  const tick  = document.getElementById(tickId);
  if (!check || !tick) return;
  const isChecked = !tick.classList.contains('hidden');
  tick.classList.toggle('hidden');
  check.style.background = isChecked ? '' : '#0EA5A0';
  check.style.color = isChecked ? '' : 'white';
  check.style.borderColor = isChecked ? '' : '#0EA5A0';
}

function calcBMI() {
  const w = parseFloat(document.getElementById('s1-weight')?.value);
  const h = parseFloat(document.getElementById('s1-height')?.value);
  const bmiEl = document.getElementById('s1-bmi');
  if (!bmiEl) return;
  if (w > 0 && h > 0) {
    const bmi = (w / ((h/100)**2)).toFixed(1);
    let category = '';
    if (bmi < 18.5) category = ' (Underweight)';
    else if (bmi < 25) category = ' (Normal weight)';
    else if (bmi < 30) category = ' (Overweight)';
    else category = ' (Obese)';
    bmiEl.value = bmi + category;
  } else {
    bmiEl.value = '';
  }
}

function addMedRow() {
  const container = document.getElementById('med-list');
  if (!container) return;
  const i = container.children.length;
  container.insertAdjacentHTML('beforeend', renderMedRow({ drug:'', dose:'', freq:'' }, i));
}

function removeMedRow(i) {
  const row = document.getElementById(`med-row-${i}`);
  if (row) row.remove();
}

function filterPatients(query) {
  const tbody = document.getElementById('patients-tbody');
  if (!tbody) return;
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
  });
}

function filterPatientsPage(query) {
  const tbody = document.getElementById('pt-page-tbody');
  if (!tbody) return;
  const statusFilter = document.getElementById('pt-status-filter')?.value?.toLowerCase() || '';
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const matchesQuery  = !query      || text.includes(query.toLowerCase());
    const matchesStatus = !statusFilter || text.includes(statusFilter);
    row.style.display = (matchesQuery && matchesStatus) ? '' : 'none';
  });
}

function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    State.wizardData.step1.photoUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

function downloadPDF() {
  showToast('Preparing PDF download...', 'info');
  setTimeout(() => {
    const content = document.getElementById('summary-content');
    if (!content) { showToast('Could not generate PDF.','error'); return; }
    // Open print dialog as PDF fallback
    window.print();
    showToast('Use "Save as PDF" in print dialog to download.','info');
  }, 500);
}

function startNewCase() {
  State.currentPage = 'wizard';
  State.wizardStep  = 1;
  State.activeNav   = 'newcase';
  const savedName  = State.currentUser?.name || '';
  const savedPhone = State.currentUser?.phone || '';
  State.wizardData = {
    step1: { fullName: savedName, contact: savedPhone },
    step2: {}, step3: { documents: [], surgeries: [], hasSurgical: '' }, step4: {}, step5: {}
  };
  render();
}


// ===========================
//   HOME PAGE (Landing)
// ===========================

// ===========================
//   PATIENTS PAGE (Doctor)
// ===========================
function renderPatientsPage() {
  const patients = State.patients.length > 0 ? State.patients : getDemoPatients();
  return `
  <div class="animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-navy flex items-center gap-2">🧑‍⚕️ All Patients</h1>
        <p class="text-sm text-slate-400 mt-1">Complete patient registry — ${patients.length} records found</p>
      </div>
      <button class="btn-primary flex items-center gap-2" onclick="startNewCase()">➕ New Patient Case</button>
    </div>

    <div class="card p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="search-bar flex-1">
          <span class="text-slate-400">🔍</span>
          <input type="text" placeholder="Search by name, ID, complaint or status..." id="pt-page-search" oninput="filterPatientsPage(this.value)" />
        </div>
        <select id="pt-status-filter" class="input-field" style="width:160px;" onchange="filterPatientsPage(document.getElementById('pt-page-search').value)">
          <option value="">All Status</option>
          <option>Completed</option>
          <option>Pending Review</option>
          <option>In Progress</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table" id="pt-page-table">
          <thead><tr>
            <th>Patient ID</th><th>Name</th><th>Age / Gender</th><th>Chief Complaint</th><th>Date</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody id="pt-page-tbody">
            ${patients.map(p => {
              const statusColors = { 'Completed':'badge-green','Pending Review':'badge-orange','In Progress':'badge-teal' };
              return `<tr>
                <td><span class="font-mono text-xs font-semibold text-primary">${p.id}</span></td>
                <td class="font-medium">${p.name}</td>
                <td>${p.age || '—'} / ${p.gender || '—'}</td>
                <td>${p.complaint}</td>
                <td class="text-slate-500 text-sm">${p.date || '—'}</td>
                <td><span class="badge ${statusColors[p.status] || 'badge-navy'}">${p.status}</span></td>
                <td><button class="btn-primary text-xs px-3 py-1" onclick="showToast('Opening case for ${p.name}...','info')">View Case</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between mt-4 text-sm text-slate-400">
        <span>Showing ${patients.length} of ${patients.length} patients</span>
        <div class="flex gap-2">
          <button class="btn-ghost border border-slate-200 text-xs px-3 py-1" onclick="showToast('Export feature coming soon!','info')">📥 Export CSV</button>
          <button class="btn-ghost border border-slate-200 text-xs px-3 py-1" onclick="showToast('Print list feature coming soon!','info')">🖨️ Print List</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ===========================
//   REPORTS PAGE
// ===========================
function renderReportsPage() {
  const hasCase = State.wizardData?.step1?.fullName;
  const patient = State.currentUser;
  const isDoctor = patient?.role === 'doctor';
  const patients = State.patients.length > 0 ? State.patients : (isDoctor ? getDemoPatients() : []);

  return `
  <div class="animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-navy flex items-center gap-2">📄 Reports</h1>
        <p class="text-sm text-slate-400 mt-1">Clinical summaries and generated case reports</p>
      </div>
      ${hasCase ? `<button class="btn-primary" onclick="State.currentPage='aiSummary';render();">📄 View Latest Summary</button>` : ''}
    </div>

    ${hasCase ? `
    <div class="card p-5 mb-4" style="border-left:4px solid #0EA5A0;">
      <div class="flex items-center justify-between">
        <div>
          <div class="ai-badge mb-2">✨ AI-Generated</div>
          <h3 class="font-bold text-navy">Clinical Summary — ${State.wizardData.step1.fullName}</h3>
          <p class="text-sm text-slate-500 mt-1">Chief Complaint: ${State.wizardData.step2?.complaintName || 'General Consultation'} • Generated ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-outline text-sm" onclick="State.currentPage='aiSummary';render();">View Full Report →</button>
          <button class="btn-primary text-sm" onclick="downloadPDF()">📄 Download PDF</button>
        </div>
      </div>
    </div>` : ''}

    <div class="card p-5">
      <h3 class="font-bold text-navy mb-4">📋 ${isDoctor ? 'All Patient Reports' : 'My Case Reports'}</h3>
      ${(isDoctor ? patients : (hasCase ? [{ id: State.currentUser?.id, name: State.wizardData?.step1?.fullName, complaint: State.wizardData?.step2?.complaintName || 'General', date: new Date().toLocaleDateString('en-IN'), status:'Completed' }] : [])).length > 0 ?
      `<div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Case ID</th><th>Patient</th><th>Chief Complaint</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${(isDoctor ? patients : [{ id: State.currentUser?.id, name: State.wizardData?.step1?.fullName, complaint: State.wizardData?.step2?.complaintName || 'General', date: new Date().toLocaleDateString('en-IN'), status:'Completed' }]).map((p, i) => `
            <tr>
              <td><span class="font-mono text-xs font-semibold text-primary">CASE-${String(i+1).padStart(3,'0')}</span></td>
              <td class="font-medium">${p.name}</td>
              <td>${p.complaint}</td>
              <td class="text-slate-500 text-sm">${p.date || '—'}</td>
              <td><span class="badge badge-green">${p.status || 'Completed'}</span></td>
              <td><button class="btn-primary text-xs px-3 py-1" onclick="State.currentPage='aiSummary';render();">View →</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` :
      `<div class="text-center py-12 text-slate-400">
        <div class="text-5xl mb-3">📄</div>
        <p class="font-semibold">No reports yet</p>
        <p class="text-sm mt-1">Complete a case to generate your first clinical report</p>
        <button class="btn-primary mt-4" onclick="startNewCase()">Start a New Case</button>
      </div>`}
    </div>
  </div>`;
}

// ===========================
//   RECORDS PAGE (Patient)
// ===========================
function renderRecordsPage() {
  const hasCase = State.wizardData?.step1?.fullName;
  const d1 = State.wizardData?.step1 || {};
  const d2 = State.wizardData?.step2 || {};

  return `
  <div class="animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-navy flex items-center gap-2">📁 My Records</h1>
        <p class="text-sm text-slate-400 mt-1">Your complete health record history</p>
      </div>
      <button class="btn-primary" onclick="startNewCase()">➕ New Case</button>
    </div>

    ${hasCase ? `
    <div class="card p-5 mb-5">
      <div class="flex items-center gap-4 pb-4 border-b border-slate-100 mb-4">
        <div class="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          ${(d1.fullName || State.currentUser?.name || 'P').charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 class="font-bold text-navy text-lg">${d1.fullName || State.currentUser?.name || 'Patient'}</h3>
          <div class="flex flex-wrap gap-2 mt-1">
            ${d1.bloodGroup ? `<span class="badge badge-red">🩸 ${d1.bloodGroup}</span>` : ''}
            ${d1.age ? `<span class="badge badge-navy">${d1.age} yrs</span>` : ''}
            ${d1.gender ? `<span class="badge badge-teal">${d1.gender}</span>` : ''}
            <div class="patient-id-badge" style="font-size:0.72rem;padding:0.2rem 0.65rem;">${State.currentUser?.id || ''}</div>
          </div>
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        ${[['📞 Contact', d1.contact || '—'], ['⚖️ Weight', d1.weight ? d1.weight + ' kg' : '—'], ['📏 Height', d1.height ? d1.height + ' cm' : '—'], ['🧮 BMI', d1.bmi || '—'], ['🏠 Address', d1.address || '—'], ['🆘 Emergency Contact', d1.ecName ? d1.ecName + (d1.ecPhone ? ' · ' + d1.ecPhone : '') : '—']].map(([l,v]) =>
          `<div class="p-3 rounded-xl bg-slate-50">
            <div class="text-xs font-semibold text-slate-400 mb-1">${l.split(' ').slice(1).join(' ')}</div>
            <div class="text-sm font-medium text-slate-700">${v}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="card p-5">
      <h3 class="font-bold text-navy mb-4">📋 Case History</h3>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Case ID</th><th>Date</th><th>Chief Complaint</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            <tr>
              <td><span class="font-mono text-xs font-semibold text-primary">CASE-001</span></td>
              <td>${new Date().toLocaleDateString('en-IN')}</td>
              <td>${d2.complaintName || 'General Consultation'}</td>
              <td><span class="badge badge-orange">${d2.severity || '5'}/10</span></td>
              <td><span class="badge badge-green">Completed</span></td>
              <td><button class="btn-primary text-xs px-3 py-1" onclick="State.currentPage='aiSummary';render();">View Report →</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>` : `
    <div class="card p-5">
      <div class="text-center py-12 text-slate-400">
        <div class="text-5xl mb-3">📁</div>
        <p class="font-semibold">No records found</p>
        <p class="text-sm mt-1">Start a new case to create your first health record</p>
        <button class="btn-primary mt-4" onclick="startNewCase()">Start Your First Case</button>
      </div>
    </div>`}
  </div>`;
}

// ===========================
//   PROFILE PAGE (Patient)
// ===========================
function renderProfilePage() {
  const u = State.currentUser || {};
  const d1 = State.wizardData?.step1 || {};
  const d4 = State.wizardData?.step4 || {};
  const name = d1.fullName || u.name || 'Patient';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return `
  <div class="animate-fade-in max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-navy flex items-center gap-2">👤 My Profile</h1>
        <p class="text-sm text-slate-400 mt-1">Your personal and health information</p>
      </div>
      <button class="btn-outline" onclick="showToast('Profile editing coming soon!','info')">✏️ Edit Profile</button>
    </div>

    <!-- Profile Header -->
    <div class="card p-6 mb-4">
      <div class="flex items-center gap-5">
        <div class="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-black flex-shrink-0">${initials}</div>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-navy">${name}</h2>
          <div class="flex flex-wrap gap-2 mt-2">
            <div class="patient-id-badge">${u.id || '—'}</div>
            <span class="badge badge-teal">🩺 Patient Account</span>
            ${d1.bloodGroup ? `<span class="badge badge-red">🩸 ${d1.bloodGroup}</span>` : ''}
          </div>
          <p class="text-sm text-slate-400 mt-2">📧 ${u.email || '—'}</p>
        </div>
      </div>
    </div>

    <!-- Basic Info -->
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-4 flex items-center gap-2">🪪 Basic Information</h3>
      <div class="grid md:grid-cols-2 gap-4">
        ${[['Full Name', name], ['Gender', d1.gender || '—'], ['Date of Birth', d1.dob ? new Date(d1.dob).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—'], ['Age', d1.age ? d1.age + ' years' : '—'], ['Blood Group', d1.bloodGroup || '—'], ['Contact', d1.contact || u.phone || '—'], ['Weight', d1.weight ? d1.weight + ' kg' : '—'], ['Height', d1.height ? d1.height + ' cm' : '—'], ['BMI', d1.bmi || '—'], ['Address', d1.address || '—']].map(([l,v]) =>
          `<div class="report-row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
      </div>
    </div>

    <!-- Emergency Contact -->
    ${d1.ecName ? `
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-4">🆘 Emergency Contact</h3>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="report-row"><span class="label">Name</span><span class="value">${d1.ecName}</span></div>
        <div class="report-row"><span class="label">Phone</span><span class="value">${d1.ecPhone || '—'}</span></div>
      </div>
    </div>` : ''}

    <!-- Lifestyle -->
    ${(d4.lifestyle && Object.values(d4.lifestyle).some(Boolean)) ? `
    <div class="card p-5 mb-4">
      <h3 class="font-bold text-navy mb-4">🌿 Lifestyle</h3>
      <div class="grid md:grid-cols-2 gap-4">
        ${[['Diet', d4.lifestyle?.diet], ['Sleep Pattern', d4.lifestyle?.sleep], ['Physical Activity', d4.lifestyle?.activity], ['Occupation', d4.lifestyle?.occupation], ['Marital Status', d4.lifestyle?.marital], ['Stress Level', d4.lifestyle?.stress]].filter(([,v]) => v).map(([l,v]) =>
          `<div class="report-row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Account Actions -->
    <div class="card p-5">
      <h3 class="font-bold text-navy mb-4">⚙️ Account</h3>
      <div class="flex flex-wrap gap-3">
        <button class="btn-outline" onclick="showToast('Password change coming soon!','info')">🔑 Change Password</button>
        <button class="btn-ghost border border-slate-200" onclick="showToast('Privacy settings coming soon!','info')">🔒 Privacy Settings</button>
        <button class="btn-ghost border border-red-200 text-red-500" onclick="document.getElementById('logout-btn').click()">🚪 Sign Out</button>
      </div>
    </div>
  </div>`;
}

// ===========================
//   HOME PAGE (Landing)
// ===========================
function renderHome() {
  return `
  <div class="min-h-screen" style="background:#F8FAFC;font-family:'Inter',sans-serif;">

    <!-- ===== TOP NAV ===== -->
    <nav style="background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);border-bottom:1px solid #E2E8F0;position:sticky;top:0;z-index:50;box-shadow:0 2px 20px rgba(30,58,138,0.06);">
      <div style="max-width:1200px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:64px;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          ${LOGO_SVG}
          ${logoWordmark('md')}
        </div>
        <div style="display:flex;align-items:center;gap:1rem;">
          <span class="badge badge-navy" style="font-size:0.75rem;">SIH26047</span>
          <button class="btn-primary" id="home-login-btn" style="padding:0.5rem 1.4rem;">Sign In →</button>
        </div>
      </div>
    </nav>

    <!-- ===== HERO ===== -->
    <section style="background:linear-gradient(135deg,#1E3A8A 0%,#0EA5A0 55%,#22C55E 100%);padding:5rem 1.5rem 4rem;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-80px;left:-80px;width:350px;height:350px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
      <div style="position:absolute;bottom:-60px;right:-60px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
      <div style="position:absolute;top:30%;left:5%;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,0.03);"></div>
      <div style="max-width:780px;margin:0 auto;position:relative;animation:slideUp 0.6s ease-out;">
        <div class="ai-badge" style="display:inline-flex;margin-bottom:1.25rem;background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.3);color:white;">✨ AI-Powered Clinical Summarization</div>
        <h1 style="font-size:clamp(2.2rem,5vw,3.5rem);font-weight:900;color:#fff;line-height:1.15;margin-bottom:1.25rem;letter-spacing:-0.02em;">
          Understand Every Patient's Case<br/>
          <span style="opacity:0.85;">in Under 60 Seconds</span>
        </h1>
        <p style="font-size:1.15rem;color:rgba(255,255,255,0.82);max-width:580px;margin:0 auto 2rem;line-height:1.7;">
          ArogyaX is an AI-powered patient case-taking &amp; clinical summarization platform — helping doctors get a complete, structured clinical summary before the consultation even begins.
        </p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn-primary" id="hero-cta-btn" style="padding:0.85rem 2.2rem;font-size:1rem;background:rgba(255,255,255,0.95);color:#0EA5A0;box-shadow:0 6px 24px rgba(0,0,0,0.2);">🚀 Get Started Free</button>
          <button class="btn-outline" id="hero-learn-btn" style="padding:0.85rem 2rem;font-size:1rem;border-color:rgba(255,255,255,0.5);color:white;" onclick="document.getElementById('about-section').scrollIntoView({behavior:'smooth'})">Learn More ↓</button>
        </div>
      </div>
    </section>

    <!-- ===== STATS BAR ===== -->
    <section style="background:#fff;border-bottom:1px solid #F1F5F9;padding:1.5rem;">
      <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.5rem;text-align:center;">
        ${[
          { value:'30–60s', label:'Average summary time' },
          { value:'5 Steps', label:'Structured case-taking' },
          { value:'100%', label:'Secure & encrypted' },
          { value:'SIH26047', label:'Smart India Hackathon' },
        ].map(s => `
        <div>
          <div style="font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,#0EA5A0,#22C55E);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${s.value}</div>
          <div style="font-size:0.82rem;color:#64748B;font-weight:500;margin-top:0.2rem;">${s.label}</div>
        </div>`).join('')}
      </div>
    </section>

    <!-- ===== ABOUT ===== -->
    <section id="about-section" style="max-width:1100px;margin:0 auto;padding:4rem 1.5rem;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;">
        <div class="animate-fade-in">
          <span class="badge badge-teal" style="margin-bottom:1rem;display:inline-flex;">💡 The Problem We Solve</span>
          <h2 style="font-size:2rem;font-weight:800;color:#1E3A8A;line-height:1.3;margin-bottom:1rem;">Doctors Spend Too Much Time on History-Taking</h2>
          <p style="color:#475569;line-height:1.8;margin-bottom:1rem;">
            In busy OPDs, a doctor may see 50–100 patients a day. Traditional history-taking takes <strong>5–15 minutes per patient</strong> — leaving little time for actual diagnosis and care.
          </p>
          <p style="color:#475569;line-height:1.8;margin-bottom:1.5rem;">
            <strong>ArogyaX flips the workflow.</strong> Patients fill a guided, structured case-taking wizard before their appointment. By the time they walk in, the doctor already has a complete, AI-generated clinical summary — covering chief complaints, symptoms, medical history, allergies, and lifestyle — ready to review.
          </p>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            ${[
              '✅ Reduces history-taking time to under 60 seconds',
              '✅ Structured data — no missing critical information',
              '✅ AI clinical summary ready before the consultation',
              '✅ Patients can fill the form from home, in their own language',
            ].map(pt => `<div style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.92rem;color:#374151;">${pt}</div>`).join('')}
          </div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(14,165,160,0.08),rgba(34,197,94,0.05));border-radius:1.5rem;padding:2rem;border:1px solid rgba(14,165,160,0.12);">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <div style="font-size:4rem;">🏥</div>
            <div style="font-weight:700;color:#1E3A8A;font-size:1.1rem;margin-top:0.5rem;">Before ArogyaX</div>
          </div>
          ${[
            { t:'Patient arrives', s:'Doctor starts history-taking from scratch' },
            { t:'5–15 min later', s:'Relevant history finally gathered (maybe)' },
            { t:'Rushed diagnosis', s:'Less time left for actual clinical reasoning' },
          ].map((r,i) => `
          <div style="display:flex;gap:0.75rem;margin-bottom:1rem;padding:0.75rem;background:#fff;border-radius:0.75rem;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#EF4444,#F97316);color:white;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">${i+1}</div>
            <div><div style="font-weight:600;font-size:0.85rem;color:#1E293B;">${r.t}</div><div style="font-size:0.8rem;color:#64748B;margin-top:0.15rem;">${r.s}</div></div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ===== HOW IT WORKS ===== -->
    <section style="background:linear-gradient(135deg,#1E3A8A 0%,#0EA5A0 100%);padding:4rem 1.5rem;">
      <div style="max-width:1000px;margin:0 auto;text-align:center;">
        <span class="badge" style="background:rgba(255,255,255,0.15);color:white;border:none;margin-bottom:1rem;display:inline-flex;">⚡ Workflow</span>
        <h2 style="font-size:2rem;font-weight:800;color:#fff;margin-bottom:0.75rem;">How ArogyaX Works</h2>
        <p style="color:rgba(255,255,255,0.75);margin-bottom:3rem;max-width:540px;margin-left:auto;margin-right:auto;">A simple 4-step process that transforms patient history-taking</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;">
          ${[
            { step:'1', icon:'📝', title:'Register', desc:'Patient creates a secure account and gets a unique ID (UHD-XXXXXX).' },
            { step:'2', icon:'🩺', title:'Fill Case Wizard', desc:'Guided 4-step wizard: demographics, symptoms, medical history, allergy & lifestyle.' },
            { step:'3', icon:'✨', title:'AI Generates Summary', desc:'ArogyaX AI produces a structured clinical summary with treatment recommendations.' },
            { step:'4', icon:'👨‍⚕️', title:'Doctor Reviews', desc:'Doctor opens the dashboard, reads the summary in 30–60 seconds, and begins focused care.' },
          ].map(s => `
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.18);border-radius:1.25rem;padding:1.75rem 1.25rem;text-align:center;transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin:0 auto 1rem;">${ s.icon}</div>
            <div style="background:rgba(255,255,255,0.15);color:white;font-size:0.72rem;font-weight:700;border-radius:2rem;padding:0.2rem 0.6rem;display:inline-block;margin-bottom:0.6rem;">STEP ${s.step}</div>
            <div style="font-weight:700;color:#fff;margin-bottom:0.5rem;font-size:1rem;">${s.title}</div>
            <div style="color:rgba(255,255,255,0.72);font-size:0.85rem;line-height:1.6;">${s.desc}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ===== FEATURES ===== -->
    <section style="max-width:1100px;margin:0 auto;padding:4rem 1.5rem;">
      <div style="text-align:center;margin-bottom:3rem;">
        <span class="badge badge-teal" style="margin-bottom:1rem;display:inline-flex;">🌟 Features</span>
        <h2 style="font-size:2rem;font-weight:800;color:#1E3A8A;margin-bottom:0.75rem;">Everything You Need for Modern Case-Taking</h2>
        <p style="color:#64748B;max-width:520px;margin:0 auto;">ArogyaX covers the full clinical history workflow — digitally, securely, and intelligently.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;">
        ${[
          { icon:'📋', title:'Guided Multi-Step Wizard', desc:'A structured 4-step case-taking wizard collects patient demographics, chief complaints, medical history, and social history &#8212; ensuring nothing is missed.' },
          { icon:'✨', title:'AI Clinical Summarization', desc:'Automatically generates a readable, doctor-ready clinical summary from raw patient inputs &#8212; formatted like a proper clinical history.' },
          { icon:'🔒', title:'Secure PDF Reports', desc:'Generate encrypted, downloadable PDF case summaries. Print or share securely with the treating physician.' },
          { icon:'🏠', title:'Patient Dashboard', desc:'Patients can view their case history, track status, and manage their health records &#8212; all in one place.' },
          { icon:'👨‍⚕️', title:'Doctor Dashboard', desc:"Doctors get a bird&#39;s-eye view of all patients, pending reviews, case statuses, and today&#39;s appointments." },
          { icon:'🗺️', title:'Interactive Body Map', desc:'Patients mark affected body regions on an interactive 2D and 3D body map &#8212; giving precise anatomical context to complaints.' },
        ].map(f => `
        <div class="card" style="padding:1.75rem;transition:transform 0.2s,box-shadow 0.2s;cursor:default;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
          <div style="font-size:2rem;margin-bottom:1rem;">${f.icon}</div>
          <h3 style="font-weight:700;color:#1E3A8A;margin-bottom:0.6rem;font-size:1rem;">${f.title}</h3>
          <p style="color:#64748B;font-size:0.87rem;line-height:1.65;">${f.desc}</p>
        </div>`).join('')}
      </div>
    </section>

    <!-- ===== CTA BANNER ===== -->
    <section style="margin:0 1.5rem 4rem;max-width:1100px;margin-left:auto;margin-right:auto;">
      <div style="background:linear-gradient(135deg,#1E3A8A 0%,#0EA5A0 60%,#22C55E 100%);border-radius:1.5rem;padding:3rem 2rem;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
        <div style="position:relative;">
          <h2 style="font-size:1.75rem;font-weight:800;color:#fff;margin-bottom:0.75rem;">Ready to Transform Your Clinical Workflow?</h2>
          <p style="color:rgba(255,255,255,0.78);margin-bottom:2rem;max-width:480px;margin-left:auto;margin-right:auto;">Join ArogyaX today and give every patient the clinical attention they deserve — in record time.</p>
          <button class="btn-primary" id="cta-bottom-btn" style="padding:0.85rem 2.5rem;font-size:1rem;background:rgba(255,255,255,0.95);color:#0EA5A0;box-shadow:0 6px 24px rgba(0,0,0,0.2);">🚀 Get Started Now</button>
        </div>
      </div>
    </section>

    <!-- ===== FOOTER ===== -->
    <footer style="background:#1E293B;padding:2rem 1.5rem;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-bottom:0.75rem;">
        ${LOGO_SVG.replace('width="38"','width="28"').replace('height="38"','height="28"')}
        ${logoWordmark('md')}
      </div>
      <p style="color:#94A3B8;font-size:0.85rem;margin-bottom:0.5rem;">Patient Case-Taking &amp; Clinical Summarization Platform</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-bottom:0.5rem;">
        <span class="badge badge-navy" style="font-size:0.75rem;">SIH26047</span>
        <span style="color:#475569;font-size:0.8rem;">Smart India Hackathon 2026</span>
      </div>
      <p style="color:#475569;font-size:0.78rem;">&copy; 2026 ArogyaX — Built for SIH26047. All rights reserved.</p>
    </footer>

  </div>
  <div id="toast-container"></div>`;
}

// ===========================
//   COMING SOON PAGE
// ===========================
function renderComingSoon(sectionLabel, icon) {
  const dashPage = State.currentUser?.role === 'doctor' ? 'doctorDash' : 'patientDash';
  return `
  <div class="animate-fade-in" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
    <div class="card section-card" style="max-width:440px;width:100%;padding:3rem 2.5rem;text-align:center;">
      <div style="font-size:3.5rem;margin-bottom:1rem;">${icon}</div>
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(14,165,160,0.12),rgba(34,197,94,0.08));display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
        <div class="spinner" style="width:28px;height:28px;border-width:3px;"></div>
      </div>
      <h2 style="font-size:1.4rem;font-weight:800;color:#1E3A8A;margin-bottom:0.5rem;">${sectionLabel} — Coming Soon</h2>
      <p style="color:#64748B;font-size:0.9rem;line-height:1.65;margin-bottom:2rem;">We're actively building the <strong>${sectionLabel}</strong> module. It will be available in a future update. Stay tuned!</p>
      <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
        <button class="btn-primary" style="width:100%;max-width:220px;" onclick="State.currentPage='${dashPage}';State.activeNav='dashboard';render();">← Back to Dashboard</button>
        <button class="btn-ghost border border-slate-200" style="width:100%;max-width:220px;font-size:0.85rem;" onclick="showToast('Section ready notification noted!','info')">🔔 Notify Me When Ready</button>
      </div>
      <div class="ai-badge" style="margin-top:1.75rem;display:inline-flex;">🚧 Under Active Development</div>
    </div>
  </div>`;
}

// ===========================
//   FAVICON
// ===========================
function setFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0EA5A0"/><stop offset="100%" stop-color="#22C55E"/>
    </linearGradient></defs>
    <rect x="30" y="10" width="40" height="80" rx="8" fill="url(#g)"/>
    <rect x="10" y="30" width="80" height="40" rx="8" fill="url(#g)"/>
    <polyline points="22,50 32,50 36,38 41,62 46,44 51,56 56,50 78,50" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  let link   = document.querySelector("link[rel='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.type = 'image/svg+xml';
  link.href = url;
}

// ===========================
//   INIT
// ===========================
(function init() {
  loadState();
  setFavicon();
  // If already logged in, go to appropriate dashboard; otherwise show landing page
  if (State.currentUser) {
    State.currentPage = State.currentUser.role === 'doctor' ? 'doctorDash' : 'patientDash';
  } else {
    State.currentPage = 'home';
  }
  render();
})();
