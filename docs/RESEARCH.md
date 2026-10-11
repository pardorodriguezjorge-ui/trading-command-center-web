# Captura pública y terminal — 11 octubre 2026

## Datos y límites

Ocho valores: CRML, CEG, IREN, NTNX, NU, GPN, ALM y LW. Cada uno tiene 50 sesiones OHLCV reales, hasta el 9 de octubre de 2026, recuperadas de las tablas públicas de Stock Analysis (atribuidas allí a S&P Global). Las URL, fechas, fuentes de rangos anuales y notas de discrepancia están en data/research.json y su módulo equivalente research.js.

No hay API activa, conexión al bróker ni sincronización automática con ChatGPT. La captura envejece: el panel lo advierte. Actualizar la página no descarga precios nuevos. La actualización requiere investigar de nuevo las fuentes públicas y publicar ambos archivos coherentes. La automatización opcional anterior sigue desactivada. Un extractor programado de páginas públicas necesita mantenimiento y puede fallar por bloqueos o cambios de formato; no se presenta como un feed garantizado.

Los precios de la captura solo enriquecen la visualización. No sobrescriben las posiciones ni el registro guardado en el navegador. Un precio manual con fecha posterior tiene prioridad. Las órdenes pendientes siguen separadas de las ejecuciones.

## Cálculos

SMA20/50 sobre cierres; RSI14 de Wilder; MACD12/26/9 con inicialización SMA y calentamiento limitado a 50 sesiones; volumen relativo frente a las 20 sesiones anteriores. Los mínimos de sesión, 20 sesiones y 52 semanas son conceptos distintos. Los soportes/resistencias son zonas interpretadas a partir de extremos y agrupaciones visibles en la serie, no campos objetivos entregados por Yahoo ni órdenes de compra. Pivotes clásicos calculados sobre la última sesión para la siguiente.

No se calcula VWAP intradía con OHLCV diario. Los intervalos 1H/4H pertenecen al widget externo TradingView y no alimentan las métricas locales. Los paneles RSI/MACD no sincronizan el desplazamiento con el gráfico principal.

## Noticias

Ocho noticias iniciales entre el 5 y el 8 de octubre, con enlaces y consecuencias operativas separadas del hecho. El filtro predeterminado muestra solo fechas dentro de los últimos siete días y excluye fechas futuras. Archivo permite consultar noticias anteriores. No se ha encontrado anuncio corporativo reciente verificable de ALM en esa ventana. Alegaciones de terceros y opiniones de analistas conservan sus etiquetas; un precio objetivo externo no se convierte en TP del sistema.

## Calidad

Se excluye el máximo anual de NTNX por discrepancia entre fuentes. Se evita mezclar una tabla Yahoo almacenada de CEG con cierres incompatibles de otras fechas. Cada serie diaria utiliza una misma fuente. Los registros locales y el histórico de setups permanecen intactos.

## Verificación

26 pruebas automatizadas: contabilidad, persistencia, importación, historial, navegación, validación OHLCV, cálculo de indicadores, fechas de noticias y prioridad de precios. Gráficos locales con Lightweight Charts 4.2.3 (Apache 2.0), licencia y aviso en vendor; atribución visible a TradingView. CSS adaptable a móvil; no sustituye una prueba física en Android.
