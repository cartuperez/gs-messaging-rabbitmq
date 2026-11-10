package com.example.messagingrabbitmq;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headers) {
        String user = message.getUsuario() == null ? "" : message.getUsuario().trim();
        if (user.isEmpty() || user.length() > 80) throw new IllegalArgumentException("Usuario inválido");
        headers.getSessionAttributes().put("username", user);
        message.setUsuario(user);
        message.setTipo("JOIN");
        message.setContenido("se unió al chat");
        return message;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(ChatMessage message, SimpMessageHeaderAccessor headers) {
        String user = (String) headers.getSessionAttributes().get("username");
        if (user == null) throw new IllegalStateException("Primero registrá un usuario");
        String content = message.getContenido() == null ? "" : message.getContenido().trim();
        if (content.isEmpty() || content.length() > 2000) throw new IllegalArgumentException("Mensaje inválido");
        message.setUsuario(user);
        message.setContenido(content);
        message.setTipo("CHAT");
        return message;
    }
}
