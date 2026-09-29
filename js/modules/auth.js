/**
 * @file auth.js
 * @description Módulo de autenticación y control de sesión administrativa.
 * Credenciales por defecto: admin / papelito123
 */

const STORAGE_KEY = 'nexus_hotel_auth_session';

// Credenciales administrativas del sistema
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'papelito123',
  role: 'Administrador General',
  token: 'NEXUS-TOKEN-SECURE-9921'
};

/**
 * Verifica si existe una sesión activa válida.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const session = sessionStorage.getItem(STORAGE_KEY);
  if (!session) return false;

  try {
    const parsed = JSON.parse(session);
    return parsed && parsed.username === ADMIN_CREDENTIALS.username;
  } catch (e) {
    console.error('Error al verificar sesión:', e);
    return false;
  }
}

/**
 * Obtiene los datos del usuario autenticado.
 * @returns {Object|null}
 */
export function getCurrentUser() {
  if (!isAuthenticated()) return null;
  return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
}

/**
 * Valida credenciales e inicia sesión.
 * Cumple con requisito de función con parámetros y retorno.
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Object} Resultado de la operación { success: boolean, message: string, user?: Object }
 */
export function login(username, password) {
  // Validación de datos vacíos (Resiliencia)
  const cleanUser = String(username || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return {
      success: false,
      message: 'Por favor complete todos los campos de acceso.'
    };
  }

  // Verificación estricta de credenciales
  if (cleanUser === ADMIN_CREDENTIALS.username && cleanPass === ADMIN_CREDENTIALS.password) {
    const userData = {
      username: ADMIN_CREDENTIALS.username,
      role: ADMIN_CREDENTIALS.role,
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return {
      success: true,
      message: 'Acceso autorizado al sistema Nexus.',
      user: userData
    };
  } else {
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos. Verifique sus credenciales.'
    };
  }
}

/**
 * Cierra la sesión activa actual.
 */
export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
}
