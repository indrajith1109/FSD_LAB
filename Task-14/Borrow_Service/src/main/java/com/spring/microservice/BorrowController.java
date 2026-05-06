package com.spring.microservice;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/borrow")
public class BorrowController {

    @Autowired
    private BorrowService service;

    @PostMapping("/issue")
    public BorrowModel issue(@RequestBody BorrowModel borrow) {
        return service.issueBook(borrow);
    }

    @PostMapping("/return/{id}")
    public BorrowModel returnBook(@PathVariable Long id) {
        return service.returnBook(id);
    }

    @GetMapping
    public List<BorrowModel> all() {
        return service.getAll();
    }
}