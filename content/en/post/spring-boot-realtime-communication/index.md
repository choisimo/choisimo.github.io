---
title: "Trial and Error: Implementing Real-time Communication with Spring Boot"
date: 2025-01-24
categories: ["Spring Boot", "Web Development", "Real-time Communication", "JavaScript"]
tags: ["SpringBoot", "SSE", "WebSocket", "RealTimeCommunication", "SseEmitter", "STOMP"]
author: "choisimo"
description: "Experience gained from trying both SSE and WebSocket, covering their pros and cons and practical considerations"
toc: true
---

I recently needed to implement real-time notification functionality in a project, and I had a lot of concerns about whether to use SSE or WebSocket. Eventually, I implemented both and experienced their characteristics firsthand.

## Why Real-time Communication is Needed

Modern web applications are almost real-time by default. The traditional **request-response model** has limitations:

- **Chat**: Messages need to arrive immediately
- **Notifications**: New notifications should be displayed instantly
- **Live Data**: Stock prices, game scores, etc.
- **Collaboration**: Documents being edited by multiple people simultaneously

Initially, I thought "Can't we just poll periodically with Ajax?" but this is inefficient and puts a burden on the server.

## SSE vs WebSocket - At the Crossroads

### SSE (Server-Sent Events)
**Feature**: Server → Client **unidirectional** communication
**Advantages**: Simple because it's HTTP-based, can utilize existing infrastructure
**Disadvantages**: Limited due to being unidirectional

### WebSocket  
**Feature**: Client ↔ Server **bidirectional** communication
**Advantages**: Optimized for real-time interaction
**Disadvantages**: Complex and connection management is tricky

## SSE Implementation Experience

### Spring Boot Server Side

I initially thought SSE would be simple, but there was actually a lot to consider.

```java
@RestController
public class NotificationController {
    
    // Thread-safe collection to store SseEmitters
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    
    @GetMapping(value = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        // Welcome message on successful connection
        try {
            emitter.send(SseEmitter.event()
                .name("connect")
                .data("Connected to notifications"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        
        emitters.add(emitter);
        
        // Lifecycle management is key!
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
        });
        emitter.onError((e) -> {
            emitters.remove(emitter);
        });
        
        return emitter;
    }
}
```

### Problems Encountered

**1. Memory Leaks**
Initially, I didn't properly handle lifecycle callbacks, so disconnected emitters kept remaining in memory.

**2. Thread Pool Exhaustion**  
Each SSE connection occupied a request processing thread, causing the server to freeze. I solved this with a separate ExecutorService.

**3. Browser Compatibility**
IE doesn't support SSE. (But does anyone use IE these days?)

### JavaScript Client

```javascript
const eventSource = new EventSource('/notifications');

eventSource.onopen = function(event) {
    console.log('SSE connected');
};

eventSource.onmessage = function(event) {
    console.log('Received data:', event.data);
    // Display notification on screen
    showNotification(event.data);
};

// Custom event handling
eventSource.addEventListener('userAction', function(event) {
    console.log('User action:', event.data);
});

eventSource.onerror = function(event) {
    console.error('SSE error:', event);
    // Reconnection logic
};
```

**Automatic reconnection** is a major advantage of SSE. Even if the network disconnects, it automatically attempts to reconnect.

## WebSocket Implementation Experience

### Spring Boot + STOMP Configuration

For WebSocket, it's common to use the **STOMP protocol** rather than raw sockets.

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable memory-based message broker
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix when client sends messages to server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();  // SockJS fallback support
    }
}
```

### Message Handling Controller

```java
@Controller
public class ChatController {

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        return chatMessage;
    }

    @MessageMapping("/chat.addUser") 
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        // Store username in WebSocket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }
}
```

### JavaScript Client (SockJS + STOMP)

```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('WebSocket connected: ' + frame);
    
    // Subscribe to public channel
    stompClient.subscribe('/topic/public', function(message) {
        const chatMessage = JSON.parse(message.body);
        displayMessage(chatMessage);
    });
    
    // Subscribe to private messages  
    stompClient.subscribe('/queue/private-' + userId, function(message) {
        const privateMessage = JSON.parse(message.body);
        displayPrivateMessage(privateMessage);
    });
});

// Send message
function sendMessage() {
    const messageContent = document.getElementById('message').value;
    
    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify({
        'sender': username,
        'content': messageContent,
        'type': 'CHAT'
    }));
}
```

### WebSocket Pitfalls

**1. Connection State Management**
WebSocket doesn't automatically reconnect when the connection is lost. You need to implement it yourself.

```javascript
let reconnectInterval = 5000;
let maxReconnectAttempts = 5;
let reconnectAttempts = 0;

function connect() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    
    stompClient.connect({}, onConnected, onError);
}

function onError() {
    if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            reconnectAttempts++;
            connect();
        }, reconnectInterval);
    }
}
```

**2. Memory Leaks**
If you don't clean up sessions on the server when WebSocket connections are lost, memory keeps accumulating.

```java
@EventListener
public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String username = (String) headerAccessor.getSessionAttributes().get("username");
    
    if (username != null) {
        // Send user left notification
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setType(ChatMessage.MessageType.LEAVE);
        chatMessage.setSender(username);
        
        messagingTemplate.convertAndSend("/topic/public", chatMessage);
    }
}
```

## Differences Felt in Practice

### Cases Where SSE Was Good
- **Unidirectional notifications**: New orders, system announcements
- **Live feeds**: News, stock prices
- **Progress updates**: File uploads, task progress

### Cases Where WebSocket Was Needed  
- **Chat**: Bidirectional real-time message exchange
- **Games**: Real-time interaction
- **Collaboration tools**: Collaborative editing, video conferencing

## Performance and Scaling

### SSE
- Easy to configure load balancers and proxies because it's HTTP-based
- But there's a limit on simultaneous connections per browser (usually 6)

### WebSocket
- More efficient protocol (less header overhead)
- But load balancer configuration is complex (requires sticky sessions)

### Actual Measurement Results
- **SSE**: 15% CPU usage with 1000 connections
- **WebSocket**: 8% CPU usage with 1000 connections

However, SSE only uses resources when sending messages, while WebSocket continuously uses resources just to maintain connections.

## Conclusion: When to Use What?

### When to Use SSE
- Only sending data from server to client
- When you want to reduce implementation complexity
- When you want to utilize existing HTTP infrastructure

### When to Use WebSocket  
- When bidirectional real-time communication is needed
- When message frequency is high
- When latency is important

### My Final Choice
Eventually, in the project:
- **Notification feature**: Used SSE
- **Chat feature**: Used WebSocket

Using both in one application was the most practical approach.

## Wrap-up

When I first tried real-time communication technology, I thought WebSocket was omnipotent, but I realized that it's important to choose the appropriate technology based on the use case.

Especially **connection management** and **resource cleanup** are really important. If you do this carelessly, it leads to memory leaks or performance issues.

Going forward, I think I'll be able to develop the eye to choose appropriate technology by accurately analyzing requirements.