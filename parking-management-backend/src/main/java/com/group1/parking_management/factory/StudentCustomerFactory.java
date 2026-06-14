package com.group1.parking_management.factory;

import org.springframework.stereotype.Component;

import com.group1.parking_management.common.CustomerType;
import com.group1.parking_management.dto.request.MonthlyRegistrationRequest;
import com.group1.parking_management.entity.Customer;
import com.group1.parking_management.entity.StudentInformation;
import com.group1.parking_management.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StudentCustomerFactory implements CustomerFactory {

    private final StudentRepository studentRepository;

    @Override
    public boolean supports(CustomerType type) {
        return type == CustomerType.STUDENT;
    }

    @Override
    public void createCustomerInfo(Customer customer, MonthlyRegistrationRequest request) {
        studentRepository.save(StudentInformation.builder()
                .customer(customer)
                .studentId(request.getStudentId())
                .faculty(request.getFaculty())
                .major(request.getMajor())
                .classInfo(request.getClassInfo())
                .build());
    }
}
