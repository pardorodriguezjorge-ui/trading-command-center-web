# Swing Trading Command Center

Centro local de decisiones para swing trading, modular, sin build de producción. Compatible con GitHub Pages bajo subdirectorio.

- Panel, posiciones, órdenes y ejecuciones con coste ponderado y comisiones.
- Radar, filtros, setups y playbook versionados.
- Registro real separado del hipotético; exportación JSON/CSV.
- Migración no destructiva de v1 y recuperación ante errores.
- Terminal con 50 velas diarias reales por valor, SMA, RSI, MACD y volumen.
- Noticias verificadas con ventana de siete días, niveles interpretados y fuentes fechadas.
- TradingView externo para intradía y snapshot horario opcional, desactivado.

`npm ci && npm test && npm run check`

[Auditoría](docs/AUDIT.md) · [Operación y límites](docs/OPERATIONS.md)

Los datos iniciales son históricos. No existe conexión con el bróker ni con ChatGPT. La captura pública se revisó el 11 de octubre de 2026 y termina en la sesión del 9 de octubre. No se actualiza automáticamente. Consulta [fuentes y método](docs/RESEARCH.md).
