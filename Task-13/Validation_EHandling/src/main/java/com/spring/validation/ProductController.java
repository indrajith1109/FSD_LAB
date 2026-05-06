package com.spring.validation;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/products")

public class ProductController {
	
	private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @PostMapping
    public ProductModel addProduct(@Valid @RequestBody ProductModel product) {
        return service.addProduct(product);
    }

    @GetMapping
    public List<ProductModel> getAllProducts() {
        return service.getAllProducts();
    }

}
