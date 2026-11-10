package com.example.messagingrabbitmq;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class ChatEvents {
    private final SimpMessagingTemplate messages;
    public ChatEvents(SimpMessagingTemplate messages) { this.messages = messages; }
    @EventListener
    public void disconnected(SessionDisconnectEvent event) {
        var attributes = StompHeaderAccessor.wrap(event.getMessage()).getSessionAttributes();
        if (attributes == null) return;
        String user = (String) attributes.remove("username");
        if (user == null) return;
        ChatMessage message = new ChatMessage();
        message.setUsuario(user);
        message.setTipo("LEAVE");
        message.setContenido("salió del chat");
        messages.convertAndSend("/topic/public", message);
    }
}
