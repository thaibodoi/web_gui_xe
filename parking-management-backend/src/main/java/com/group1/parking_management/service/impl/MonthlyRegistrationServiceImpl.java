package com.group1.parking_management.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group1.parking_management.common.CustomerType;
import com.group1.parking_management.common.PaymentType;
import com.group1.parking_management.dto.request.MonthlyRegistrationRequest;
import com.group1.parking_management.dto.response.MonthlyRegistrationResponse;
import com.group1.parking_management.entity.Account;
import com.group1.parking_management.entity.ActiveMonthlyRegistration;
import com.group1.parking_management.entity.Customer;
import com.group1.parking_management.entity.LecturerInformation;
import com.group1.parking_management.entity.Payment;
import com.group1.parking_management.entity.Price;
import com.group1.parking_management.entity.StudentInformation;
import com.group1.parking_management.entity.Vehicle;
import com.group1.parking_management.entity.VehicleType;
import com.group1.parking_management.exception.AppException;
import com.group1.parking_management.exception.ErrorCode;
import com.group1.parking_management.mapper.MonthlyRegistrationMapper;
import com.group1.parking_management.repository.AccountRepository;
import com.group1.parking_management.repository.ActiveMonthlyRegistrationRepository;
import com.group1.parking_management.repository.CustomerRepository;
import com.group1.parking_management.repository.ExpireMonthlyRegistrationRepository;
import com.group1.parking_management.repository.LecturerRepository;
import com.group1.parking_management.repository.PaymentRepository;
import com.group1.parking_management.repository.PriceRepository;
import com.group1.parking_management.repository.StudentRepository;
import com.group1.parking_management.repository.VehicleRepository;
import com.group1.parking_management.repository.VehicleTypeRepository;
import com.group1.parking_management.service.MonthlyRegistrationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.group1.parking_management.factory.CustomerFactory;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyRegistrationServiceImpl implements MonthlyRegistrationService {
    private final ActiveMonthlyRegistrationRepository activeMonthlyRegistrationRepository;
    private final ExpireMonthlyRegistrationRepository expireMonthlyRegistrationRepository;
    private final AccountRepository accountRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final VehicleRepository vehicleRepository;
    private final PriceRepository priceRepository;
    private final CustomerRepository customerRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final MonthlyRegistrationMapper monthlyRegistrationMapper;
    private final List<CustomerFactory> customerFactories;

    @Override
    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public MonthlyRegistrationResponse createMonthlyRegistration(MonthlyRegistrationRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Account staff = accountRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.STAFF_NOT_FOUND));

        VehicleType vehicleType = vehicleTypeRepository.findById(request.getVehicleTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.PARKING_VEHICLE_TYPE_NOT_FOUND));
        if (activeMonthlyRegistrationRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new AppException(ErrorCode.MONTHLY_VEHICLE_BEING_REGISTERED);
        }
        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .licensePlate(request.getLicensePlate())
                .type(vehicleType)
                .brand(request.getBrand())
                .color(request.getColor())
                .build());

        Customer customer = customerRepository.save(Customer.builder()
                .customerType(request.getCustomerType())
                .name(request.getName())
                .gender(request.getGender())
                .dob(request.getDob())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .email(request.getEmail())
                .build());

        customerFactories.stream()
                .filter(factory -> factory.supports(request.getCustomerType()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SYSTEM_INTERNAL_ERROR))
                .createCustomerInfo(customer, request);

        Price price = priceRepository.findById(vehicleType.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PARKING_PRICE_NOT_FOUND));
        int fee = price.getMonthlyPrice() * request.getDurationInMonths();
        LocalDateTime issueDate = LocalDateTime.now();
        LocalDateTime expireDate = issueDate.plusMonths(request.getDurationInMonths());

        Payment payment = paymentRepository.save(Payment.builder()
                .amount(fee)
                .createAt(issueDate)
                .paymentType(PaymentType.MONTHLY)
                .build());

        ActiveMonthlyRegistration activeMonthlyRegistration = ActiveMonthlyRegistration.builder()
                .issueDate(issueDate)
                .expirationDate(expireDate)
                .vehicle(vehicle)
                .customer(customer)
                .createBy(staff)
                .payment(payment)
                .build();
        activeMonthlyRegistrationRepository.save(activeMonthlyRegistration);
        return monthlyRegistrationMapper.activeToResponse(activeMonthlyRegistration);
    }

    @Override
    public List<MonthlyRegistrationResponse> getAllActiveRegistration() {
        return activeMonthlyRegistrationRepository.findAllByOrderByIssueDateDesc().stream()
                .map(monthlyRegistrationMapper::activeToResponse).toList();
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public List<MonthlyRegistrationResponse> getAllExpireRegistration() {
        return expireMonthlyRegistrationRepository.findAllByOrderByIssueDateDesc().stream()
                .map(monthlyRegistrationMapper::expireToResponse).toList();
    }

}
