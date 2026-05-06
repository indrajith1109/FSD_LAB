package com.spring.microservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserProducer {
		
	@Autowired
    private JmsTemplate jmsTemplate;

    public void sendMessage(String message) {
        jmsTemplate.convertAndSend("user.request.queue", message);
    }

}
