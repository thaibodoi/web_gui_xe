package com.group1.parking_management.strategy;

import com.group1.parking_management.common.ParkingType;
import com.group1.parking_management.entity.ParkingRecord;

public interface ParkingFeeStrategy {
    boolean supports(ParkingType type);
    int calculateFee(ParkingRecord record);
}
