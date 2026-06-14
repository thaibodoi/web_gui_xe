package com.group1.parking_management.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingEntryRequest {

    @Size(max = 20)
    private String licensePlate;

    @Size(max = 50)
    private String identifier;

    @NotNull(message = "Card ID must not be null")
    @jakarta.validation.constraints.Min(value = 1, message = "Card ID must be between 1 and 1000")
    @jakarta.validation.constraints.Max(value = 1000, message = "Card ID must be between 1 and 1000")
    private Integer cardId;

    @NotNull
    private String vehicleTypeId;

}
