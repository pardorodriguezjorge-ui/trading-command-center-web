# Migración a URL genérica + cotizaciones de 5–10 minutos

## Estado (11 octubre 2026)

- **Ya integrado en el dashboard:** ticker oficial de TradingView, cuyo proveedor actualiza los precios. Los precios de acciones pueden estar retrasados según bolsa. El componente no entrega sus datos al motor local, que conserva la fecha de sus velas.
- **Preparado, NO desplegado:** Cloudflare Worker + almacenamiento KV + Cloudflare Access con verificación criptográfica de JWT. El código está en `worker/private-market.js` y el despliegue en `wrangler.jsonc`.
- **El feed NO está activo**: falta una cuenta de Cloudflare, un KV, protección con Cloudflare Access y credenciales de proveedor de datos aptas para **uso personal con visualización**. No asumir que una clave gratuita autoriza mostrar sus precios en una página accesible al público.
- **La antigua web GitHub Pages aún conserva su URL con el usuario de GitHub**. Para eliminarla de la experiencia pública, hay que migrar, comprobar la copia de datos locales y **desactivar Pages del repositorio antiguo**. No se puede borrar retrospectivamente lo almacenado por buscadores o archivos de Internet.

## Nombre completamente genérico sin cambiar la cuenta GitHub

Cloudflare Workers ofrece una URL `https://swing-market-console.<subdominio-generico>.workers.dev`, donde el subdominio lo elige el titular al crear su cuenta Cloudflare. El nombre usado como ejemplo **no está reservado**. Otra opción es comprar un dominio neutral.

El usuario GitHub propietario sigue apareciendo en la URL de su repositorio y eventualmente en los commits públicos; para eliminarlo también de esa superficie habría que transferir el código publicado a una organización de nombre genérico y revisar autoría/historial. No se puede garantizar el borrado de copias ya indexadas.

La aplicación no enlaza a ningún perfil personal. No se insertan secretos ni tokens en código público.

## Flujo previsto y presupuesto gratuito

`wrangler.jsonc` programa un intento cada cinco minutos durante el horario ampliado UTC; el Worker comprueba horario ordinario de Nueva York (considerando horario de verano). Si `QUOTE_PROVIDER=finnhub`, consulta **los diez símbolos cada cinco minutos** (aprox. 780 llamadas en 6,5 horas). Si `QUOTE_PROVIDER=twelvedata`, alterna dos grupos de cinco: **cada ticker se consulta cada diez minutos** (aprox. 390 llamadas en 6,5 horas). La web consulta el snapshot cada minuto mientras está abierta.

Cloudflare Workers KV almacena la última respuesta válida. La antigüedad objetivo de 5–10 minutos se refiere a la frecuencia de peticiones; la antigüedad efectiva de la cotización depende de la fuente (y puede ser mayor). En el nivel gratuito, KV contempla 1.000 escrituras y 100.000 lecturas diarias, suficiente en principio para uso individual moderado. La tasa efectiva depende de ejecuciones, proveedor y límites vigentes.

**Sin garantía de antigüedad menor de 15 minutos:** la fuente puede retrasar cotizaciones y los workflows pueden fallar. La API retiene el timestamp de cada símbolo y nunca presenta un dato viejo con timestamp nuevo.

Opciones de proveedor:
- Finnhub: adaptador para endpoint personal `/quote`; verificar disponibilidad, condiciones y alcance del feed de cada símbolo antes de activar.
- Twelve Data: adaptadores para `/quote` y `/time_series`. Su plan Basic gratuito incluye créditos, pero **no debe asumirse que permite un dashboard con visualización interna**; Grow o permisos específicos podrían ser necesarios.
- TradingView: widgets oficiales para visualización pública, sin extracción de sus cotizaciones por API.

No hay conexión automática con el bróker. El mercado premarket/after-hours exige comprobar cobertura específica del proveedor; no está garantizado por la solución gratuita.

## Lo que tendrá que hacer el propietario para desplegar

1. Crear una cuenta gratuita en **https://dash.cloudflare.com/**. Elegir un subdominio de cuenta que no contenga datos personales.
2. En Cloudflare Workers & Pages, conectar GitHub y seleccionar el repositorio del dashboard.
3. Ajustar la orden de construcción a `npm run build` y de despliegue a `npx wrangler deploy` (el archivo `wrangler.jsonc` está incluido).
4. Crear una namespace **Workers KV** y asociarla al Worker como binding `MARKET_KV`, manteniendo el identificador fuera del código cliente. De ser necesario, actualizar `wrangler.jsonc` con el ID mediante una modificación del repositorio.
5. Configurar **Cloudflare Zero Trust → Access** para proteger el Worker, especialmente su API de mercado; permitir únicamente tu identidad. Configurar como variables **`ACCESS_TEAM_DOMAIN`** y **`ACCESS_AUD`** según tu aplicación de Access. El Worker **verifica el JWT firmado**, y devuelve 403 si no existe o es inválido.
6. Una vez confirmado que el proveedor autoriza uso personal con visualización, guardar la clave en **Worker Secrets**, nunca en GitHub. `QUOTE_PROVIDER=finnhub` con secret `FINNHUB_API_KEY`, o `QUOTE_PROVIDER=twelvedata` con `TWELVE_DATA_API_KEY`.
7. Después de verificar Access y la licencia, configurar `ENABLE_PERSONAL_FEED=true` como variable Worker. Hasta ese momento las tareas programadas no hacen consultas.
8. Comprobar en **Datos y ajustes** dos actualizaciones sucesivas, timestamps por valor, e indicadores recalculados. Exportar la copia local del sitio anterior y restaurarla en el nuevo origen, verificando posiciones y órdenes.
9. Solo entonces **desactivar GitHub Pages de la web anterior**, ya que su URL incluye el nombre personal. La nueva URL no debe contener ese nombre.

No publicar ni enviar claves API ni contraseñas en este chat.

## Referencias

- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/kv/platform/pricing/
- https://twelvedata.com/pricing
- https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- https://www.tradingview.com/widget-docs/faq/data/
