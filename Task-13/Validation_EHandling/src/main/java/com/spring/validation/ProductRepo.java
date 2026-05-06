package com.spring.validation;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;


@Repository
public class ProductRepo {
	
	
	private List<ProductModel> productList = new ArrayList<>();

    public ProductModel save(ProductModel product) {
        productList.add(product);
        return product;
    }

    public List<ProductModel> findAll() {
        return productList;
    }

}
