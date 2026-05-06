package com.spring.microservice;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;


@Service
public class UserService {

	 private List<UserModel> users = new ArrayList<>();
	    private Long idCounter = 1L;

	    public UserModel addUser(UserModel user) {
	        user.setId(idCounter++);
	        users.add(user);
	        return user;
	    }

	    public List<UserModel> getUsers() {
	        return users;
	    }
}
