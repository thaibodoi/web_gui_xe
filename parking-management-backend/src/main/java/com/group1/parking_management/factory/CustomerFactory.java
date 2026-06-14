package com.group1.parking_management.factory;

import com.group1.parking_management.common.CustomerType;
import com.group1.parking_management.dto.request.MonthlyRegistrationRequest;
import com.group1.parking_management.entity.Customer;

public interface CustomerFactory {
    boolean supports(CustomerType type);
    void createCustomerInfo(Customer customer, MonthlyRegistrationRequest request);
}
