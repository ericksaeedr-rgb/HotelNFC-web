/**
 * @file nfc.js
 * @description Módulo de gestión y simulación de tarjetas y lectores NFC (Escenario B: UID existente).
 */

/**
 * Valida el formato del UID de la tarjeta NFC.
 * Admite formatos hexadecimales típicos de 4 o 7 bytes separados por : o -
 * Ejemplos: A3:4F:9C:12 o 04:A1:B2:C3:D4:E5:F6
 * @param {string} uid - Código UID a evaluar
 * @returns {boolean} True si es válido
 */
export function isValidNFCUID(uid) {
  if (!uid || typeof uid !== 'string') return false;
  const clean = uid.trim().toUpperCase();
  // Regex para 4 a 7 octetos hexadecimales separados por ':' o '-'
  const regex = /^([0-9A-F]{2}[:\-]){3,6}([0-9A-F]{2})$/;
  return regex.test(clean);
}

/**
 * Normaliza el UID al formato estándar (ej: XX:XX:XX:XX)
 * @param {string} uid
 * @returns {string}
 */
export function normalizeUID(uid) {
  if (!uid) return '';
  return uid.trim().toUpperCase().replace(/-/g, ':');
}

/**
 * Genera un UID hexadecimal simulado aleatorio (4 bytes estándar Mifare Classic / Ultralight).
 * @returns {string} UID generado ej: "D4:9E:21:A8"
 */
export function generateRandomUID() {
  const bytes = [];
  for (let i = 0; i < 4; i++) {
    const byte = Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
    bytes.push(byte);
  }
  return bytes.join(':');
}

/**
 * Simula la lectura asíncrona de una tarjeta NFC acercada al sensor Arduino.
 * Devuelve una Promesa con el UID detectado.
 * @param {number} delayMs - Tiempo de espera simulado
 * @returns {Promise<string>}
 */
export function simulateScanFromReader(delayMs = 1200) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const generated = generateRandomUID();
      resolve(generated);
    }, delayMs);
  });
}

/**
 * Valida el acceso de una tarjeta a una habitación determinada.
 * Compara el UID presentado con el UID asignado a la habitación.
 * @param {string} scannedUID - UID escaneado
 * @param {Object} room - Objeto de la habitación
 * @returns {Object} Resultado con autorización y detalles
 */
export function verifyDoorAccess(scannedUID, room) {
  if (!scannedUID) {
    return {
      granted: false,
      reason: 'No se detectó ninguna señal de tarjeta NFC.'
    };
  }

  if (!room) {
    return {
      granted: false,
      reason: 'Habitación no encontrada en la base de datos.'
    };
  }

  const normalizedScanned = normalizeUID(scannedUID);
  const roomCard = normalizeUID(room.tarjetaNFC || '');

  // Lógica de decisión con if/else para la apertura
  if (room.estado !== 'ocupada') {
    return {
      granted: false,
      reason: `La habitación ${room.numero} está marcada como "${room.estado.toUpperCase()}" y no tiene huéspedes asignados.`
    };
  }

  if (roomCard && roomCard === normalizedScanned) {
    return {
      granted: true,
      reason: `Acceso autorizado. Llave NFC válida para Habitación ${room.numero}. Huésped: ${room.huesped}.`
    };
  } else {
    return {
      granted: false,
      reason: `Acceso denegado. La tarjeta [${normalizedScanned}] no corresponde a la Habitación ${room.numero}.`
    };
  }
}
