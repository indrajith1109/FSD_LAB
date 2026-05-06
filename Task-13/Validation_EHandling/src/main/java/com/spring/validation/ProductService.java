package com.spring.validation;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ProductService {
	
	private final ProductRepo repository;

    public ProductService(ProductRepo repository) {
        this.repository = repository;
    }

    public ProductModel addProduct(ProductModel product) {
        return repository.save(product);
    }

    public List<ProductModel> getAllProducts() {
        return repository.findAll();
    }

}
