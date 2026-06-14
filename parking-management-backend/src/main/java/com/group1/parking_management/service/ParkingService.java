package com.group1.parking_management.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.group1.parking_management.dto.request.ParkingEntryRequest;
import com.group1.parking_management.dto.request.ParkingExitRequest;
import com.group1.parking_management.dto.response.TodayTrafficResponse;
import com.group1.parking_management.dto.response.ParkingEntryResponse;
import com.group1.parking_management.dto.response.ParkingExitResponse;
import com.group1.parking_management.dto.response.VehicleTypeResponse;
import com.group1.parking_management.entity.Account;
import com.group1.parking_management.entity.ParkingRecord;
import com.group1.parking_management.entity.ParkingRecordHistory;
import com.group1.parking_management.entity.Payment;

@Service
public interface ParkingService {
    ParkingEntryResponse registerEntry(ParkingEntryRequest request);
    public ParkingExitResponse processExit(ParkingExitRequest request);
    public List<ParkingEntryResponse> getAllRecordInParking();
    public ParkingEntryResponse updateCardId(String recordId, Integer newCardId);
    public ParkingRecordHistory recordToHistory(ParkingRecord record, Payment payment, Account staff);
    public List<VehicleTypeResponse> getAllVehicleType();
    public List<TodayTrafficResponse> getTodayTraffic();
    public List<ParkingExitResponse> getParkingHistoryByDate(int month, int day);
}
