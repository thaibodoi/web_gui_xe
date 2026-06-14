package com.group1.parking_management.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.group1.parking_management.dto.request.ShiftConfigRequest;
import com.group1.parking_management.dto.response.ShiftConfigResponse;
import com.group1.parking_management.entity.SystemConfig;
import com.group1.parking_management.entity.ParkingCard;
import com.group1.parking_management.repository.SystemConfigRepository;
import com.group1.parking_management.repository.ParkingCardRepository;
import com.group1.parking_management.service.ConfigService;
import java.util.ArrayList;
import java.util.List;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements ConfigService {
    
    private final SystemConfigRepository systemConfigRepository;
    private final ParkingCardRepository parkingCardRepository;
    
    private static final String DAY_SHIFT_KEY = "DAY_SHIFT_START_HOUR";
    private static final String NIGHT_SHIFT_KEY = "NIGHT_SHIFT_START_HOUR";
    private static final String MAX_PARKING_CARDS_KEY = "MAX_PARKING_CARDS";
    
    // Default values if not in database
    private static final int DEFAULT_DAY_SHIFT_START = 5;
    private static final int DEFAULT_NIGHT_SHIFT_START = 18;
    private static final int DEFAULT_MAX_PARKING_CARDS = 10000;

    @Override
    public ShiftConfigResponse getShiftConfig() {
        int dayStart = getIntConfig(DAY_SHIFT_KEY, DEFAULT_DAY_SHIFT_START);
        int nightStart = getIntConfig(NIGHT_SHIFT_KEY, DEFAULT_NIGHT_SHIFT_START);
        int maxCards = getIntConfig(MAX_PARKING_CARDS_KEY, DEFAULT_MAX_PARKING_CARDS);
        
        return ShiftConfigResponse.builder()
                .dayShiftStartHour(dayStart)
                .nightShiftStartHour(nightStart)
                .maxParkingCards(maxCards)
                .build();
    }

    @Override
    @Transactional
    public ShiftConfigResponse updateShiftConfig(ShiftConfigRequest request) {
        saveConfig(DAY_SHIFT_KEY, String.valueOf(request.getDayShiftStartHour()), "Giờ bắt đầu ca ngày (0-23)");
        saveConfig(NIGHT_SHIFT_KEY, String.valueOf(request.getNightShiftStartHour()), "Giờ bắt đầu ca đêm (0-23)");
        saveConfig(MAX_PARKING_CARDS_KEY, String.valueOf(request.getMaxParkingCards()), "Số lượng thẻ hệ thống tối đa");
        
        // Generate missing parking cards if limit is increased
        int currentMax = parkingCardRepository.findMaxCardId();
        int newMax = request.getMaxParkingCards();
        if (newMax > currentMax) {
            List<ParkingCard> newCards = new ArrayList<>();
            for (int i = currentMax + 1; i <= newMax; i++) {
                newCards.add(new ParkingCard(i));
            }
            parkingCardRepository.saveAll(newCards);
        }
        
        return getShiftConfig();
    }
    
    private int getIntConfig(String key, int defaultValue) {
        return systemConfigRepository.findById(key)
                .map(config -> {
                    try {
                        return Integer.parseInt(config.getValue());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }
    
    private void saveConfig(String key, String value, String description) {
        SystemConfig config = systemConfigRepository.findById(key)
                .orElse(SystemConfig.builder().key(key).build());
        
        config.setValue(value);
        config.setDescription(description);
        
        systemConfigRepository.save(config);
    }
}
