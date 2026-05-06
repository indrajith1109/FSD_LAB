package com.spring.validation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class ProductModel {

	private int id;

    @NotBlank(message = "Product name cannot be empty")
    private String name;

    @Positive(message = "Price must be greater than 0")
    private double price;

    public ProductModel() {
    	
    }

    public ProductModel(int id, String name, double price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }

    public int getId() { 
    	return id; 
    	}
    public void setId(int id) { 
    	this.id = id; 
    	}

    public String getName() { 
    	return name; 
    	}
    public void setName(String name) { 
    	this.name = name; 
    	}

    public double getPrice() { 
    	return price; 
    	}
    public void setPrice(double price) { 
    	this.price = price; 
    	}
}
