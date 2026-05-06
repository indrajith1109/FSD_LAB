package com.spring.microservice;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="users")
public class User {

    @Id
    private Long id;
    private String name;
    private String status;

    public User() {}

    public User(Long id,String name,String status){
        this.id=id;
        this.name=name;
        this.status=status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id){
        this.id=id;
    }

    public String getName(){
        return name;
    }

    public void setName(String name){
        this.name=name;
    }

    public String getStatus(){
        return status;
    }

    public void setStatus(String status){
        this.status=status;
    }
}
