# Bitácora de decisiones

Registro de las decisiones técnicas del proyecto: qué opciones evalué, cuál elegí y por qué.

## 001 — Construir una app propia en lugar de seguir con Sheets

- **Fecha:** 2026-10-02
- **Contexto:** Simplificar la manera de anotar y comparar gastos e ingresos de cada mes para tener un mejor control económico.
- **Opciones evaluadas:**
  - Seguir mejorando el Sheets con Apps Script.
  - Usar una app de finanzas que ya exista.
  - Construir una app propia.
- **Decisión:** Construir una app propia, donde mis finanzas queden registradas en una base de datos y sean fáciles de cargar y comparar.
- **Por qué:**
  - El Sheets no permitía loguear a un usuario para que vea solo sus datos: cada persona necesitaba sus propios archivos. Además, no era una app de verdad.
  - Las apps existentes no se adaptan a cómo manejo mi plata, por ejemplo las transferencias entre cuentas propias, que no deben contar como gasto ni ingreso, sino mostrar dónde está el dinero.
  - El motivo principal: quiero que este proyecto sea mi camino para aprender desarrollo full stack.

## 002 — Sistema de migraciones propio

- **Fecha:** 2026-10-05
- **Contexto:** Necesitaba crear las tablas de la app en la base de datos. Si las creaba a mano en psql, no quedaba registro de qué cambios se hicieron ni en qué orden, y el servidor de producción no tendría forma de saber qué tablas crear. Necesitaba que la estructura de la base estuviera guardada en Git junto al código y se pudiera aplicar igual en cualquier entorno.
- **Opciones evaluadas:**
  - Escribir un sistema propio.
  - Usar una herramienta (Drizzle, Prisma, Knex).
  - Crear las tablas a mano.
- **Decisión:** Escribir un sistema de migraciones propio: archivos `.sql` numerados que se aplican en orden, una sola vez, dentro de una transacción.
- **Por qué:**
  - Para aprender qué hacen esas herramientas por dentro antes de usarlas.
  - La contra: es más simple que una herramienta real (por ejemplo, no permite deshacer migraciones). Más adelante voy a pasar a Drizzle.

## 003 — Montos en centavos con BIGINT

- **Fecha:** 2026-10-05
- **Contexto:** La app tiene que guardar y sumar montos con centavos. En JavaScript, los números con decimales tienen errores de redondeo (`0.1 + 0.2` da `0.30000000000000004`), y sumando cientos de gastos los totales podrían no cerrar. Además, con la inflación los montos crecen rápido. Necesitaba totales exactos y espacio para montos grandes.
- **Opciones evaluadas:**
  - Guardar decimales (pesos con coma).
  - Guardar centavos como `INTEGER`.
  - Guardar centavos como `BIGINT`.
- **Decisión:** Guardar los montos en centavos, como números enteros de tipo `BIGINT`.
- **Por qué:**
  - Los enteros no tienen errores de redondeo: $1.250,50 se guarda como 125050, y la app lo convierte a pesos solo para mostrarlo.
  - `INTEGER` llega hasta unos 2.100 millones de centavos ($21 millones), un límite que con la inflación se puede superar. `BIGINT` permite montos muchísimo más grandes.

## 004 — Traer nombres de cuentas y categorías con JOIN

- **Fecha:** 2026-10-06
- **Contexto:** Para mostrar la lista de movimientos del mes necesitaba, además de los datos de cada movimiento, el nombre de su cuenta, de su categoría y de la cuenta destino. La tabla `movements` solo guarda los ids (por ejemplo `account_id: 1`). Si buscaba cada nombre con una consulta aparte, con 100 movimientos terminaría haciendo unas 300 consultas a la base (el problema conocido como "N+1 consultas"). Necesitaba traer todo en una sola consulta, sin perder los movimientos que no tienen categoría (transferencias) o cuenta destino (ingresos y gastos).
- **Opciones evaluadas:**
  - Una consulta aparte por cada nombre.
  - `JOIN` para todas las relaciones.
  - `JOIN` para la cuenta de origen y `LEFT JOIN` para la categoría y la cuenta destino.
- **Decisión:** `JOIN` para la cuenta de origen (siempre existe) y `LEFT JOIN` para la categoría y la cuenta destino (pueden ser `NULL`).
- **Por qué:**
  - Un JOIN une las tablas en una sola consulta: además del movimiento, trae el nombre de su cuenta y de su categoría.
  - Con `JOIN` común en todas, las transferencias desaparecerían de la lista por no tener categoría. `LEFT JOIN` las incluye y completa con `NULL`.