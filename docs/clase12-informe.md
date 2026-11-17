# Informe de estado: TaskFlow

**Revisión:** 17/11/2026. **Recomendación: no liberar.** Un no miembro puede modificar fechas de tareas ajenas. Las fechas también pueden desplazarse o aceptar días inexistentes. Los defectos requieren corrección y repetición de pruebas.

## Estado y criterios de salida

| Verificación | Resultado medido | Categoría y evidencia |
| --- | --- | --- |
| Build servidor y cliente | Verde local | `npm run build` y `npm run build:client` terminaron correctamente. |
| Lint | Verde local | `npm run lint` pasa tras tipar el servicio de comentarios. |
| Jest/integración/contrato | Rojo | 66 pasan y 8 fallan por los defectos ya reportados de fechas, autorización, registro y proyectos. |
| Cobertura | 86 % líneas y 60,94 % ramas | Supera el umbral 80/40. El comando de Jest continúa devolviendo error por los 8 asserts fallidos. |
| E2E local | 25 casos en 38,6 s. 20 éxitos y 5 fallos esperados | Chromium, un worker, UTC-3. Los cinco casos con `test.fail()` cubren desplazamiento de fechas y etiquetas. Playwright contabiliza esos resultados como aprobados. Se usó una SQLite temporal inicializada con la migración SQL y los servidores locales. |
| GitHub Actions | [Corrida histórica de b7ea2d6](https://github.com/Rodrigo568/taskflow_2026_s2/actions/runs/42904564119) | Builds y E2E verdes. Lint, tests y cobertura rojos en esa revisión. Las filas anteriores recogen las mediciones locales actuales. |

## Métricas y riesgos

1. **Tests fallidos: 8 de 74.** Hay defectos reproducibles que impiden recomendar una liberación.
2. **Cobertura de líneas: 86 %.** Supera el 80 % exigido y orienta la revisión de ramas y rutas restantes.
3. **E2E con fallos esperados: 5 de 25.** El estado verde de la suite incluye defectos conocidos que siguen visibles en los tickets.

Se descarta la cantidad de tests aislada como indicador de calidad: sin resultados y trazabilidad no informa qué riesgo queda cubierto. No hay datos suficientes para calcular defectos escapados, flakiness o métricas DORA.

El issue de [performance #1](https://github.com/Rodrigo568/taskflow_2026_s2/issues/1) tiene severidad media. El [índice de reportes](issues/README.md) reúne los demás tickets. La [matriz de US-16](clase12-trazabilidad-ia.md) conserva la comparación de cobertura del ejercicio de IA.

La [captura de Actions](evidencia/clase12-actions.png) muestra la corrida real y sus anotaciones. Se trabajó directamente en `main` según la indicación previa, por lo que no hay una corrida de pull request ni revisión humana registrada.
