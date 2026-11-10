# Chat con RabbitMQ

La implementación de la actividad está en **`complete/`**. Se conserva `initial/` como proyecto inicial y los archivos del ejemplo original de Spring.

## Ejecutar

Requiere Docker Desktop activo y Java 17 o superior.

```powershell
cd complete
docker compose up -d --build --wait
.\mvnw.cmd spring-boot:run
```

En Linux/macOS se puede usar `./mvnw`. También se mantienen las dependencias equivalentes en Gradle.

Abrir `http://localhost:8080` en dos pestañas y conectar con nombres distintos. El envío, los ingresos y las salidas deben verse en ambas pestañas. Usar un puerto HTTP diferente si ya se está ejecutando el proyecto `chatws`.

## Configuración

| Protocolo | Puerto local | Uso |
| --- | --- | --- |
| AMQP | 5672 | RabbitTemplate, cola y receptor del ejemplo base |
| STOMP | 61613 | Relay del chat WebSocket |
| HTTP | 15672 | Administración de RabbitMQ |

Credenciales locales por defecto: `chat` / `chat-local`. Los puertos del contenedor se publican sólo en localhost. Se pueden cambiar con `RABBITMQ_USER` y `RABBITMQ_PASSWORD`, usando los mismos valores al ejecutar Compose y Spring. Host, puerto AMQP y puerto STOMP también admiten `RABBITMQ_HOST`, `RABBITMQ_AMQP_PORT` y `RABBITMQ_STOMP_PORT`.

`Dockerfile.rabbitmq` habilita `rabbitmq_stomp`. `application.yaml` configura AMQP en 5672 y STOMP en 61613. `WebSocketConfig` usa `enableStompBrokerRelay("/topic", "/queue")`: los mensajes del chat pasan por RabbitMQ. El navegador conecta mediante SockJS a `/ws` y usa `/app/chat.addUser`, `/app/chat.sendMessage` y `/topic/public`.

La aplicación queda ejecutándose como servidor web. Se conserva el productor/receptor AMQP del ejemplo base, que imprime `Hello from RabbitMQ!` al arrancar.

## Comprobar la conexión

Desde `complete/`:

```powershell
docker compose ps
docker compose exec rabbitmq rabbitmq-plugins list -e
docker compose exec rabbitmq rabbitmq-diagnostics listeners
.\mvnw.cmd test
```

Comprobar que el plugin STOMP esté habilitado y que aparezcan los listeners 5672 y 61613. Al conectar dos pestañas y enviar un mensaje debe aparecer en ambas. Para demostrar que el chat depende del broker, detenerlo con `docker compose stop rabbitmq`: las conexiones dejan de estar disponibles; después reiniciar con `docker compose start rabbitmq` y reconectar los clientes.

La prueba heredada del ejemplo tolera la ausencia del broker. Por eso un `test` exitoso por sí solo no demuestra la conexión real: se necesitan las comprobaciones anteriores.

Para detener el contenedor de esta actividad: `docker compose down`.

Base: [Spring Getting Started — Messaging with RabbitMQ](https://spring.io/guides/gs/messaging-rabbitmq). Se conservan sus licencias. Referencias: [relay STOMP de Spring](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-broker-relay.html) y [plugin STOMP de RabbitMQ](https://www.rabbitmq.com/docs/stomp).
