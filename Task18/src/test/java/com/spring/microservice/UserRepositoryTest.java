package com.spring.microservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Optional;

@DataJpaTest
public class UserRepositoryTest {

	@Autowired
	UserRepository repository;

	@Test
	void testSaveUser(){

	User user=
	new User(1L,"Rahman","ACTIVE");

	User saved=
	repository.save(user);

	assertNotNull(saved);

	}

	@Test
	void testFindUser(){

	User user=
	new User(2L,"Ali","ACTIVE");

	repository.save(user);

	Optional<User> found=
	repository.findById(2L);

	assertTrue(found.isPresent());

	}

}