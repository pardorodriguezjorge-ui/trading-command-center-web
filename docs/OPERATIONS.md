# Operación y arquitectura

## Módulos

- src/core.js: migración, validación, ejecuciones, versiones, importación y estadísticas puras.
- src/app.js: vistas, formularios y persistencia transaccional por copia.
- src/seed.js: los datos históricos que ya contenía el repositorio; no son datos actuales.
- src/style.css: interfaz oscura y responsive.
- sw.js / manifest.webmanifest: base PWA y caché de la aplicación. Los iframes de mercado requieren internet.
- tests: cálculos, migración y navegación DOM.

## Seguridad y privacidad

GitHub Pages y este repositorio son públicos. El original ya incluía un saldo de posición: la rama de respaldo y el historial Git también lo contienen. Eliminarlo del archivo actual no lo borra del historial. Esta entrega no publica nuevas operaciones privadas ni claves; las modificaciones del usuario permanecen en localStorage. Para privacidad real del sistema completo, trasladar a un backend con autenticación y revisar expresamente la exposición histórica del repositorio.

No guardar claves en formularios, JSON públicos ni JavaScript. TWELVE_DATA_API_KEY va exclusivamente en GitHub Secrets. Las copias exportadas contienen información privada: no subirlas al repositorio.

## Conservar y restaurar

La primera migración guarda la copia v1. Exportar antes de actualizar y entre dispositivos. Restaurar valida antes de reemplazar y conserva swing-command-center-v3-before-restore. Importar CSV añade registros históricos; no modifica posiciones ni crea rendimientos reales. La app no ejecuta órdenes en un bróker.

Una ejecución de compra añade comisiones al coste. Una venta mantiene el coste medio del remanente y resta comisión al resultado realizado. Riesgo desde coste = max(0, media-stop) × cantidad. Riesgo desde mercado = max(0, precio-stop) × cantidad. No representa una garantía de pérdida máxima ante gaps. El capital de referencia se introduce manualmente y no se estima a partir de posiciones incompletas.

Las estadísticas actuales son por venta (cada parcial por separado), no por trade completo. El drawdown es sobre P/L realizado acumulado, no sobre NAV. El resultado hipotético del journal no entra en cálculos. La comparación SPY/QQQ requiere series ajustadas y fechas coincidentes; no está implementada.

## Informes ChatGPT

No existe conexión automática entre una tarea de ChatGPT y este repositorio. La vía operativa es exportar un JSON e importarlo en Datos y ajustes. Debe contener reportId único, timestamp ISO y news/radar/setups opcionales. IDs estables actualizan entidades conservando versiones; se deduplican noticias por URL o titular/fecha. Los informes nunca crean ni ejecutan órdenes. No publicar informes privados en Pages.

Para sincronización desatendida real: backend autenticado con endpoint de informes, base de datos, versionado y un emisor autorizado. Una alternativa sencilla es un Worker con base SQLite/D1 y autenticación; requiere configurar cuentas, permisos y acceso. La app está separada de la lógica para sustituir la capa local sin rehacer vistas. No se promete tarifa gratuita ni sincronización que no exista.

## Mercado horario opcional

Se incluye un adaptador Twelve Data: cotizaciones a HH:17 entre las 13:00 y las 22:00 UTC, y velas diarias a las 23:43 UTC, de lunes a viernes. Ambos están desactivados hasta verificar licencia de redistribución. Más detalle en [Fase 1](PHASE1.md). Está deshabilitado hasta configurar:

1. Un plan del proveedor que permita los símbolos y la redistribución pública requerida; revisar costes y licencia.
2. Secret TWELVE_DATA_API_KEY.
3. Variables ENABLE_MARKET_SYNC=true y MARKET_DATA_PUBLICATION_APPROVED=true.
4. GitHub Pages con origen GitHub Actions si se usa el despliegue del workflow.
5. Ejecutar workflow_dispatch y verificar logs y data/market.json publicado.

El script de cotizaciones exige al menos cinco respuestas recientes válidas; conserva los precios previos y sus fechas para símbolos fallidos, y registra errores genéricos. El script de velas exige series diarias válidas antes de sustituir su archivo. Nunca imprime la clave. Solo publica cotizaciones de mercado, nunca posiciones. La fecha de captura no equivale a fecha de cotización: ambas se conservan. La interfaz muestra el snapshot por separado para no sustituir silenciosamente precios manuales. Esta integración NO ha sido probada con una clave real ni está activada.

GitHub Actions puede retrasar u omitir tareas por carga; un cron horario no garantiza puntualidad. En repositorios públicos puede desactivarse tras 60 días sin actividad. No es adecuado para stops, alertas críticas o ejecución.

## Publicación y reversión

Esta entrega se prepara en rama y pull request; main no cambia hasta la confirmación del propietario. Mantener los datos existentes del navegador y abrir la nueva versión en el mismo origen conserva la migración. Otra URL tiene otro almacenamiento.

Para revertir, usar la rama backup/pre-v3-ebc9af3. Los datos v3 permanecen en una clave separada y la versión original sigue leyendo v1. No eliminar las copias hasta comprobar ambos dispositivos.

## Pendientes de aceptación

- QA visual en Android y escritorio de la versión nueva, y prueba de instalación PWA.
- Gráfico nativo con series OHLC licenciadas, indicadores calculados y niveles dibujados. La integración actual es TradingView externo.
- Benchmark SPY/QQQ y métricas por operación completa, NAV diario y flujos.
- Sincronización autenticada entre dispositivos y conexión de reportes horarios.
- Activación y comprobación con API real del snapshot opcional.
- Recuperación completa de archivos históricos no presentes en el repositorio.

## Fuentes técnicas

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://twelvedata.com/docs
