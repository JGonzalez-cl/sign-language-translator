# Manual de Usuario — ASL Sign Language Translator

## 1. Introducción

ASL Sign Language Translator es una aplicación web que traduce el lenguaje de signos americano (ASL) a texto mediante inteligencia artificial. Permite traducir gestos a través de imágenes, vídeos y sesiones en directo con la cámara web.

Acceso: [https://asltranslatorapp.netlify.app](https://asltranslatorapp.netlify.app)

---

## 2. Registro e Inicio de Sesión

### 2.1 Crear una cuenta

1. Accede a la aplicación y haz clic en **Registrarse**
2. Rellena el formulario con tu email, nombre de usuario, nombre, apellidos y contraseña
3. La contraseña debe tener al menos 8 caracteres
4. Haz clic en **Crear cuenta** — accederás automáticamente a la aplicación

### 2.2 Iniciar sesión

1. Introduce tu email y contraseña
2. Haz clic en **Iniciar sesión**

La sesión se mantiene activa automáticamente mediante refresh tokens. No es necesario volver a iniciar sesión salvo que cierres sesión manualmente.

### 2.3 Cerrar sesión

Haz clic en tu avatar o nombre de usuario en la barra de navegación y selecciona **Cerrar sesión**.

---

## 3. Traductor

El traductor tiene tres modos de funcionamiento. Accede desde el menú superior.

### 3.1 Traducción por imagen

Traduce un único gesto ASL a partir de una imagen estática.

1. Accede a **Traductor → Imagen**
2. Elige una de las dos opciones:
   - **Subir imagen** — selecciona un archivo `.jpg`, `.jpeg` o `.png` desde tu dispositivo
   - **Capturar foto** — usa la cámara web para hacer una foto en el momento
3. Asegúrate de que la mano esté centrada en la imagen y la muñeca sea visible
4. Haz clic en **Traducir**
5. El resultado muestra el gesto detectado y el porcentaje de confianza del modelo

**Recomendaciones para obtener mejores resultados:**
- Fondo despejado sin objetos que distraigan
- Buena iluminación, sin contraluz
- Muñeca visible en el encuadre
- Mano centrada y a distancia media de la cámara

### 3.2 Traducción por vídeo

Traduce una secuencia de gestos ASL a partir de un vídeo.

1. Accede a **Traductor → Vídeo**
2. Elige una de las dos opciones:
   - **Subir vídeo** — selecciona un archivo de vídeo desde tu dispositivo
   - **Grabar vídeo** — graba directamente con la cámara web
3. El vídeo no puede superar **180 segundos** de duración
4. Haz clic en **Traducir**
5. El resultado muestra la secuencia de gestos detectados en orden

El modelo procesa el vídeo a **6 fotogramas por segundo** — no es necesario ir despacio, pero evita movimientos bruscos entre gestos.

### 3.3 Sesión en directo

Traduce gestos en tiempo real usando la cámara web.

1. Accede a **Traductor → En directo**
2. Haz clic en **Iniciar sesión**
3. La aplicación accede a tu cámara y empieza a detectar gestos automáticamente
4. Los gestos detectados se van acumulando en la pantalla formando el texto traducido
5. Para borrar el último gesto, haz el gesto **DEL** o pulsa la tecla **retroceso**.
6. Para terminar, haz clic en **Detener**.
7. La sesión se guarda automáticamente en tu historial

**Gestos especiales:**
| Gesto | Función |
|---|---|
| `DEL` | Elimina el último carácter de la secuencia |
| `SPACE` | Inserta un espacio |
| `NOTHING` | Ausencia de gesto — el modelo no registra nada |

La sesión tiene un tiempo máximo de **180 segundos**. Al agotarse, se guarda automáticamente.

---

## 4. Historial

Accede a **Historial** desde el menú superior para ver todas tus sesiones de traducción anteriores.

### 4.1 Lista de sesiones

La lista muestra todas tus sesiones ordenadas por fecha, con:
- Modo de traducción (imagen, vídeo, en directo)
- Fecha y hora
- Nombre de la sesión (editable)
- Texto traducido

### 4.2 Detalle de sesión

Haz clic en cualquier sesión para ver el detalle completo:
- Texto traducido completo
- Confianza media del modelo
- Desglose gesto a gesto con la confianza individual de cada uno
- Imagen o vídeo original (si la sesión fue por imagen o vídeo)

### 4.3 Renombrar una sesión

En el detalle de la sesión, haz clic en el nombre para editarlo. Las sesiones se nombran automáticamente por id, pero puedes personalizarlos para poder diferenciarlas.

### 4.4 Eliminar una sesión

En el detalle, haz clic en el icono de eliminar.

---

## 5. Estadísticas

Accede a **Estadísticas** desde el menú lateral para ver un resumen de tu actividad.

Las estadísticas incluyen:
- **Total de sesiones** realizadas
- **Total de gestos** traducidos
- **Confianza media** del modelo en tus sesiones
- **Distribución por modo** — cuántas sesiones has hecho por imagen, vídeo y en directo
- **Gestos más frecuentes** — los gestos que más has traducido
- **Actividad reciente** — gráfica de sesiones por día

---

## 6. Perfil

Accede a **Perfil** desde el menú lateral para gestionar tu cuenta.

### 6.1 Editar datos personales

Puedes modificar tu nombre, apellidos y nombre de usuario. El email no es editable.

### 6.2 Cambiar contraseña

1. Introduce tu contraseña actual
2. Introduce la nueva contraseña (mínimo 8 caracteres)
3. Confirma la nueva contraseña
4. Haz clic en **Guardar**

### 6.3 Eliminar cuenta

En la sección **Zona de peligro** del perfil encontrarás la opción de eliminar tu cuenta. Esta acción es irreversible — se eliminan todos tus datos personales y sesiones.

---

## 7. Panel de Administración

El panel de administración es accesible únicamente para usuarios con rol de administrador.

### 7.1 Gestión de usuarios

- Ver todos los usuarios registrados
- Cambiar el estado de un usuario: `ACTIVO`, `INACTIVO`, `BANEADO`
- Eliminar usuarios
- Un administrador no puede banear ni eliminar a otro administrador

### 7.2 Predicciones

Vista de todas las sesiones de traducción de todos los usuarios, incluyendo las sesiones eliminadas por los usuarios (soft delete).

### 7.3 Estadísticas globales

Estadísticas agregadas de toda la plataforma: total de sesiones, gestos más frecuentes, actividad por día y distribución por modo.

### 7.4 Logs de actividad

Registro de acciones relevantes del sistema: logins, registros, cambios de contraseña, eliminaciones de cuenta y cambios de estado de usuario.

---

## 8. Preguntas Frecuentes

**¿Qué gestos puede reconocer la aplicación?**
El modelo reconoce las 26 letras del alfabeto ASL (A-Z), más los gestos especiales `DEL`, `SPACE` y `NOTHING`.

**¿Por qué el modelo confunde algunas letras?**
Los gestos M y N son visualmente similares en ASL — ambos tienen los dedos cruzados sobre el pulgar con una diferencia mínima. El modelo puede confundirlos ocasionalmente. Es una limitación conocida del enfoque de detección por landmarks.

**¿La aplicación funciona con cualquier cámara web?**
Sí, con cualquier cámara web estándar. La calidad de la detección mejora con buena iluminación y fondo despejado.

**¿Los vídeos y fotos se almacenan de forma permanente?**
Los archivos se almacenan en la nube asociados a tu sesión. Al eliminar una sesión del historial, el archivo asociado se elimina también del almacenamiento.

**¿La sesión en directo funciona sin conexión a internet?**
No — la detección de gestos se realiza en el servidor. Se requiere conexión a internet para todas las funciones de traducción.