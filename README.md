# Control demo de vacaciones y permisos

Proyecto educativo para practicar una base de datos MariaDB desde Google Colab. El cuaderno instala el servidor dentro de la sesión, crea `rrhh_demo`, carga el SQL y muestra cómo consultar y registrar solicitudes ficticias. También incluye una interfaz web HTML/CSS/JavaScript y un servidor Node para ejecutarlos en una computadora con MariaDB.

> Usa solo códigos ficticios como `DEMO-001`. No ingreses nombres, DNI, sueldos, teléfonos ni información laboral real. La MariaDB de Colab es temporal y desaparece al reiniciarse o cerrarse su entorno.

## Usarlo en Google Colab

1. Abre [el notebook de este proyecto](https://colab.research.google.com/github/GimAlvieri/Municipalidad-Colab/blob/master/notebooks/control_vacaciones_colab.ipynb).
2. Ejecuta las celdas de arriba hacia abajo. La primera instala MariaDB y clona el repositorio si hace falta.
3. La segunda crea la base y carga automáticamente `sql/schema.sql`.
4. Las siguientes celdas consultan, grafican y registran datos ficticios en MariaDB.
5. Si el entorno de Colab se reinicia, repite las primeras celdas para recrear la base y los ejemplos.

El usuario `rrhh_app` y la contraseña `colab_demo` son credenciales desechables creadas solo para la demostración dentro de Colab. No reutilices esa contraseña ni publiques datos reales.

## Archivos

- `notebooks/control_vacaciones_colab.ipynb`: instalación y ejercicios de MariaDB en Colab.
- `sql/schema.sql`: crea tablas, registros de ejemplo y una vista resumen.
- `public/`: interfaz web HTML, estilos CSS y JavaScript.
- `server.js`: API Node que conecta la interfaz con MariaDB.
- `.env.example`: ejemplo de configuración local; nunca subas `.env`.

## Ejecutar la interfaz web localmente (opcional)

Para usar la página fuera de Colab, instala MariaDB y Node.js 18 o superior en tu computadora. Crea una base `rrhh_demo`, ejecuta `sql/schema.sql` y crea un usuario MariaDB local con permisos sobre esa base. Luego:

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Abre `http://localhost:3000`. Edita `.env` con el usuario y contraseña locales de MariaDB. No uses una base temporal de Colab como base permanente para la página local.

## GitHub

El repositorio no contiene contraseñas personales. Para enviar cambios:

```bash
git add -A
git commit -m "Actualizar demo de RR. HH."
git push
```
