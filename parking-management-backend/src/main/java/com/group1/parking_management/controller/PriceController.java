package com.group1.parking_management.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.group1.parking_management.dto.ApiResponse;
import com.group1.parking_management.dto.request.ChangePriceRequest;
import com.group1.parking_management.dto.response.PriceResponse;
import com.group1.parking_management.service.PriceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/prices")
@RequiredArgsConstructor
public class PriceController {
    private final PriceService priceService;

    @GetMapping
    public ApiResponse<List<PriceResponse>> getAllPrice() {
        return ApiResponse.<List<PriceResponse>>builder()
                .result(priceService.getAllPrice())
                .build();
    }

    @PutMapping("{vehicleType}")
    @PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN mới được sửa bảng giá (nhân viên bị chặn)
    public ApiResponse<PriceResponse> updatePrice(@PathVariable String vehicleType, @RequestBody ChangePriceRequest request) {
        return ApiResponse.<PriceResponse>builder()
                .result(priceService.updatePrice(vehicleType, request))
                .build();
    }
}
