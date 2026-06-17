package com.group1.parking_management.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group1.parking_management.dto.ApiResponse;
import com.group1.parking_management.dto.response.RevenueStatisticsResponse;
import com.group1.parking_management.dto.response.TrafficStatisticResponse;
import com.group1.parking_management.service.StatisticService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/statistic")
@PreAuthorize("hasRole('ADMIN')") // Chỉ ADMIN mới được xem thống kê (nhân viên bị chặn)
@RequiredArgsConstructor
public class StatisticController {
    private final StatisticService revenueService;

    @GetMapping("/revenue")
    public ApiResponse<RevenueStatisticsResponse> getMonthlyRevenue(@RequestParam int month, @RequestParam int year) {
        return ApiResponse.<RevenueStatisticsResponse>builder()
                .result(revenueService.getMonthlyRevenue(month, year))
                .build();
    }

    @GetMapping("/traffic")
    public ApiResponse<TrafficStatisticResponse> getMonthyTraffic(@RequestParam int month, @RequestParam int year) {
        return ApiResponse.<TrafficStatisticResponse>builder()
                .result(revenueService.getMonthlyTraffic(month, year))
                .build();
    }
}
