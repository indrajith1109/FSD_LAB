package com.spring.microservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;


@EnableJms
@SpringBootApplication
public class T17ConsumerApplication {

	public static void main(String[] args) {
		SpringApplication.run(T17ConsumerApplication.class, args);
	}

}
