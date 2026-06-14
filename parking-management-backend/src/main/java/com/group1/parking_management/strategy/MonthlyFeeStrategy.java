package com.group1.parking_management.strategy;

import org.springframework.stereotype.Component;

import com.group1.parking_management.common.ParkingType;
import com.group1.parking_management.entity.ParkingRecord;

@Component
public class MonthlyFeeStrategy implements ParkingFeeStrategy {

    @Override
    public boolean supports(ParkingType type) {
        return type == ParkingType.MONTHLY;
    }

    @Override
    public int calculateFee(ParkingRecord record) {
        return 0; // Thẻ tháng miễn phí lượt gửi
    }
}
