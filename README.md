# Swing Trading Command Center

Centro local de decisiones para swing trading, modular, sin build de producción. Compatible con GitHub Pages bajo subdirectorio.

- Panel, posiciones, órdenes y ejecuciones con coste ponderado y comisiones.
- Radar, filtros, setups y playbook versionados.
- Registro real separado del hipotético; exportación JSON/CSV.
- Migración no destructiva de v1 y recuperación ante errores.
- TradingView externo y snapshot horario opcional, desactivado.

`npm ci && npm test && npm run check`

[Auditoría](docs/AUDIT.md) · [Operación y límites](docs/OPERATIONS.md)

Los datos iniciales son históricos. No existe conexión con el bróker ni con ChatGPT. El desarrollo está preparado para revisión; consulta los pendientes de aceptación antes de desplegar.
