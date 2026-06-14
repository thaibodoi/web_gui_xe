package com.group1.parking_management.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftConfigRequest {
    private int dayShiftStartHour;
    private int nightShiftStartHour;
    private int maxParkingCards;
}
