package com.spring.microservice;

import org.springframework.beans.factory.annotation.Autowired;

public class UserService {
	@Autowired
	UserRepository repository;

	public User getUserById(Long id){

	return repository.findById(id)
	.orElseThrow(()->
	new RuntimeException(
	"User Not Found"));

	}

	public User saveUser(User user){
	return repository.save(user);
	}

	}