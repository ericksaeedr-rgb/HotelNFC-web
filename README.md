# Nexus Hotel NFC - Sistema de Acceso Inteligente para Hoteles
Proyecto de programación web.

¿De qué trata el proyecto?

Nexus Hotel NFC es un sistema web administrativo para hoteles que permite controlar las habitaciones, huéspedes y tarjetas NFC desde una computadora o celular. Las habitaciones pueden estar disponibles, ocupadas o en limpieza. El sistema permite realizar check-in, check-out, asignar tarjetas NFC y controlar el acceso a las habitaciones.

¿Qué lenguajes y tecnologías utiliza?

Utiliza HTML para la estructura de la página, CSS para el diseño, JavaScript para la lógica y las funciones, XML para almacenar la información de las habitaciones y Python con Flask para crear el servidor y preparar la conexión futura con Arduino.

¿Cómo funciona el sistema?

El ciclo de una habitación es: Disponible → Check-in y asignación de NFC → Ocupada → Check-out → En limpieza → Disponible. Cada cambio actualiza la información de la habitación y queda registrado en la auditoría.

¿Cómo funciona el acceso NFC?

El sistema compara el código de la tarjeta NFC con el código asignado a la habitación. Si coinciden y la habitación está ocupada, el acceso es autorizado. Si no coinciden o la habitación no está ocupada, el acceso es rechazado.

¿Qué módulos de JavaScript utiliza?

main.js coordina el sistema, auth.js controla el inicio de sesión, rooms.js administra las habitaciones, nfc.js controla las tarjetas NFC y logger.js registra las actividades.

¿Cómo se registra la información?

El sistema utiliza localStorage para guardar los datos y la auditoría, y sessionStorage para mantener la sesión del usuario mientras utiliza el sistema.

¿Cuáles son las credenciales?

Usuario: admin
Contraseña: papelito123

¿Cómo se ejecuta el proyecto?

Primero se instala Flask con pip install flask. Después se ejecuta python app.py desde la carpeta del proyecto y finalmente se abre http://localhost:5000 en el navegador.

¿Cuál es el objetivo principal?

Crear un sistema de administración hotelera que permita controlar habitaciones y accesos mediante tecnología NFC, con un simulador de cerradura, registro de auditoría y una futura integración con Arduino.
