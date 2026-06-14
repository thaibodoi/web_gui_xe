package com.group1.parking_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingExitRequest {
    private String licensePlate;
    private String identifier;

    @jakarta.validation.constraints.NotNull
    @jakarta.validation.constraints.Min(1)
    @jakarta.validation.constraints.Max(1000)
    private Integer cardId;
}
