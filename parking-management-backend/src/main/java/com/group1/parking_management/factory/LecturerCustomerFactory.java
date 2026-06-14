package com.group1.parking_management.factory;

import org.springframework.stereotype.Component;

import com.group1.parking_management.common.CustomerType;
import com.group1.parking_management.dto.request.MonthlyRegistrationRequest;
import com.group1.parking_management.entity.Customer;
import com.group1.parking_management.entity.LecturerInformation;
import com.group1.parking_management.repository.LecturerRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class LecturerCustomerFactory implements CustomerFactory {

    private final LecturerRepository lecturerRepository;

    @Override
    public boolean supports(CustomerType type) {
        return type == CustomerType.LECTURER;
    }

    @Override
    public void createCustomerInfo(Customer customer, MonthlyRegistrationRequest request) {
        lecturerRepository.save(LecturerInformation.builder()
                .customer(customer)
                .lecturerId(request.getLecturerId())
                .build());
    }
}
