"""
Nexus Hotel NFC - Servidor Flask
Sirve el frontend estático y expone endpoints API para la futura integración
con el módulo Arduino NFC (pyserial).

Ejecución: python app.py
"""

from flask import Flask, send_from_directory, jsonify, request
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='.', static_url_path='')

# ==========================================================================
# RUTAS ESTÁTICAS - Servir el frontend
# ==========================================================================

@app.route('/')
def index():
    """Sirve la página principal."""
    return send_from_directory('.', 'index.html')


@app.route('/css/<path:filename>')
def serve_css(filename):
    """Sirve archivos CSS."""
    return send_from_directory('css', filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    """Sirve archivos JavaScript."""
    return send_from_directory('js', filename)


@app.route('/data/<path:filename>')
def serve_data(filename):
    """Sirve archivos de datos (XML)."""
    return send_from_directory('data', filename)


# ==========================================================================
# API REST - Endpoints para integración futura con Arduino NFC
# ==========================================================================

@app.route('/api/status', methods=['GET'])
def api_status():
    """Endpoint de estado del sistema. Verifica que el servidor está activo."""
    return jsonify({
        'sistema': 'Nexus Hotel NFC OS',
        'version': '2.4',
        'estado': 'online',
        'timestamp': datetime.now().isoformat(),
        'arduino_conectado': False,  # Se actualizará cuando se integre pyserial
        'mensaje': 'Servidor Flask activo. Arduino pendiente de conexión.'
    })


@app.route('/api/nfc/scan', methods=['POST'])
def api_nfc_scan():
    """
    Endpoint placeholder para recibir datos del lector NFC Arduino.
    Cuando se integre pyserial, este endpoint leerá directamente del puerto serial.
    Por ahora, acepta un JSON con el UID simulado.
    """
    data = request.get_json(silent=True)
    if not data or 'uid' not in data:
        return jsonify({
            'success': False,
            'error': 'No se recibió UID de tarjeta. Envíe {"uid": "XX:XX:XX:XX"}.'
        }), 400

    uid = data['uid'].strip().upper()
    return jsonify({
        'success': True,
        'uid': uid,
        'fuente': 'simulacion',  # Cambiará a 'arduino' en producción
        'timestamp': datetime.now().isoformat(),
        'mensaje': f'UID {uid} recibido correctamente.'
    })


@app.route('/api/nfc/write', methods=['POST'])
def api_nfc_write():
    """
    Endpoint placeholder para escribir datos en tarjeta NFC vía Arduino.
    Preparado para futura integración con pyserial.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            'success': False,
            'error': 'No se recibieron datos para escribir en la tarjeta.'
        }), 400

    return jsonify({
        'success': True,
        'modo': 'simulacion',
        'mensaje': 'Escritura en tarjeta NFC simulada. Integre pyserial para operación real.',
        'datos_enviados': data,
        'timestamp': datetime.now().isoformat()
    })


# ==========================================================================
# INICIO DEL SERVIDOR
# ==========================================================================

if __name__ == '__main__':
    port = 5000
    print("=" * 60)
    print("  NEXUS HOTEL NFC · Servidor de Desarrollo")
    print("=" * 60)
    print(f"  URL Local:    http://localhost:{port}")
    print(f"  URL Red:      http://0.0.0.0:{port}")
    print(f"  Estado:       ACTIVO")
    print(f"  Arduino NFC:  Pendiente de integración")
    print("=" * 60)
    print()

    app.run(host='0.0.0.0', port=port, debug=True)
