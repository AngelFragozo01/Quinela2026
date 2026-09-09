---
name: creador-de-habilidades
description: >-
  Usa esta habilidad cuando el usuario solicite crear una nueva habilidad (skill) para Antigravity en este espacio de trabajo. Garantiza que la nueva habilidad se estructure correctamente y esté redactada íntegramente en español.
---

# Creador de Habilidades (Skill Creator)

Esta habilidad te proporciona las pautas exactas para crear nuevas "habilidades" (skills) para el agente Antigravity, asegurando que se escriban en idioma **Español** y sigan los estándares del sistema.

## Estructura Requerida

Cualquier habilidad nueva debe colocarse en un directorio dentro de `.agents/skills/` en la raíz del proyecto.

Por ejemplo, si la habilidad se llama `mi-nueva-habilidad`, su estructura será:

```text
.agents/skills/mi-nueva-habilidad/
├── SKILL.md          # Requerido: Archivo principal de instrucciones (debe llevar frontmatter)
├── scripts/          # Opcional: Scripts automatizados y utilidades
├── examples/         # Opcional: Códigos de ejemplo
├── resources/        # Opcional: Plantillas o archivos adicionales
└── references/       # Opcional: Documentación extensa
```

## Estructura del archivo `SKILL.md`

Todo archivo `SKILL.md` debe iniciar siempre con un bloque YAML (frontmatter) que incluya `name` y `description`.

**Plantilla base a seguir:**

```markdown
---
name: nombre-de-la-habilidad-en-kebab-case
description: >-
  Describe claramente cuándo el agente debe utilizar esta habilidad. Usa tercera persona.
  Ejemplo: "Usa esta habilidad cuando el usuario pida analizar la base de datos de producción."
---

# Título de la Habilidad

Proporciona instrucciones precisas y paso a paso para que el agente sepa cómo resolver la tarea encomendada.

## Pasos o Flujo de Trabajo

1. Paso 1 a realizar.
2. Paso 2 a realizar.
3. Validación de que la tarea fue exitosa.
```

## Reglas Críticas para Crear Nuevas Habilidades

1. **Idioma Estricto**: Todo el contenido de la habilidad (metadatos, instrucciones, pasos) **debe redactarse en español**.
2. **`name`**: Debe ser un identificador único, todo en minúsculas y separado por guiones (formato `kebab-case`).
3. **`description`**: Es el campo más importante. El agente leerá esto en segundo plano para saber si la habilidad le es útil para un prompt del usuario. Asegúrate de explicar el "qué" hace y "cuándo" se debe activar.
4. **Modularidad**: Si la habilidad requiere mucha documentación o pasos gigantes, crea archivos separados en una carpeta `references/` e incluye hipervínculos relativos desde el `SKILL.md`. Esto ayuda a no sobrecargar la memoria (context window) del agente.
5. **Pasos accionables y verificables**: Siempre instruye al agente sobre cómo comprobar que lo que hizo funcionó (por ejemplo: "verifica los logs", "haz un dry-run", etc.). No le des consejos genéricos de programación, enfócate en tu flujo de trabajo específico.
