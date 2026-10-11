# Swing Trading Command Center

Centro local de decisiones para swing trading, modular, con build estático opcional. Compatible con GitHub Pages bajo subdirectorio.

- Panel, posiciones, órdenes y ejecuciones con coste ponderado y comisiones.
- Radar, filtros, setups y playbook versionados.
- Registro real separado del hipotético; exportación JSON/CSV.
- Migración no destructiva de v1 y recuperación ante errores.
- Terminal con velas diarias reales por valor (captura de 50 sesiones; ampliable a 520 con feed autorizado), SMA, RSI, MACD y volumen.
- Noticias verificadas con ventana de siete días, niveles interpretados y fuentes fechadas.
- TradingView externo para intradía y adaptador de cotizaciones + OHLCV automático **preparado, pero desactivado** hasta verificar derechos de publicación del proveedor.
- Auditoría de procedencia, fecha y antigüedad de cada cotización; actualización del navegador cada diez minutos cuando el feed esté activo.

`npm ci && npm run check && npm test` · `npm run build` crea la carpeta `dist/` (solo recursos públicos) preparada para un host con nombre genérico.

Para publicar sin el usuario de GitHub en la URL, el repositorio incluye `vercel.json`. **La URL genérica no está activada**: falta conectar el alojamiento y confirmar el nombre libre.

[Auditoría](docs/AUDIT.md) · [Operación y límites](docs/OPERATIONS.md) · [Fase 1: fuentes, estado real y URL genérica](docs/PHASE1.md)

Los datos iniciales son históricos. No existe conexión con el bróker ni con ChatGPT. La captura pública se revisó el 11 de octubre de 2026 y termina en la sesión del 9 de octubre. No se actualiza automáticamente hasta que se configure un proveedor con derechos adecuados para redistribuir los datos. Consulta [fuentes y método](docs/RESEARCH.md).
