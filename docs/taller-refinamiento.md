# Taller de refinamiento de TaskFlow

Equipo 12 · Clase 2 · Épica C, organización del trabajo. Las historias se basan en US-14 a US-16 de la [especificación](../taskflow_especificacion_requerimientos.docx). Los criterios describen el comportamiento esperado.

| Historia | Valor para el equipo | Estimación de la spec | Límite y verificación INVEST |
| --- | --- | ---: | --- |
| US-14 Asignar una tarea | Aclara quién se hace cargo | 3 puntos | Se entrega con la gestión existente de miembros. El selector es negociable. Se verifica con la respuesta y la lectura posterior. |
| US-15 Etiquetar tareas | Permite categorizar y encontrar trabajo | 2 puntos | Cubre etiquetas de una tarea. La interfaz puede cambiar. Se verifica la normalización y la cantidad persistida. |
| US-16 Fijar vencimiento | Permite ordenar el trabajo por urgencia | 3 puntos | Se limita a un día opcional. La presentación visual puede acordarse. Se verifica por HTTP y en el tablero. |

Las tres historias comparten el acceso al proyecto y se pueden implementar y verificar por separado.

## US-14 Asignación

Como miembro del proyecto, quiero asignar o reasignar tareas a integrantes, para repartir responsabilidades.

1. Asignar a un miembro devuelve 200 y guarda su identificador.
2. Asignar a alguien ajeno al proyecto devuelve 400 y conserva la asignación.
3. Enviar `assigneeId: null` deja la tarea sin asignar.
4. La asignación conserva el estado de la tarea y puede realizarla cualquier miembro.

```gherkin
Escenario: Asignar una tarea a un miembro del proyecto
  Dado que soy miembro del proyecto y la tarea está pendiente y sin asignar
  Y Bob es miembro del mismo proyecto
  Cuando asigno la tarea a Bob
  Entonces la API devuelve 200 y el identificador de Bob
  Y la tarea sigue pendiente
```

## US-15 Etiquetas

Como miembro del proyecto, quiero etiquetar mis tareas, para categorizarlas y encontrarlas.

1. El nombre se guarda sin espacios al inicio o al final y en minúsculas.
2. Volver a añadir una etiqueta equivalente devuelve 200 y conserva una sola instancia.
3. Se admiten nombres de 1 a 30 caracteres.
4. Añadir una undécima etiqueta devuelve 400.

```gherkin
Escenario: Agregar una etiqueta equivalente
  Dado que una tarea tiene la etiqueta "bug"
  Cuando un miembro agrega " BUG " a la misma tarea
  Entonces la API devuelve 200
  Y la tarea conserva exactamente una etiqueta "bug"
```

## US-16 Vencimiento

Como miembro del proyecto, quiero fijar o quitar el vencimiento, para distinguir las tareas urgentes.

1. El vencimiento es un día calendario `YYYY-MM-DD` sin conversión de zona horaria.
2. El vencimiento es opcional y se puede quitar con `null`.
3. Un formato inválido devuelve 400.
4. Se admite una fecha pasada y se considera vencida la tarea. Solo los miembros pueden editar la fecha.

```gherkin
Escenario: Mantener el día cargado
  Dado que soy miembro del proyecto y mi cliente está en UTC-3
  Cuando asigno el vencimiento "2026-09-15" y consulto la tarea
  Entonces el vencimiento devuelto es "2026-09-15"
```

Las decisiones de interfaz y la forma de señalar visualmente una tarea vencida quedan para validar con el Product Owner. La evidencia de implementación está en [la matriz de US-16](clase12-trazabilidad-ia.md) y [el informe de estado](clase12-informe.md).
