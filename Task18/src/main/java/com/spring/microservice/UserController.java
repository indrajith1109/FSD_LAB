package com.spring.microservice;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/users")
public class UserController {
	private final UserService service;

	public UserController(UserService service){
	this.service=service;
	}

	@GetMapping("/{id}")
	public User getUser(
	@PathVariable Long id){

	return service.getUserById(id);

	}

	@PostMapping
	public User addUser(
	@RequestBody User user){

	return service.saveUser(user);

	}

}