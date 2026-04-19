# Control de versiones (Git y GitHub)

Este apartado describe cómo se gestiona el **código fuente** del proyecto **PRW-VEP** (Voyager Experience Planner) mediante **Git** y un **repositorio remoto en GitHub**, y qué **buenas prácticas** se recomiendan para trabajo en equipo y evaluación académica.

---

## Rol de Git en el proyecto

**Git** es el sistema de control de versiones distribuido utilizado para:

- **Registrar el historial** de cada cambio en archivos (backend Laravel, frontend Vue, Docker, NGINX, documentación MkDocs, etc.).
- **Trabajar en paralelo** sin sobrescribir el trabajo de otras personas, combinando cambios de forma explícita.
- **Volver atrás** o comparar versiones cuando una modificación introduce un error o hay que justificar una entrega.
- **Vincular cada entrega** (tag, rama o *pull request*) con un conjunto de *commits* revisable por tutores o revisores.

En un proyecto full-stack como este, el repositorio único concentra **varios artefactos** que deben evolucionar al unísono (por ejemplo, una migración en Laravel y el tipo TypeScript que refleja el mismo campo en el cliente). Git permite que esos cambios vayan **agrupados y documentados** en el mismo *commit* o en la misma rama de trabajo.

---

## Repositorio en GitHub

El código se aloja en un **repositorio remoto en GitHub** (la URL exacta la facilita el equipo docente o el responsable del proyecto). GitHub aporta:

| Función | Utilidad |
|---------|----------|
| **Copia de seguridad centralizada** | El trabajo no queda solo en un ordenador local. |
| **Visibilidad y colaboración** | *Issues*, *pull requests* y revisiones de código. |
| **Integración continua (opcional)** | *Workflows* para tests o comprobaciones en cada *push*. |
| **Portfolio** | Enlace público o privado acorde a la política del centro. |

Flujo mínimo habitual:

1. **Clonar** el repositorio (o hacer *fork* si el flujo del curso lo exige).
2. Crear una **rama** para la tarea o entrega (recomendado).
3. Realizar **commits** locales con mensajes claros.
4. **Subir** la rama (`git push`) y abrir un **pull request** hacia la rama principal, o entregar según las instrucciones del docente.

```bash
git clone <url-del-repositorio-en-GitHub>
cd PRW-VEP
git checkout -b feature/descripcion-corta
# ... editar archivos ...
git add .
git commit -m "Descripción concisa del cambio"
git push -u origin feature/descripcion-corta
```

---

## Flujo de trabajo: ramas y commits

### Rama principal

Suele existir una rama **`main`** (o `master`) como línea base **estable** del proyecto. Las integraciones importantes deberían pasar por revisión antes de fusionarse ahí.

### Ramas de trabajo

Se recomienda **no desarrollar directamente** en `main` salvo acuerdo explícito del equipo:

| Convención (ejemplo) | Uso |
|----------------------|-----|
| `feature/…` | Nueva funcionalidad (API, pantalla, migración). |
| `fix/…` o `bugfix/…` | Corrección de errores. |
| `docs/…` | Solo documentación (MkDocs, README). |

Ventajas para la **evaluación**: el historial de la rama muestra la **evolución** de una tarea; el *pull request* concentra **diff** y descripción para el tutor.

### Commits

Un *commit* es una instantánea con mensaje. Buenas prácticas:

- **Frecuencia razonable**: commits pequeños y lógicos (un objetivo por commit cuando sea posible).
- **Mensaje en imperativo o descriptivo**, en español o inglés según norma del equipo, pero **coherente**.
- Evitar mensajes genéricos como «cambios» o «fix» sin contexto.

Ejemplos de mensajes **útiles**:

- `Añade validación de precios en StoreActivityRequest`
- `Corrige posición del toggle de sidebar en vista móvil`
- `Documenta despliegue Docker en deployment.md`

Ejemplos **poco útiles**:

- `asdf`
- `cambios varios`
- `wip`

---

## Buenas prácticas: commits descriptivos y control de cambios

### Commits descriptivos

Un mensaje de commit debería permitir, meses después, entender **qué** y **por qué** (el «por qué» puede ampliarse en el cuerpo del mensaje si se usa varias líneas).

Formato sugerido (inspirado en *Conventional Commits*, opcional):

```text
tipo(ámbito): descripción breve en presente o imperativo

Cuerpo opcional: contexto, referencia a issue, decisiones de diseño.
```

Tipos habituales: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

### Control de cambios (*changelog*)

Más allá del historial de Git, conviene mantener un **registro legible** de versiones para usuarios y evaluadores:

- Fichero **`CHANGELOG.md`** en la raíz (o sección en README) con versiones y lista de cambios **relevantes** (no cada commit literal).
- O uso de **releases en GitHub** con notas al publicar una etiqueta (`v1.0.0`, etc.).

Esto demuestra **gestión del producto** y facilita la defensa oral o escrita del proyecto en evaluación.

### Archivos que no deben versionarse

El repositorio debe incluir **`.gitignore`** para excluir, entre otros:

- dependencias (`node_modules`, vendor de Composer en despliegues que no lo versionen),
- entornos locales (`.env` con secretos),
- artefactos de build (`site/` de MkDocs, salidas de Vite en flujos concretos, según política del repo).

Así se reduce ruido en los *diffs* y se protegen **credenciales**.

---

## Utilidad concreta en PRW-VEP

| Situación | Cómo ayuda Git |
|-----------|----------------|
| Cambio en API y en front | Un mismo PR puede incluir Resource Laravel + tipo TS + vista Vue, con trazabilidad. |
| Migración de base de datos | El *commit* documenta el momento en que se añade una columna (`price`, índices, etc.). |
| Docker / NGINX | Los cambios de infraestructura quedan auditables y reversibles (`git revert`). |
| Documentación MkDocs | Las páginas bajo `docs/` evolucionan al mismo ritmo que el código, con *blame* por línea. |
| Entrega académica | El tutor puede revisar **fecha, autor y mensaje** de cada cambio. |

---

## Resumen

- **Git** versiona el proyecto de forma **distribuida** y **trazable**.
- **GitHub** centraliza el **remoto**, la **colaboración** y opcionalmente **CI/CD** y **releases**.
- **Ramas** y **pull requests** ordenan el trabajo y mejoran la **revisión**.
- **Commits descriptivos** y **changelog** (o releases) constituyen **buenas prácticas** reconocidas en industria y academia.

---

## Referencias

- Entorno y clonado inicial: [Entorno e instalación](setup.md)
- Despliegue desde código versionado: [Despliegue](deployment.md)
