# Auditoría del original

Base: ebc9af3e55effe1097674672f16ef0b1ae677f7f. Se ha leído el código completo: README e index.html; index-5.html es idéntico y se conserva intacto. La rama backup/pre-v3-ebc9af3 conserva el estado original.

## Hallazgos

- Dos bloques CSS contradictorios: el tema claro anulaba al oscuro; navegación de escritorio oculta en un cajón.
- Registro de ejecuciones sin efecto sobre cantidades, coste medio ni resultados.
- Ediciones destructivas de setups y reglas; historial solo de mensajes, sin valores anteriores.
- Importación de informes duplicaba registros y no validaba correctamente todo el contenido.
- Restaurar una copia reemplazaba el registro sin copia previa.
- Estadísticas y riesgo eran textos estáticos, incluso al disponer de datos.
- Dashboard con cantidades y decisiones codificadas, ajenas a los cambios de usuario.
- loadMarket solicitaba data/market.json cada minuto, pero ni el archivo ni el workflow existían.
- Gráficos TradingView: muchos iframes simultáneos, sin superposición de niveles propios.
- Algunos enlaces de fuentes admitían esquemas arbitrarios; ahora solo se enlazan noticias HTTPS.
- Radar y tablas demasiado anchas en móvil; sustituidas por tarjetas y filas adaptables.
- LocalStorage sin sincronización PC/Android; esta limitación continúa y es explícita.

## Datos y conservación

El original público contiene una posición CRML, una orden pendiente, cinco valores de radar, un setup CEG, un registro histórico y tres reglas propuestas. No hay noticias ni series de mercado. No se han inventado ejecuciones, velas, indicadores ni rendimientos. Se conserva la clave v1, se crea respaldo antes de migrar y se preserva cada colección y campos adicionales. Las ejecuciones heredadas se marcan no aplicadas, porque el original no ajustaba la posición y no permite deducir si el usuario ya la corrigió a mano.

La nueva clave es swing-command-center-v3. Un archivo corrupto no se sobrescribe. No se publican datos recuperados de conversaciones sobre operaciones adicionales. Los tickers de seguimiento recuperados no son señales activas. CRML conserva el coste original y una nota de discrepancia; no se elige silenciosamente entre referencias distintas.

## Verificación

Se observó la página publicada en navegador de escritorio. La comprobación de la versión nueva se realiza mediante pruebas de lógica y DOM, no captura visual de navegador. En este entorno no está disponible control-browser para previsualización local. Android, instalación PWA y carga real del iframe quedan pendientes de comprobación visual; no se consideran aprobados.
