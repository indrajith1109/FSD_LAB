package com.spring.microservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserConsumer {
	
	@Autowired
    private JmsTemplate jmsTemplate;

    @JmsListener(destination = "user.request.queue")
    public void processMessage(String userId) {

        String response;

        try {
            // Simulate business logic
            if (userId.equals("101")) {
                response = "User is ACTIVE";
            } else {
                throw new RuntimeException("User not found");
            }

        } catch (Exception e) {
            // Graceful failure handling
            response = "Fallback: Unable to process userId " + userId;
        }

        // Send response back
        jmsTemplate.convertAndSend("user.response.queue", response);
    }

}
