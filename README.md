# Control de vacaciones y permisos

Proyecto de aprendizaje para Recursos Humanos de una municipalidad. Incluye una interfaz web local para registrar solicitudes ficticias, revisarlas y cambiar su estado, además de un notebook de Google Colab para consultar y analizar los datos. Ambos usan PostgreSQL en Supabase.

> Usa únicamente datos ficticios. No publiques nombres, DNI, teléfonos, sueldos ni información laboral real en GitHub o Colab. Para un uso institucional hacen falta revisión de TI, permisos por usuario, copias de seguridad y autorización de la municipalidad.

## Contenido

- `sql/schema.sql`: crea tablas, datos ficticios y una vista de resumen en PostgreSQL.
- `public/index.html`, `public/styles.css`, `public/app.js`: interfaz web adaptable a celular y computadora.
- `server.js`: API local que conecta la web con PostgreSQL. La contraseña queda en el servidor, no en el navegador.
- `notebooks/control_vacaciones_colab.ipynb`: notebook para consultar, graficar y registrar solicitudes ficticias desde Colab.
- `.env.example`: plantilla de configuración; la copia local `.env` no se sube a GitHub.

## Paso 1: preparar y abrir la interfaz web

Necesitas Node.js 18 o superior. En PowerShell, dentro de esta carpeta, ejecuta:

```powershell
npm install
Copy-Item .env.example .env
```

Abre `.env` y reemplaza `DATABASE_URL` con la cadena PostgreSQL que obtengas de Supabase. No compartas ese archivo. Luego inicia la web:

```powershell
npm start
```

Abre `http://localhost:3000`. Si aún no configuraste Supabase, la página carga, pero el formulario y la lista mostrarán un mensaje de conexión.

## Paso 2: subir el proyecto a GitHub

1. Crea un repositorio **privado** en GitHub. No agregues archivos con datos reales.
2. Esta carpeta ya tiene un remoto llamado `origin` que apunta al repositorio anterior `Caratula-Folio-Con-Interfaz-`. Si quieres que este proyecto nuevo vaya a otro repositorio, cambia el remoto por la URL del nuevo repositorio:

   ```bash
   git remote set-url origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   ```

   Confirma el destino con `git remote -v` antes de subir. Si mantienes el remoto actual, el siguiente commit registrará también la eliminación del proyecto anterior.
3. Abre una terminal en esta carpeta y ejecuta:

   ```bash
   git add -A
   git commit -m "Crear demo de control de vacaciones"
   git push -u origin HEAD
   ```

## Paso 3: crear la base PostgreSQL

1. Crea un proyecto en Supabase y espera a que termine de aprovisionarse.
2. En el panel, abre **SQL Editor** y crea una consulta nueva.
3. Copia y ejecuta todo `sql/schema.sql`. Crea el esquema `rrhh_demo`, dos tablas, datos ficticios y una vista. Puedes volver a ejecutarlo sin duplicar los ejemplos.
4. En **Connect → Session pooler**, copia la cadena de conexión de PostgreSQL y reemplaza `[YOUR-PASSWORD]` con la contraseña de base de datos. Si la contraseña contiene caracteres especiales, codifícala para una URL. Usa esa cadena en `.env` para la web y, cuando corresponda, en Colab.

## Paso 4: abrir el notebook en Google Colab

1. En Colab, elige **Archivo → Abrir cuaderno → GitHub**.
2. Autoriza GitHub si te lo pide, busca tu usuario y selecciona `notebooks/control_vacaciones_colab.ipynb`.
3. Ejecuta las celdas en orden. Cuando lo solicite, pega la cadena de conexión de Supabase. La entrada está oculta y no se guarda en el notebook.

Colab ejecuta el notebook; no aloja la base de datos. La base persiste en Supabase y las credenciales deben mantenerse privadas. No compartas una copia del notebook con secretos ni pegues la cadena en una celda.

## Alcance de esta demo

Es una maqueta educativa para practicar SQL y análisis. La aprobación en pantalla es solo una demostración: no incluye inicio de sesión ni control de acceso institucional. El servidor está pensado para ejecutarse localmente; no lo publiques abierto en internet ni lo uses con datos personales reales. Para un uso institucional se requiere autenticación, permisos por rol, revisión de TI y autorización de la municipalidad.
