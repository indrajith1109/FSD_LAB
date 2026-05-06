package com.spring.microservice;

import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
	@Mock
	UserRepository repository;

	@InjectMocks
	UserService service;

	@Test
	void testGetUserById(){

	User user=
	new User(1L,"Rahman","ACTIVE");

	when(repository.findById(1L))
	.thenReturn(
	Optional.of(user));

	User result=
	service.getUserById(1L);

	assertEquals(
	"Rahman",
	result.getName());

	}

	@Test
	void testSaveUser(){

	User user=
	new User(2L,"Ali","ACTIVE");

	when(repository.save(user))
	.thenReturn(user);

	User saved=
	service.saveUser(user);

	assertEquals(
	"Ali",
	saved.getName());

	}

	@Test
	void testUserNotFound(){

	when(repository.findById(99L))
	.thenReturn(Optional.empty());

	assertThrows(
	RuntimeException.class,
	()->service.getUserById(99L));

	}

}
