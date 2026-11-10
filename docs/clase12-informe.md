# Informe de estado: TaskFlow

**Fecha:** 10/11/2026. **Recomendación: no liberar.** Un no miembro puede modificar fechas de tareas ajenas; además, las fechas pueden desplazarse o aceptar días inexistentes. Los defectos requieren corrección y repetición de pruebas.

## Estado y criterios de salida

| Verificación | Resultado medido | Categoría y evidencia |
| --- | --- | --- |
| Build servidor y cliente | Verde local | `npm run build` y `npm run build:client` terminaron correctamente. |
| Lint | Rojo | Calidad: `comments.service.ts:7` y `:26` contienen `any`; `:16` variable sin usar. |
| Jest/integración/contrato | Rojo | Producto: 57 pasan y 8 fallan; entre ellos fecha incorrecta, acceso ajeno y fecha imposible. También fallan cuatro tests previos de registro/proyectos. |
| Cobertura | 79,23 % líneas y 52,78 % ramas | Debajo del gate final de 80 % de líneas; supera 40 % de ramas. La cobertura es ejecución, no prueba de corrección. |
| E2E local | No ejecutado | Entorno: `Schema engine error` de Prisma al iniciar la base con la configuración normal. El job publica traces y reporte si existen. |
| GitHub Actions | [Corrida de b7ea2d6](https://github.com/Rodrigo568/taskflow_2026_s2/actions/runs/42904564119): builds verdes; lint, tests y cobertura rojos; E2E en curso al registrar | Lint falla en «Analizar el código»; tests en «Correr los tests»; cobertura en «Medir cobertura y exigir el umbral». Las causas detalladas se contrastaron localmente arriba. Los jobs son independientes e informativos. |

## Métricas y riesgos

1. **Tests fallidos: 8 de 65**: hay defectos reproducibles que impiden recomendar una liberación.
2. **Cobertura de líneas: 79,23 %** frente al gate de 80 %: indica dónde investigar cobertura faltante, sin justificar tests vacíos.
3. **Riesgo de acceso: CA-8 falla**: un usuario autenticado fuera del proyecto recibe 200 al modificar una fecha.

Se descarta la cantidad de tests aislada como indicador de calidad: sin resultados y trazabilidad no informa qué riesgo queda cubierto. No hay datos suficientes para calcular defectos escapados, flakiness o métricas DORA.

El 10/11/2026 la consulta pública de GitHub mostró un issue abierto de performance (#1, listado sin paginar), sin severidad asignada. Además hay defectos reproducidos en los tests y en `docs/seguridad-accesibilidad.md`; no se asume que todos tengan issue. No se inventaron conteos por severidad. Los detalles, prompts y matriz están en `docs/clase12-trazabilidad-ia.md`.
