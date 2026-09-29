/**
 * @file main.js
 * @description Controlador principal de la aplicación web Nexus Hotel NFC.
 * Integra los módulos ES6: auth, rooms, nfc y logger.
 */

import * as auth from './modules/auth.js';
import * as rooms from './modules/rooms.js';
import * as nfc from './modules/nfc.js';
import * as logger from './modules/logger.js';

// ==========================================================================
// ESTADO GLOBAL DE LA INTERFAZ
// ==========================================================================
let currentFilter = 'all';
let currentSearch = '';
let selectedRoomForModal = null;

// ==========================================================================
// ELEMENTOS DEL DOM
// ==========================================================================
const DOM = {
  // Vistas
  loginView: document.getElementById('login-view'),
  appView: document.getElementById('app-view'),
  
  // Login
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  
  // Header y Navegación
  liveClock: document.getElementById('live-clock'),
  userNameDisplay: document.getElementById('current-user-name'),
  btnLogout: document.getElementById('btn-logout'),
  navTabs: document.querySelectorAll('.nav-tab-btn'),
  appSections: document.querySelectorAll('.app-section'),

  // Métricas
  metricTotal: document.getElementById('metric-total'),
  metricAvailable: document.getElementById('metric-available'),
  metricOccupied: document.getElementById('metric-occupied'),
  metricCleaning: document.getElementById('metric-cleaning'),

  // Filtros y Búsqueda
  filterButtons: document.querySelectorAll('.filter-btn'),
  searchInput: document.getElementById('search-rooms'),
  roomsGrid: document.getElementById('rooms-grid'),
  btnReloadXML: document.getElementById('btn-reload-xml'),

  // Terminal NFC / Puerta
  doorRoomSelect: document.getElementById('door-room-select'),
  doorUidInput: document.getElementById('door-uid-input'),
  btnDoorTestCard: document.getElementById('btn-door-test-card'),
  btnDoorInvalidCard: document.getElementById('btn-door-invalid-card'),
  btnDoorScan: document.getElementById('btn-door-scan'),
  doorStatusBox: document.getElementById('door-status-box'),
  doorStatusTitle: document.getElementById('door-status-title'),
  doorStatusDesc: document.getElementById('door-status-desc'),

  // Terminal NFC / Recepción
  receptionScannerBox: document.getElementById('reception-scanner-box'),
  receptionScannedUID: document.getElementById('reception-scanned-uid'),

  // Auditoría
  auditLogFilter: document.getElementById('audit-log-filter'),
  auditTableBody: document.getElementById('audit-table-body'),
  btnResetLogs: document.getElementById('btn-reset-logs'),

  // Modales
  checkinModal: document.getElementById('checkin-modal'),
  checkinForm: document.getElementById('checkin-form'),
  checkinRoomNumber: document.getElementById('checkin-room-number'),
  checkinRoomType: document.getElementById('checkin-room-type'),
  checkinGuestName: document.getElementById('checkin-guest-name'),
  checkinGuestDoc: document.getElementById('checkin-guest-doc'),
  checkinNights: document.getElementById('checkin-nights'),
  checkinCardUID: document.getElementById('checkin-card-uid'),
  btnScanCheckinCard: document.getElementById('btn-scan-checkin-card'),
  checkinErrorAlert: document.getElementById('checkin-error-alert'),

  checkoutModal: document.getElementById('checkout-modal'),
  checkoutRoomNum: document.getElementById('checkout-room-num'),
  checkoutGuestName: document.getElementById('checkout-guest-name'),
  checkoutCardUID: document.getElementById('checkout-card-uid'),
  btnConfirmCheckout: document.getElementById('btn-confirm-checkout'),

  cleaningModal: document.getElementById('cleaning-modal'),
  cleaningRoomNum: document.getElementById('cleaning-room-num'),
  btnConfirmCleaning: document.getElementById('btn-confirm-cleaning'),

  modalCloseButtons: document.querySelectorAll('.modal-close-btn, .btn-close-modal'),

  // Notificaciones Toast
  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initLiveClock();
  setupEventListeners();

  // Verificar estado de sesión previo
  if (auth.isAuthenticated()) {
    showAppView();
    await loadInitialData();
  } else {
    showLoginView();
  }
});

/**
 * Carga inicial asíncrona de datos desde XML
 */
async function loadInitialData() {
  showToast('Cargando Datos', 'Sincronizando habitaciones desde XML...', 'info');
  await rooms.loadRoomsFromXML();
  renderDashboard();
  renderDoorRoomOptions();
  renderAuditLogs();
}

/**
 * Inicializa el reloj digital en tiempo real en la barra de navegación
 */
function initLiveClock() {
  const updateClock = () => {
    const now = new Date();
    if (DOM.liveClock) {
      DOM.liveClock.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// ==========================================================================
// GESTIÓN DE VISTAS (LOGIN / APP SHELL)
// ==========================================================================
function showLoginView() {
  DOM.loginView.style.display = 'flex';
  DOM.appView.style.display = 'none';
  if (DOM.loginUsername) DOM.loginUsername.value = '';
  if (DOM.loginPassword) DOM.loginPassword.value = '';
  hideLoginError();
}

function showAppView() {
  const user = auth.getCurrentUser();
  if (DOM.userNameDisplay && user) {
    DOM.userNameDisplay.textContent = user.username;
  }
  DOM.loginView.style.display = 'none';
  DOM.appView.style.display = 'flex';
}

function showLoginError(msg) {
  if (DOM.loginError) {
    DOM.loginError.style.display = 'flex';
    DOM.loginError.querySelector('.error-text').textContent = msg;
  }
}

function hideLoginError() {
  if (DOM.loginError) {
    DOM.loginError.style.display = 'none';
  }
}

// ==========================================================================
// RENDERIZADO DEL DASHBOARD Y HABITACIONES
// ==========================================================================
function renderDashboard() {
  updateMetrics();
  renderRoomsGrid();
}

/**
 * Actualiza las tarjetas numéricas de estado
 */
function updateMetrics() {
  const metrics = rooms.getRoomMetrics();
  DOM.metricTotal.textContent = metrics.total;
  DOM.metricAvailable.textContent = metrics.disponibles;
  DOM.metricOccupied.textContent = metrics.ocupadas;
  DOM.metricCleaning.textContent = metrics.enLimpieza;
}

/**
 * Genera dinámicamente las tarjetas de habitaciones en el DOM
 */
function renderRoomsGrid() {
  const filtered = rooms.filterRooms(currentFilter, currentSearch);
  DOM.roomsGrid.innerHTML = '';

  if (filtered.length === 0) {
    DOM.roomsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <p style="color: var(--text-muted); font-size: 1.1rem;">No se encontraron habitaciones para el criterio seleccionado.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(room => {
    const card = document.createElement('article');
    card.className = `room-card ${room.estado}`;

    // Configuración según el estado
    let badgeText = 'Disponible';
    let actionBtnHTML = '';

    if (room.estado === 'disponible') {
      badgeText = 'Disponible';
      actionBtnHTML = `
        <button class="btn-action assign" data-room="${room.numero}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
          Asignar NFC (Check-in)
        </button>
      `;
    } else if (room.estado === 'ocupada') {
      badgeText = 'Ocupada';
      actionBtnHTML = `
        <button class="btn-action checkout" data-room="${room.numero}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/></svg>
          Detalle / Check-out
        </button>
      `;
    } else if (room.estado === 'en-limpieza') {
      badgeText = 'En Limpieza';
      actionBtnHTML = `
        <button class="btn-action clean-done" data-room="${room.numero}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          Finalizar Limpieza
        </button>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="room-card-header">
          <div class="room-number-wrap">
            <span class="room-floor">Piso ${room.piso}</span>
            <span class="room-number">${room.numero}</span>
          </div>
          <span class="room-badge ${room.estado}">
            <span style="width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
            ${badgeText}
          </span>
        </div>

        <div class="room-card-body">
          <h4 class="room-type">${room.tipo}</h4>
          <p class="room-features">${room.caracteristicas}</p>

          <div class="room-meta-row">
            <div class="room-price">
              <strong>$${room.precio.toFixed(2)}</strong> / noche
            </div>
            <div class="room-nfc-tag">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 10a8 8 0 0 1 16 0M7 10a5 5 0 0 1 10 0M10 10a2 2 0 0 1 4 0"/></svg>
              ${room.tarjetaNFC ? room.tarjetaNFC : 'Sin tarjeta'}
            </div>
          </div>

          ${room.huesped ? `
            <div class="room-guest-info">
              <span>Huésped: <strong>${room.huesped}</strong></span>
              <span class="mono" style="font-size:0.75rem;">Hasta: ${room.fechaSalida || 'Hoy'}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="room-card-actions">
        ${actionBtnHTML}
      </div>
    `;

    // Asignar manejadores de acción
    const btn = card.querySelector('.btn-action');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleRoomAction(room.numero, room.estado);
      });
    }

    // Al hacer clic en la tarjeta misma
    card.addEventListener('click', () => {
      handleRoomCardClick(room);
    });

    DOM.roomsGrid.appendChild(card);
  });
}

/**
 * Maneja el clic directo sobre una tarjeta de habitación según su estado
 */
function handleRoomCardClick(room) {
  if (room.estado === 'disponible') {
    openCheckinModal(room.numero);
  } else if (room.estado === 'ocupada') {
    showToast('Habitación Ocupada', `La Habitación ${room.numero} está actualmente asignada a ${room.huesped}. Tarjeta activa: [${room.tarjetaNFC}].`, 'warning');
    openCheckoutModal(room.numero);
  } else if (room.estado === 'en-limpieza') {
    showToast('En Limpieza', `La Habitación ${room.numero} se encuentra en mantenimiento y desinfección.`, 'warning');
    openCleaningModal(room.numero);
  }
}

/**
 * Ejecuta la acción del botón de la tarjeta
 */
function handleRoomAction(roomNumber, estado) {
  if (estado === 'disponible') {
    openCheckinModal(roomNumber);
  } else if (estado === 'ocupada') {
    openCheckoutModal(roomNumber);
  } else if (estado === 'en-limpieza') {
    openCleaningModal(roomNumber);
  }
}

// ==========================================================================
// TERMINAL NFC Y SIMULADOR DE ACCESO A PUERTA
// ==========================================================================
function renderDoorRoomOptions() {
  const roomsList = rooms.getAllRooms();
  DOM.doorRoomSelect.innerHTML = '';

  roomsList.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.numero;
    opt.textContent = `Habitación ${r.numero} - ${r.tipo} (${r.estado.toUpperCase()})`;
    DOM.doorRoomSelect.appendChild(opt);
  });
}

/**
 * Simula el escaneo de una tarjeta en la cerradura inteligente de la habitación seleccionada
 */
function testDoorScan() {
  const roomNumber = DOM.doorRoomSelect.value;
  const uid = DOM.doorUidInput.value.trim();
  const room = rooms.getRoomByNumber(roomNumber);

  if (!uid) {
    showToast('Lector NFC', 'Por favor ingrese o escanee un UID de tarjeta para probar el acceso.', 'warning');
    return;
  }

  const result = nfc.verifyDoorAccess(uid, room);

  // Actualizar indicador visual de la cerradura
  DOM.doorStatusBox.className = `door-status-display ${result.granted ? 'granted' : 'denied'}`;

  if (result.granted) {
    DOM.doorStatusTitle.textContent = `ACCESO AUTORIZADO - HABITACIÓN ${room.numero}`;
    DOM.doorStatusDesc.textContent = `Cerradura desbloqueada por 5 segundos. Huésped: ${room.huesped}.`;
    showToast('Cerradura Abierta', result.reason, 'success');

    // Registrar en auditoría
    logger.addLogEntry(
      room.numero,
      uid,
      room.huesped,
      'access-granted',
      `Apertura concedida a ${room.huesped}`,
      'autorizado'
    );
  } else {
    DOM.doorStatusTitle.textContent = 'ACCESO DENEGADO';
    DOM.doorStatusDesc.textContent = result.reason;
    showToast('Acceso Denegado', result.reason, 'error');

    // Registrar en auditoría
    logger.addLogEntry(
      room ? room.numero : 'N/A',
      uid,
      'Desconocido / No asignado',
      'access-denied',
      result.reason,
      'denegado'
    );
  }

  renderAuditLogs();
}

// ==========================================================================
// REGISTRO DE AUDITORÍA
// ==========================================================================
function renderAuditLogs() {
  const filter = DOM.auditLogFilter.value;
  const logs = logger.getLogs(filter);
  DOM.auditTableBody.innerHTML = '';

  if (logs.length === 0) {
    DOM.auditTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No hay registros de eventos para mostrar.</td>
      </tr>
    `;
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement('tr');

    let badgeClass = 'checkin';
    let badgeText = log.tipoEvento;

    if (log.tipoEvento === 'checkin') {
      badgeClass = 'checkin';
      badgeText = 'Check-in';
    } else if (log.tipoEvento === 'checkout') {
      badgeClass = 'checkout';
      badgeText = 'Check-out';
    } else if (log.tipoEvento === 'access-granted') {
      badgeClass = 'access-granted';
      badgeText = 'Acceso Autorizado';
    } else if (log.tipoEvento === 'access-denied') {
      badgeClass = 'access-denied';
      badgeText = 'Acceso Denegado';
    } else if (log.tipoEvento === 'cleaning') {
      badgeClass = 'cleaning';
      badgeText = 'Limpieza';
    }

    tr.innerHTML = `
      <td class="mono" style="color:var(--text-muted); font-size:0.8rem;">${log.timestamp}</td>
      <td><strong>${log.habitacion}</strong></td>
      <td class="mono" style="color:var(--accent-cyan);">${log.tarjetaNFC}</td>
      <td>${log.huesped}</td>
      <td><span class="event-badge ${badgeClass}">${badgeText}</span></td>
      <td style="color:var(--text-secondary); font-size:0.82rem;">${log.descripcion}</td>
    `;

    DOM.auditTableBody.appendChild(tr);
  });
}

// ==========================================================================
// MODALES (CHECK-IN, CHECK-OUT, LIMPIEZA)
// ==========================================================================
function openCheckinModal(roomNumber) {
  const room = rooms.getRoomByNumber(roomNumber);
  if (!room) return;

  selectedRoomForModal = room;
  DOM.checkinRoomNumber.textContent = room.numero;
  DOM.checkinRoomType.textContent = `${room.tipo} · $${room.precio.toFixed(2)}/noche`;
  DOM.checkinGuestName.value = '';
  DOM.checkinGuestDoc.value = '';
  DOM.checkinCardUID.value = '';
  DOM.checkinErrorAlert.style.display = 'none';

  // Fecha de salida por defecto (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  DOM.checkinNights.value = tomorrow.toISOString().split('T')[0];

  DOM.checkinModal.classList.add('active');
}

function openCheckoutModal(roomNumber) {
  const room = rooms.getRoomByNumber(roomNumber);
  if (!room) return;

  selectedRoomForModal = room;
  DOM.checkoutRoomNum.textContent = room.numero;
  DOM.checkoutGuestName.textContent = room.huesped || 'No registrado';
  DOM.checkoutCardUID.textContent = room.tarjetaNFC || 'N/A';
  DOM.checkoutModal.classList.add('active');
}

function openCleaningModal(roomNumber) {
  const room = rooms.getRoomByNumber(roomNumber);
  if (!room) return;

  selectedRoomForModal = room;
  DOM.cleaningRoomNum.textContent = room.numero;
  DOM.cleaningModal.classList.add('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  selectedRoomForModal = null;
}

// ==========================================================================
// MANEJADORES DE EVENTOS
// ==========================================================================
function setupEventListeners() {
  // 1. Formulario de Inicio de Sesión
  DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = DOM.loginUsername.value;
    const pass = DOM.loginPassword.value;

    const authResult = auth.login(user, pass);
    if (authResult.success) {
      showToast('Bienvenido', `Sesión iniciada como ${authResult.user.username}`, 'success');
      showAppView();
      loadInitialData();
    } else {
      showLoginError(authResult.message);
      showToast('Error de Acceso', authResult.message, 'error');
    }
  });

  // 2. Cerrar Sesión
  DOM.btnLogout.addEventListener('click', () => {
    auth.logout();
    showToast('Sesión Finalizada', 'Ha cerrado sesión correctamente.', 'info');
    showLoginView();
  });

  // 3. Pestañas de Navegación
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.navTabs.forEach(t => t.classList.remove('active'));
      DOM.appSections.forEach(s => s.style.display = 'none');

      tab.classList.add('active');
      const targetSection = document.getElementById(tab.dataset.target);
      if (targetSection) targetSection.style.display = 'block';
    });
  });

  // 4. Filtros de habitaciones
  DOM.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderRoomsGrid();
    });
  });

  // 5. Búsqueda de habitaciones
  DOM.searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderRoomsGrid();
  });

  // 6. Botón recargar desde XML
  DOM.btnReloadXML.addEventListener('click', async () => {
    await rooms.resetCatalogueFromXML();
    showToast('Catálogo Restablecido', 'Habitaciones recargadas desde archivo XML.', 'success');
    renderDashboard();
    renderDoorRoomOptions();
  });

  // 7. Simular lectura NFC en modal de Check-in
  DOM.btnScanCheckinCard.addEventListener('click', async () => {
    DOM.btnScanCheckinCard.disabled = true;
    DOM.btnScanCheckinCard.innerHTML = `
      <svg class="spin" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
      Detectando en Arduino...
    `;

    const scannedUID = await nfc.simulateScanFromReader(900);
    DOM.checkinCardUID.value = scannedUID;
    DOM.btnScanCheckinCard.disabled = false;
    DOM.btnScanCheckinCard.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 10a8 8 0 0 1 16 0M7 10a5 5 0 0 1 10 0M10 10a2 2 0 0 1 4 0"/></svg>
      Escanear en Lector
    `;
    showToast('Tarjeta Detectada', `UID leído con éxito: ${scannedUID}`, 'info');
  });

  // 8. Confirmar Check-in
  DOM.checkinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedRoomForModal) return;

    const guestName = DOM.checkinGuestName.value.trim();
    const guestDoc = DOM.checkinGuestDoc.value.trim();
    const checkoutDate = DOM.checkinNights.value;
    const cardUID = DOM.checkinCardUID.value.trim();

    // Validaciones de formulario (Rúbrica)
    if (!guestName) {
      displayCheckinError('El nombre del huésped es requerido.');
      return;
    }

    if (!cardUID) {
      displayCheckinError('Debe ingresar o escanear una tarjeta NFC.');
      return;
    }

    if (!nfc.isValidNFCUID(cardUID)) {
      displayCheckinError('Formato de UID inválido. Ejemplo válido: A3:4F:9C:12 o 04:A1:B2:C3:D4:E5:F6');
      return;
    }

    const checkinResult = rooms.checkInRoom(
      selectedRoomForModal.numero,
      { huesped: guestName, documento: guestDoc, fechaSalida: checkoutDate },
      nfc.normalizeUID(cardUID)
    );

    if (checkinResult.success) {
      logger.addLogEntry(
        selectedRoomForModal.numero,
        cardUID,
        guestName,
        'checkin',
        `Check-in completado. Llave NFC asignada.`,
        'activo'
      );

      showToast('Check-in Exitoso', checkinResult.message, 'success');
      closeAllModals();
      renderDashboard();
      renderDoorRoomOptions();
      renderAuditLogs();
    } else {
      displayCheckinError(checkinResult.message);
    }
  });

  function displayCheckinError(msg) {
    DOM.checkinErrorAlert.style.display = 'block';
    DOM.checkinErrorAlert.textContent = msg;
  }

  // 9. Confirmar Check-out
  DOM.btnConfirmCheckout.addEventListener('click', () => {
    if (!selectedRoomForModal) return;

    const prevGuest = selectedRoomForModal.huesped;
    const prevCard = selectedRoomForModal.tarjetaNFC;
    const res = rooms.checkOutRoom(selectedRoomForModal.numero);

    if (res.success) {
      logger.addLogEntry(
        selectedRoomForModal.numero,
        prevCard,
        prevGuest,
        'checkout',
        `Check-out realizado. Habitación pasa a limpieza.`,
        'liberado'
      );

      showToast('Check-out Realizado', res.message, 'warning');
      closeAllModals();
      renderDashboard();
      renderDoorRoomOptions();
      renderAuditLogs();
    }
  });

  // 10. Confirmar Limpieza Terminada
  DOM.btnConfirmCleaning.addEventListener('click', () => {
    if (!selectedRoomForModal) return;

    const res = rooms.finishCleaning(selectedRoomForModal.numero);
    if (res.success) {
      logger.addLogEntry(
        selectedRoomForModal.numero,
        'N/A',
        'Personal de Servicio',
        'cleaning',
        `Limpieza y sanitización concluidas. Habitación disponible.`,
        'listo'
      );

      showToast('Habitación Lista', res.message, 'success');
      closeAllModals();
      renderDashboard();
      renderDoorRoomOptions();
      renderAuditLogs();
    }
  });

  // 11. Cerrar modales
  DOM.modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Cerrar modal al hacer clic en el backdrop
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllModals();
    });
  });

  // 12. Simulador de Puerta - Botones de prueba
  DOM.btnDoorTestCard.addEventListener('click', () => {
    const roomNumber = DOM.doorRoomSelect.value;
    const room = rooms.getRoomByNumber(roomNumber);
    if (room && room.tarjetaNFC) {
      DOM.doorUidInput.value = room.tarjetaNFC;
      showToast('Tarjeta Cargada', `Cargado UID del huésped de la habitación ${room.numero}`, 'info');
    } else {
      showToast('Sin Tarjeta', `La Habitación ${roomNumber} no tiene tarjeta asignada actualmente.`, 'warning');
    }
  });

  DOM.btnDoorInvalidCard.addEventListener('click', () => {
    const randomUnauthorized = nfc.generateRandomUID();
    DOM.doorUidInput.value = randomUnauthorized;
    showToast('Tarjeta No Autorizada', `Generado UID aleatorio no registrado: ${randomUnauthorized}`, 'info');
  });

  DOM.btnDoorScan.addEventListener('click', testDoorScan);

  // 13. Terminal de Recepción - Simulador táctil
  DOM.receptionScannerBox.addEventListener('click', async () => {
    DOM.receptionScannedUID.textContent = 'Leyendo tarjeta en lector...';
    const uid = await nfc.simulateScanFromReader(700);
    DOM.receptionScannedUID.textContent = uid;
    showToast('Lector de Recepción', `Tarjeta leída: ${uid}. Puede copiar este UID para asignarlo.`, 'info');
  });

  // 14. Filtro de Auditoría
  DOM.auditLogFilter.addEventListener('change', renderAuditLogs);

  // 15. Reiniciar Auditoría
  DOM.btnResetLogs.addEventListener('click', () => {
    logger.resetLogs();
    showToast('Historial Reiniciado', 'Los logs fueron restablecidos a su estado base.', 'info');
    renderAuditLogs();
  });
}

// ==========================================================================
// SISTEMA DE NOTIFICACIONES TOAST
// ==========================================================================
export function showToast(title, message, type = 'info') {
  if (!DOM.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <h5>${title}</h5>
      <p>${message}</p>
    </div>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}
