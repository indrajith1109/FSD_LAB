package com.spring.microservice;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class BorrowService {
	private List<BorrowModel> records = new ArrayList<>();
    private Long idCounter = 1L;

    public BorrowModel issueBook(BorrowModel borrow) {
        borrow.setId(idCounter++);
        borrow.setIssueDate(LocalDate.now().toString());
        records.add(borrow);
        return borrow;
    }

    public BorrowModel returnBook(Long id) {
        for (BorrowModel b : records) {
            if (b.getId().equals(id)) {
                b.setReturnDate(LocalDate.now().toString());
                return b;
            }
        }
        return null;
    }

    public List<BorrowModel> getAll() {
        return records;
    }

}
