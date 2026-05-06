package com.spring.microservice;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class Client1_Controller {
	
	//@Autowired
	//private Environment environment;
	
	@GetMapping("/status/check")
	public String Status() {
	return "Welcome to Spring Boot Microservices from Client-1";
		//return "Port Number:"+environment.getProperty("local.server.port");
	}

}
