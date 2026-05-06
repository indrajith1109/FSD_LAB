package com.spring.microservice;

//import java.io.ObjectInputFilter.Status;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/manage")
public class Client2_Controller {
	
	@GetMapping("/check")
	public String Status() {
		return "Welcome to Spring Boot from Client-2";
	}

}
