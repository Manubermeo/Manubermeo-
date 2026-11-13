/**
 * PaveDirt — AuthGate
 * Flujo de autenticación inicial, persistencia de sesión y recuperación con administración.
 */

(function () {
  const SESSION_KEY = 'pavedirt:active_session';
  const USERS_KEY = 'pavedirt:users_db';
  const REQUESTS_KEY = 'pavedirt:reset_requests';

  // Helper para leer/escribir en localStorage de forma segura
  function getLocalJSON(key, defaultVal) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (_) {
      return defaultVal;
    }
  }

  function setLocalJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  // Verifica si ya existe una sesión guardada
  function getActiveSession() {
    return getLocalJSON(SESSION_KEY, null);
  }

  function saveActiveSession(user) {
    setLocalJSON(SESSION_KEY, user);
    // Sincronizar también con la sesión que lee paveDirtAuth
    try {
      localStorage.setItem('pavedirt:last_session', JSON.stringify(user));
    } catch (_) {}
  }

  // Cierre de sesión público
  window.paveDirtLogout = function () {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('pavedirt:last_session');
    } catch (_) {}
    window.location.reload();
  };

  // Si ya hay sesión activa, no mostramos la pantalla de login inicial
  const existingSession = getActiveSession();
  if (existingSession && existingSession.id) {
    // Sesión existente: dejamos que la app principal cargue directo
    return;
  }

  // Si NO hay sesión activa, construimos el guardián de autenticación
  function injectAuthStyles() {
    if (document.getElementById('pavedirt-auth-gate-styles')) return;
    const style = document.createElement('style');
    style.id = 'pavedirt-auth-gate-styles';
    style.textContent = `
      #pavedirt-auth-gate-container {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: #161718;
        color: #F0EEE9;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        overflow-y: auto;
      }
      .pd-auth-card {
        width: 100%;
        max-width: 360px;
        background: #0D0E0F;
        border: 1px solid #2A2B2D;
        border-radius: 18px;
        padding: 26px 20px;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
        animation: pdFadeIn 0.3s ease-out;
      }
      @keyframes pdFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .pd-brand-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 18px;
      }
      .pd-brand-title {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 19px;
        letter-spacing: 0.02em;
        color: #F0EEE9;
      }
      .pd-brand-title span {
        color: #C1502E;
      }
      .pd-auth-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 17px;
        font-weight: 700;
        text-align: center;
        color: #F0EEE9;
        margin-bottom: 4px;
      }
      .pd-auth-subtitle {
        font-size: 12px;
        color: #8A8783;
        text-align: center;
        line-height: 1.4;
        margin-bottom: 18px;
      }
      .pd-tab-row {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        background: #161718;
        padding: 3px;
        border-radius: 12px;
        border: 1px solid #2A2B2D;
      }
      .pd-tab-btn {
        flex: 1;
        padding: 9px 0;
        border: none;
        background: transparent;
        color: #8A8783;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 12px;
        font-weight: 700;
        border-radius: 9px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .pd-tab-btn.active {
        background: #C1502E;
        color: #161718;
      }
      .pd-label {
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #8A8783;
        margin: 12px 0 5px;
      }
      .pd-input {
        width: 100%;
        box-sizing: border-box;
        background: #161718;
        border: 1px solid #2A2B2D;
        color: #F0EEE9;
        padding: 11px 12px;
        border-radius: 10px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      .pd-input:focus {
        border-color: #C1502E;
      }
      .pd-error-msg {
        color: #C1502E;
        font-size: 11px;
        margin-top: 10px;
        line-height: 1.4;
        display: none;
      }
      .pd-submit-btn {
        width: 100%;
        background: #B4FF39;
        color: #161718;
        border: none;
        border-radius: 12px;
        padding: 13px 0;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        margin-top: 18px;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.2s;
      }
      .pd-submit-btn:hover {
        opacity: 0.94;
      }
      .pd-submit-btn:active {
        transform: scale(0.99);
      }
      .pd-forgot-btn {
        display: block;
        width: 100%;
        text-align: center;
        background: none;
        border: none;
        color: #8A8783;
        font-size: 11px;
        margin-top: 14px;
        cursor: pointer;
        text-decoration: underline;
        font-family: inherit;
      }
      .pd-forgot-btn:hover {
        color: #F0EEE9;
      }

      /* Modal de recuperación */
      .pd-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .pd-modal-card {
        width: 100%;
        max-width: 380px;
        max-height: 85vh;
        overflow-y: auto;
        background: #0D0E0F;
        border: 1px solid #2A2B2D;
        border-radius: 18px;
        padding: 22px 18px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      }
      .pd-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .pd-close-btn {
        background: none;
        border: none;
        color: #8A8783;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
      }
      .pd-admin-box {
        background: #161718;
        border: 1px solid #2A2B2D;
        border-radius: 12px;
        padding: 12px;
        margin-top: 14px;
        font-size: 11px;
        line-height: 1.5;
        color: #B8B6B1;
      }
      .pd-admin-box b {
        color: #F0EEE9;
      }
      .pd-admin-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: #B4FF39;
        text-transform: uppercase;
        margin-bottom: 4px;
        display: block;
      }
      .pd-success-banner {
        background: rgba(180, 255, 57, 0.12);
        border: 1px solid #B4FF39;
        color: #B4FF39;
        font-size: 11px;
        padding: 10px;
        border-radius: 9px;
        margin-top: 10px;
        display: none;
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);
  }

  function createAuthGateUI() {
    injectAuthStyles();

    const container = document.createElement('div');
    container.id = 'pavedirt-auth-gate-container';
    container.innerHTML = `
      <div class="pd-auth-card">
        <div class="pd-brand-header">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <path d="M2 18 L11 18" stroke="#F0EEE9" stroke-width="2.5" stroke-linecap="round"></path>
            <path d="M11 18 L14 14 L17 19 L20 12 L24 18" stroke="#C1502E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
          </svg>
          <div class="pd-brand-title">PAVE<span>DIRT</span></div>
        </div>

        <div class="pd-auth-title" id="pd-card-heading">Registro Inicial</div>
        <div class="pd-auth-subtitle" id="pd-card-subheading">Crea tu usuario y contraseña para ingresar al ciclocomputador.</div>

        <div class="pd-tab-row">
          <button type="button" class="pd-tab-btn active" id="pd-tab-signup">Crear cuenta</button>
          <button type="button" class="pd-tab-btn" id="pd-tab-login">Iniciar sesión</button>
        </div>

        <form id="pd-auth-form" autocomplete="on">
          <label class="pd-label" for="pd-username">Usuario o Correo</label>
          <input class="pd-input" type="text" id="pd-username" placeholder="ej. ciclista_cuenca o tu@correo.com" required autocomplete="username" />

          <label class="pd-label" for="pd-password">Contraseña (mínimo 6 caracteres)</label>
          <input class="pd-input" type="password" id="pd-password" placeholder="••••••••" required autocomplete="current-password" />

          <div id="pd-confirm-box">
            <label class="pd-label" for="pd-confirm-password">Confirmar contraseña</label>
            <input class="pd-input" type="password" id="pd-confirm-password" placeholder="••••••••" autocomplete="new-password" />
          </div>

          <div class="pd-error-msg" id="pd-error-text"></div>

          <button type="submit" class="pd-submit-btn" id="pd-submit-text">Crear cuenta</button>

          <button type="button" class="pd-forgot-btn" id="pd-forgot-link">¿Olvidaste tu usuario o contraseña?</button>
        </form>
      </div>

      <!-- Modal de Recuperación con Administración -->
      <div class="pd-modal-overlay" id="pd-recovery-modal" style="display:none;">
        <div class="pd-modal-card">
          <div class="pd-modal-header">
            <div class="pd-auth-title" style="text-align:left; font-size:16px;">Recuperar credenciales</div>
            <button type="button" class="pd-close-btn" id="pd-close-modal">&times;</button>
          </div>
          <div class="pd-auth-subtitle" style="text-align:left; margin-bottom:12px;">
            Envía una solicitud al administrador para restablecer tu cuenta, o comunícate directamente con el taller.
          </div>

          <form id="pd-recovery-form">
            <label class="pd-label" for="pd-rec-user">Usuario o Correo a recuperar</label>
            <input class="pd-input" type="text" id="pd-rec-user" placeholder="Tu usuario o correo registrado" required />

            <label class="pd-label" for="pd-rec-contact">Medio de contacto (Teléfono / WhatsApp o Correo)</label>
            <input class="pd-input" type="text" id="pd-rec-contact" placeholder="ej. +593 99 999 9999 o correo" required />

            <label class="pd-label" for="pd-rec-note">Mensaje o detalle (opcional)</label>
            <input class="pd-input" type="text" id="pd-rec-note" placeholder="ej. Olvidé la contraseña de mi cuenta" />

            <div class="pd-success-banner" id="pd-rec-success">
              ✓ Solicitud registrada con éxito en el sistema. El administrador revisará tu cuenta.
            </div>

            <button type="submit" class="pd-submit-btn" style="margin-top:14px; background:#C1502E; color:#F0EEE9;" id="pd-rec-btn">
              Enviar solicitud a administración
            </button>
          </form>

          <div class="pd-admin-box">
            <span class="pd-admin-badge">Contacto directo de administración</span>
            <div><b>Taller:</b> Bike Shop Manubermeo Repair & Parts</div>
            <div><b>Administrador:</b> Manuel Bermeo</div>
            <div><b>Correo:</b> manuel@manubermeo.com</div>
            <div><b>Ubicaciones:</b> Cuenca (Riberas del Tarqui) / Cariamanga (Loja)</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Estado del formulario
    let mode = 'signup'; // 'signup' o 'login'

    const tabSignup = document.getElementById('pd-tab-signup');
    const tabLogin = document.getElementById('pd-tab-login');
    const confirmBox = document.getElementById('pd-confirm-box');
    const confirmInput = document.getElementById('pd-confirm-password');
    const heading = document.getElementById('pd-card-heading');
    const subheading = document.getElementById('pd-card-subheading');
    const submitBtn = document.getElementById('pd-submit-text');
    const errorText = document.getElementById('pd-error-text');
    const form = document.getElementById('pd-auth-form');

    const forgotLink = document.getElementById('pd-forgot-link');
    const recoveryModal = document.getElementById('pd-recovery-modal');
    const closeModal = document.getElementById('pd-close-modal');
    const recoveryForm = document.getElementById('pd-recovery-form');
    const recSuccess = document.getElementById('pd-rec-success');

    function showError(msg) {
      errorText.textContent = msg;
      errorText.style.display = 'block';
    }

    function clearError() {
      errorText.textContent = '';
      errorText.style.display = 'none';
    }

    tabSignup.addEventListener('click', () => {
      mode = 'signup';
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      confirmBox.style.display = 'block';
      confirmInput.setAttribute('required', 'required');
      heading.textContent = 'Registro Inicial';
      subheading.textContent = 'Crea tu usuario y contraseña para ingresar al ciclocomputador.';
      submitBtn.textContent = 'Crear cuenta';
      clearError();
    });

    tabLogin.addEventListener('click', () => {
      mode = 'login';
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      confirmBox.style.display = 'none';
      confirmInput.removeAttribute('required');
      heading.textContent = 'Iniciar Sesión';
      subheading.textContent = 'Ingresa tus credenciales para acceder a tus rutas y bici.';
      submitBtn.textContent = 'Iniciar sesión';
      clearError();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const username = document.getElementById('pd-username').value.trim();
      const password = document.getElementById('pd-password').value;
      const confirmPass = confirmInput.value;

      if (!username || username.length < 3) {
        showError('Ingresa un usuario o correo de al menos 3 caracteres.');
        return;
      }
      if (!password || password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      const users = getLocalJSON(USERS_KEY, []);
      const normalizedUser = username.toLowerCase();

      if (mode === 'signup') {
        if (password !== confirmPass) {
          showError('Las contraseñas no coinciden.');
          return;
        }

        const existing = users.find((u) => u.username.toLowerCase() === normalizedUser);
        if (existing) {
          showError('Este usuario ya existe. Cambia a "Iniciar sesión".');
          return;
        }

        // Registrar usuario
        const newUser = {
          id: normalizedUser,
          username: username,
          password: password,
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        setLocalJSON(USERS_KEY, users);

        // Guardar sesión persistente
        const session = { id: newUser.id, email: newUser.username };
        saveActiveSession(session);

        // Finalizar y dar paso a la app
        completeAuth(session);
      } else {
        // Iniciar sesión
        const found = users.find(
          (u) => u.username.toLowerCase() === normalizedUser && u.password === password
        );

        if (!found) {
          // Si no existe localmente, permitir login si es la primera cuenta o verificar si coincide
          showError('Usuario o contraseña incorrectos.');
          return;
        }

        const session = { id: found.id, email: found.username };
        saveActiveSession(session);
        completeAuth(session);
      }
    });

    // Abrir modal de recuperación
    forgotLink.addEventListener('click', () => {
      recoveryModal.style.display = 'flex';
      recSuccess.style.display = 'none';
    });

    // Cerrar modal
    closeModal.addEventListener('click', () => {
      recoveryModal.style.display = 'none';
    });

    recoveryModal.addEventListener('click', (e) => {
      if (e.target === recoveryModal) {
        recoveryModal.style.display = 'none';
      }
    });

    // Enviar solicitud de recuperación
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const recUser = document.getElementById('pd-rec-user').value.trim();
      const recContact = document.getElementById('pd-rec-contact').value.trim();
      const recNote = document.getElementById('pd-rec-note').value.trim();

      const requests = getLocalJSON(REQUESTS_KEY, []);
      const newReq = {
        id: Date.now(),
        username: recUser,
        contact: recContact,
        notes: recNote,
        date: new Date().toLocaleString('es-ES'),
        status: 'pendiente_revision',
      };
      requests.push(newReq);
      setLocalJSON(REQUESTS_KEY, requests);

      recSuccess.style.display = 'block';
      recoveryForm.reset();
    });

    function completeAuth(session) {
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.25s ease';
      setTimeout(() => {
        container.remove();
        // Recargar suavemente para que app.bundle.js tome la sesión activa sin pedir login
        window.location.reload();
      }, 250);
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAuthGateUI);
  } else {
    createAuthGateUI();
  }
})();
