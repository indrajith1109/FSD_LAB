package com.spring.microservice;

import org.apache.activemq.command.ActiveMQQueue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.jms.Queue;

@Configuration
public class JmsConfig {
	
	 	@Bean
	    public Queue requestQueue() {
	        return new ActiveMQQueue("user.request.queue");
	    }

	    @Bean
	    public Queue responseQueue() {
	        return new ActiveMQQueue("user.response.queue");
	    }

}
