package com.group1.parking_management.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCardRequest {
    @NotNull(message = "Card ID must not be null")
    @Min(value = 1, message = "Card ID must be between 1 and 1000")
    @Max(value = 1000, message = "Card ID must be between 1 and 1000")
    private Integer newCardId;
}
