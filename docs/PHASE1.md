# Fase 1 — Integridad de mercado y preparación del feed

Actualización del 11 de octubre de 2026. **Código incorporado; proveedor de datos todavía sin activar.**

## Fuentes y actualización efectiva

| Dato | Al abrir la web | Cuando exista feed autorizado |
| --- | --- | --- |
| Posiciones, órdenes, operaciones | localStorage del navegador | Igual; sin sincronización PC/Android |
| Velas diarias (8 acciones) | Captura manual fechada hasta el 9 oct 2026 | `data/history.json`, hasta 520 sesiones por acción, tras cierre estadounidense |
| Cotizaciones | Cierre de la última vela disponible | `data/market.json`, captura horaria; puede estar retrasada |
| Soporte/resistencia | Zonas históricas interpretadas | Extremos mecánicos de 20 y 50 sesiones (NO soporte técnico validado) |
| SMA/RSI/MACD/volumen | Calculados en navegador desde la serie cargada | Recalculados al cargar historia más reciente |
| Noticias/catalizadores | Investigación manual del 5 al 8 oct 2026 | Fase 2; **no** se actualizan ahora |
| Macro | Sin feed | Pendiente de fase posterior |
| Informes horarios ChatGPT | Importación JSON manual | Fase 3; no hay puente automático |

La web comprueba ambos archivos cada 10 minutos mientras permanece abierta y al volver a la pestaña. Sin archivos nuevos no hay cambios de precios. Muestra fecha, procedencia y antigüedad por ticker en **Datos y ajustes**. Los widgets intradía 1H/4H son de TradingView y no actualizan la serie diaria local.

## Fuente y derechos

**No publicar en GitHub Pages datos descargados automáticamente de Yahoo Finance usando yfinance sin permiso de redistribución.** La antigua automatización del repositorio privado `trading-command-center.` no alimenta el nuevo repositorio público.

El sistema incluye adaptadores para una suscripción a Twelve Data. **Solo deben activarse con un plan que autorice expresamente mostrar/redistribuir las cotizaciones e históricos en esta web pública.** La existencia de una clave API no acredita esos derechos. Ninguna clave se distribuye al navegador.

Configuración en Settings → Secrets and variables → Actions:

- Secret: `TWELVE_DATA_API_KEY`
- Variable `ENABLE_MARKET_SYNC=true`
- Variable `MARKET_DATA_PUBLICATION_APPROVED=true` **solo cuando se hayan confirmado derechos de publicación**

Se pueden probar los adaptadores de forma privada sin publicar sus resultados. El workflow público está deliberadamente desactivado hasta completar la autorización.

## Automatización prevista (no activada)

- `.github/workflows/market.yml`: cotizaciones a los minutos 17 de las 13–22 UTC, de lunes a viernes; historial a las 23:43 UTC de lunes a viernes, más ejecución manual.
- `scripts/update-market.mjs`: 8 acciones y SPY/QQQ, respuestas validadas, conserva la fecha antigua si falla algún símbolo.
- `scripts/update-history.mjs`: 50–520 sesiones OHLCV por cada una de las 8 acciones; una respuesta inválida nunca reemplaza el histórico anterior.
- GitHub Actions puede retrasar cron y el proveedor puede imponer límites, costes o restricciones de acceso. No es feed de ejecución de órdenes.

## Seguridad y validación

- No introducir secretos en archivos `src/`, `data/` ni en campos de la web.
- No se conecta al bróker ni se ejecutan órdenes.
- Los precios manuales con fecha posterior a un snapshot conservan prioridad.
- Antes de operar, revisar fecha real de la cotización y la sesión de las velas; el indicador «captura» no significa «en directo».
- CI: `npm ci && npm run check && npm test`.

## Cambio a URL genérica

Cambiar únicamente el nombre del repositorio no elimina el usuario de la URL por defecto `<usuario>.github.io/<repositorio>/`.

Opciones compatibles:
1. **Dominio propio** (de pago): configurar el dominio verificado y DNS en GitHub Pages sin cambiar el usuario de GitHub.
2. **Subdominio genérico de Vercel/Cloudflare Pages** (normalmente gratuito): conectar el repositorio público al proveedor; requiere autorización del titular. Los nombres disponibles dependen del servicio.
3. Nueva organización GitHub con nombre genérico y traslado del repositorio: más cambios de permisos y mayor riesgo de romper rutas.

No se cambia automáticamente el alojamiento sin autorizar y verificar el dominio.
