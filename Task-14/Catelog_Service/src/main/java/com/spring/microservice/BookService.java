package com.spring.microservice;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class BookService {
	
	private List<BookModel> books = new ArrayList<>();
    private Long idCounter = 1L;

    public BookModel addBook(BookModel book) {
        book.setId(idCounter++);
        books.add(book);
        return book;
    }

    public List<BookModel> getBooks() {
        return books;
    }

}
