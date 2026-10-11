# Fase 1: revisión verificable del despliegue

Fecha: 11 octubre 2026. Estado: BLOQUEADA por autenticación de Cloudflare y falta de credenciales/licencia de datos activada. No se ha retirado GitHub Pages ni reservado una URL. No confundir código probado con producción verificada.

## Evidencia de acceso

El navegador llegó a Cloudflare /login. El usuario eligió GitHub y después passkey mediante el formulario seguro. GitHub indicó soporte parcial de passkeys; la verificación posterior de Cloudflare volvió a /login. No se ha llegado al flujo de importación del repositorio: no hay evidencia para atribuir el bucle previo a permisos GitHub, cookies ni configuración de Cloudflare. La conexión GitHub de ChatGPT no autentica automáticamente el navegador en Cloudflare.

## Comparación de proveedores

Precios USD publicados; impuestos, elegibilidad y condiciones de contratación pendientes de comprobar en la cuenta. Ninguno garantiza que cada ticker negocie dentro de 15 minutos: suspensiones y falta de actividad conservan timestamps antiguos.

| Proveedor | Evaluación |
| --- | --- |
| Finnhub | Publicita API gratuita de cotizaciones US en tiempo real; términos solo personales y sin redistribución sin permiso escrito. No se pudo extraer la tabla oficial de cuotas/precios ni acreditar velas gratuitas actuales. Adaptador existente conservado; requiere prueba de permisos de la cuenta y de los diez tickers. No prometer paquete completo gratis. |
| Twelve Data | Basic: 8 créditos/min, 800/día, uso no-display. Grow ofrece display interno y sin límite diario, desde 29 USD/mes según soporte oficial; selector de pricing muestra también escalones más caros (79 USD). Feed US estándar aproximadamente 5% del volumen, no consolidado completo. Cotizaciones y OHLCV en una misma API: opción provisional económica para esta implementación, sujeta a contratar el escalón y probar cobertura. |
| Massive/Polygon | Gratis EOD, 5 peticiones/min. Starter 29 USD/mes y Developer 79 USD/mes: retraso 15 minutos; con polling5min no cumplen antigüedad <=15min. Advanced199 USD/mes real-time, mercado US completo, individual no-profesional. |
| Alpaca | Basic gratis: IEX, 200 consultas históricas/min, hasta30 símbolos WS; no tape consolidado. Algo Trader Plus99 USD/mes: todas las bolsas US, 10.000 consultas/min. Alternativa consolidada más barata verificada en esta comparación, no adaptada todavía. |
| Financial Modeling Prep | Basic250/día y EOD. Starter19 USD/mes equivalente anual (29 mensual mostrado) con cotizaciones; Premium49 USD equivalente anual (69 mensual mostrado) añade gráficos intradía. Uso individual; cobertura y derechos del endpoint exacto requieren prueba de cuenta. No elegido sobre Twelve para esta implementación. |
| Tradier | Feed consolidado real-time para titulares de cuenta de bróker; sandbox15min. Exige cuenta de bróker y no se conectará dentro de este trabajo. |

Fuentes oficiales:
- https://finnhub.io/terms-of-service
- https://finnhub.io/pricing
- https://twelvedata.com/pricing
- https://support.twelvedata.com/en/articles/5335783-trial
- https://support.twelvedata.com/en/articles/9935903-us-equities-market-data
- https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- https://massive.com/pricing?product=stocks
- https://docs.alpaca.markets/us/docs/about-market-data-api
- https://docs.alpaca.markets/us/docs/market-data-faq
- https://site.financialmodelingprep.com/pricing-plans
- https://docs.tradier.com/docs/market-data

## Cambios preparados

- Build limpio y lista explícita de archivos: no copia todos los JSON de data ni todos los documentos a producción. No contiene el nombre personal en el bundle comprobado.
- Estado privado /data/status.json: intentos, éxito, fallos, edad por ticker, últimas24 ejecuciones. Fallar no renueva la fecha del último precio válido.
- Reintento limitado para fallos5xx/transporte; no se insiste tras429. Free Twelve no hace reintentos que excedan su presupuesto.
- Grow confirmado mediante TWELVE_PAID_DISPLAY=true:10 cotizaciones y10 series diarias cada5min durante horario aproximado de NY. API key solo en Worker Secret. No está activado.
- Finnhub: diez quotes cada5min; las velas siguen necesitando Twelve. Twelve Basic: grupos de5 cada5min (cada ticker10min), solo para pruebas autorizadas; no se recomienda activarlo para display de producción.
- Carga del navegador cada60s. Recalcula indicadores al recibir velas diarias válidas; 1H/4H siguen siendo widget externo, NO feed local implementado.
- Cron usa horario NY pero aún no calendario oficial de festivos/medias sesiones. Fuera de sesión conserva timestamps. KV es eventualmente consistente: se añade propagación a la antigüedad.
- Menos de252 sesiones no se presentan como rango completo52semanas. Quotes inválidas/futuras/regresivas se rechazan.

Coste hosting previsto: Free Workers/KV para uso personal moderado, sujeto a cuotas. Con Grow: unas80 capturas/día, ~240 escrituras KV/día (quotes,status,history), más estado fuera de sesión; inferior a1000 escrituras/día. No hay cargos activados. Docs: https://developers.cloudflare.com/kv/platform/pricing/ y https://developers.cloudflare.com/workers/configuration/cloudflare-access/

## Pruebas y pendientes

Pruebas unitarias/UI con datos de test son exclusivamente pruebas y no evidencia de proveedor real. Validación automatizada de persistencia/importación/historial conservada. Build comprobado sin nombre personal y sin snapshots privados. Ninguna credencial introducida ni publicada.

NO VERIFICADO: nueva URL y disponibilidad de nombres; configuración KV/Access; dos ejecuciones reales separadas5min; edad observada de mercado; nuevas velas reales; sesión ordinaria (hoy domingo); funcionamiento físico Android. No se declara superada ninguna de estas pruebas.

Antes de retirar Pages: exportar JSON desde cada navegador que tenga registros útiles; guardar copia; importar en nuevo origen; cotejar posiciones/órdenes/ejecuciones y recargar. Los datos de Chrome Android no están disponibles en el navegador remoto y no se trasladan automáticamente entre dominios. La retirada queda bloqueada hasta esa comprobación.

El repositorio y su historial públicos siguen identificando al propietario. Una URL neutral no da anonimato completo; una posterior transferencia a organización neutral o repositorio privado requiere decisión separada y no elimina copias ya indexadas.
