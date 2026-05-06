package com.accountmng.micro.amcontroller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/account")
public class AMController {
	
	@GetMapping("/check")
	public String Account() {
		
		return "Welcome from Account Management Spring Boot Microservice";
	}

}
