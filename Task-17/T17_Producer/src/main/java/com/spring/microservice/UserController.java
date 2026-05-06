package com.spring.microservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserProducer producer;

    @GetMapping("/send/{id}")
    public String send(@PathVariable String id) {

        producer.sendMessage(id);

        return "Message sent for userId: " + id;
    }
}