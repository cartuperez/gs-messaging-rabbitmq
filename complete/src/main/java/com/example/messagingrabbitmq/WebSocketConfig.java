package com.example.messagingrabbitmq;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.host}")
    private String host;
    @org.springframework.beans.factory.annotation.Value("${chat.stomp.port}")
    private int port;
    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.username}")
    private String username;
    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.password}")
    private String password;
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").withSockJS();
    }
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost(host).setRelayPort(port)
                .setClientLogin(username).setClientPasscode(password)
                .setSystemLogin(username).setSystemPasscode(password);
        registry.setPreservePublishOrder(true);
    }
}
