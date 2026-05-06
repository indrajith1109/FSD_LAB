package com.spring.microservice;

import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

@Component
public class ResponseListener {
	
	@JmsListener(destination = "user.response.queue")
    public void receiveResponse(String response) {
        System.out.println("Received Response: " + response);
    }

}
