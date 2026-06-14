package com.group1.parking_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftConfigResponse {
    private int dayShiftStartHour;
    private int nightShiftStartHour;
    private int maxParkingCards;
}
