package com.group1.parking_management.strategy;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.group1.parking_management.common.ParkingType;
import com.group1.parking_management.entity.ParkingRecord;
import com.group1.parking_management.entity.Price;
import com.group1.parking_management.exception.AppException;
import com.group1.parking_management.exception.ErrorCode;
import com.group1.parking_management.repository.PriceRepository;
import com.group1.parking_management.service.ConfigService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DailyFeeStrategy implements ParkingFeeStrategy {

    private final PriceRepository priceRepository;
    private final ConfigService configService;

    @Override
    public boolean supports(ParkingType type) {
        return type == ParkingType.DAILY;
    }

    @Override
    public int calculateFee(ParkingRecord record) {
        Price price = priceRepository.findById(record.getVehicleType().getId())
                .orElseThrow(() -> new AppException(ErrorCode.PARKING_PRICE_NOT_FOUND));
        LocalDateTime entryTime = record.getEntryTime();
        LocalDateTime exitTime = LocalDateTime.now();
        Duration duration = Duration.between(entryTime, exitTime);

        long fullDays = duration.toDays();
        int fee = (int) (fullDays * (price.getDayPrice() + price.getNightPrice()));
        
        Duration remainingDuration = duration.minusDays(fullDays);
        
        if (remainingDuration.toMinutes() > 0 || fullDays == 0) {
            LocalDateTime remainingEntry = entryTime.plusDays(fullDays);
            int remainFee = 0;
            
            boolean isDayTimeEntry = remainingEntry.getHour() >= configService.getShiftConfig().getDayShiftStartHour() 
                    && remainingEntry.getHour() < configService.getShiftConfig().getNightShiftStartHour();
            boolean isDayTimeExit = exitTime.getHour() >= configService.getShiftConfig().getDayShiftStartHour() 
                    && exitTime.getHour() < configService.getShiftConfig().getNightShiftStartHour();
            boolean isSameDay = remainingEntry.toLocalDate().equals(exitTime.toLocalDate());
            
            if (isSameDay) {
                if (isDayTimeEntry && isDayTimeExit) {
                    remainFee = price.getDayPrice();
                } else if (!isDayTimeEntry && !isDayTimeExit) {
                    remainFee = price.getNightPrice();
                } else {
                    remainFee = price.getDayPrice() + price.getNightPrice();
                }
            } else {
                int dayLength = configService.getShiftConfig().getNightShiftStartHour() - configService.getShiftConfig().getDayShiftStartHour();
                if (dayLength < 0) dayLength += 24;
                
                if (!isDayTimeEntry && !isDayTimeExit && remainingDuration.toHours() < (24 - dayLength)) {
                    remainFee = price.getNightPrice();
                } else {
                    remainFee = price.getDayPrice() + price.getNightPrice();
                }
            }
            
            fee += remainFee;
        }

        return fee;
    }
}
