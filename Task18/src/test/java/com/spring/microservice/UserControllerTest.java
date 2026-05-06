package com.spring.microservice;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;

import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;


@WebMvcTest(UserController.class)
public class UserControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	UserService service;

	@Test
	void testGetUser()
	throws Exception{

	User user=
	new User(1L,"Rahman","ACTIVE");

	when(service.getUserById(1L))
	.thenReturn(user);

	mockMvc.perform(
	get("/users/1"))

	.andExpect(status().isOk())
	.andExpect(
	jsonPath("$.name")
	.value("Rahman"));

	}

}