package com.group1.parking_management.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.group1.parking_management.common.ParkingType;
import com.group1.parking_management.entity.Account;
import com.group1.parking_management.entity.VehicleType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ParkingEntryResponse {
    private String recordId;
    private String licensePlate;
    private String identifier;
    private VehicleType vehicleType;
    private Integer cardId;
    private LocalDateTime entryTime;
    private ParkingType type;
    private Account staffIn;
}
