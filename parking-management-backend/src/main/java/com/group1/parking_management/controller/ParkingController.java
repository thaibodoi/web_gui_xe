package com.group1.parking_management.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group1.parking_management.dto.ApiResponse;
import com.group1.parking_management.dto.request.ParkingEntryRequest;
import com.group1.parking_management.dto.request.ParkingExitRequest;
import com.group1.parking_management.dto.request.UpdateCardRequest;
import com.group1.parking_management.dto.response.TodayTrafficResponse;
import com.group1.parking_management.dto.response.ParkingEntryResponse;
import com.group1.parking_management.dto.response.ParkingExitResponse;
import com.group1.parking_management.dto.response.VehicleTypeResponse;
import com.group1.parking_management.service.ParkingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/parking")
@RequiredArgsConstructor
public class ParkingController {
    private final ParkingService parkingService;

    @PostMapping("/entry")
    public ApiResponse<ParkingEntryResponse> registerEntry(@RequestBody ParkingEntryRequest request) {
        return ApiResponse.<ParkingEntryResponse>builder()
                .result(parkingService.registerEntry(request))
                .build();
    }

    @PostMapping("/exit")
    public ApiResponse<ParkingExitResponse> registerExit(@RequestBody ParkingExitRequest request) {
        return ApiResponse.<ParkingExitResponse>builder()
                .result(parkingService.processExit(request))
                .build();
    }

    @GetMapping("/records")
    public ApiResponse<List<ParkingEntryResponse>> getAllRecordInParking() {
        return ApiResponse.<List<ParkingEntryResponse>>builder()
                .result(parkingService.getAllRecordInParking())
                .build();
    }

    @PutMapping("/records/{recordId}/card")
    public ApiResponse<ParkingEntryResponse> updateCardId(
            @PathVariable String recordId, 
            @RequestBody UpdateCardRequest request) {
        return ApiResponse.<ParkingEntryResponse>builder()
                .result(parkingService.updateCardId(recordId, request.getNewCardId()))
                .build();
    }

    @GetMapping("/vehicle-types")
    public ApiResponse<List<VehicleTypeResponse>> getAllVehicleType() {
        return ApiResponse.<List<VehicleTypeResponse>>builder()
                .result(parkingService.getAllVehicleType())
                .build();
    }

    @GetMapping("/today")
    public ApiResponse<List<TodayTrafficResponse>> getTodayTraffic() {
        return ApiResponse.<List<TodayTrafficResponse>>builder()
                .result(parkingService.getTodayTraffic())
                .build();
    }

    @GetMapping("/record-history")
    public ApiResponse<List<ParkingExitResponse>> getParkingHistoryByDate(@RequestParam int month,
            @RequestParam int day) {
        return ApiResponse.<List<ParkingExitResponse>>builder()
                .result(parkingService.getParkingHistoryByDate(month, day))
                .build();
    }
}
