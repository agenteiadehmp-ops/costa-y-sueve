# Calendarios Costa y Sueve · 25/11/2026

## Estado real
Primera fase: lectura de bloqueos externos en las ocho fichas publicadas y panel `/calendario.html`. No hay fuentes configuradas todavía. No es un channel manager ni transmite cierres a los portales. No hay reservas automáticas, agenda editable persistente ni lectura de correo activadas.

## Configuración pendiente
En Vercel, configurar la variable de entorno privada `CALENDAR_SOURCES_JSON` como objeto con claves `lu1`, `lu2`, `col1`, `col2`, `col3`, `ca2`, `cst3`, `apt1`. Cada valor es una lista de URLs HTTPS de exportación iCal de Airbnb, Booking y Vrbo de esa vivienda. No guardar los enlaces privados en Git. Activar el entorno actualizado mediante un despliegue.

Ejemplo de estructura sin credenciales: `{"lu1":[],"lu2":[],"col1":[],"col2":[],"col3":[],"ca2":[],"cst3":[],"apt1":[]}`.

Solicitar los enlaces desde la cuenta de gestión; verificar correspondencia vivienda/anuncio. No solicitar contraseñas por chat. Se admiten hosts oficiales de Airbnb, Booking, Vrbo y HomeAway; si otro host oficial es necesario, revisarlo antes de autorizarlo.

Los calendarios de fechas completas usan salida exclusiva: una salida el día 6 permite entrar el 6. Se rechazan recurrencias y eventos con horas hasta disponer de soporte probado. Una fuente fallida marca el estado incompleto y conserva los bloqueos leídos de otras fuentes. Nunca se anuncia disponibilidad confirmada. La consulta no tiene caché local; la publicación del portal puede llevar retraso.

## Siguientes fases necesarias
1. Conectar y comprobar cada fuente contra las reservas reales, incluidas cancelaciones y cambios.
2. Añadir base de datos, acceso privado del gestor, bloqueos manuales con control atómico de solapamientos y registro de cambios.
3. Resolver conectividad oficial para enviar cierres y recibir reservas, con reintentos y avisos de fallos. iCal por sí solo no elimina el riesgo de reservas simultáneas.
4. Solo después, habilitar confirmación y cobro en la web. Mantener solicitudes con confirmación personal mientras tanto.

## Validación
`node --test tests/availability.test.js` y `node --check house-calendar.js`.

## Calendario de precios y mínimos
El panel incorpora precios por noche y mínimos por temporada para las ocho viviendas. Configuración privada `CALENDAR_RATES_JSON`, con las mismas claves de vivienda. Cada regla contiene `start` (incluido), `end` (excluido), `nightlyCents` (entero en céntimos de euro) y `minNights` (entero). No se permiten temporadas solapadas ni importes cero. No hay tarifas cargadas; no se extrapolan acuerdos de comisión ni precios de limpieza a precios del alojamiento.

Esta fase muestra las reglas configuradas en el panel. Sigue pendiente el editor privado persistente, cálculo de presupuestos con suplementos e impuestos definidos y aplicación de mínimos en solicitudes de las fichas. No publica precios o restricciones en los portales.
