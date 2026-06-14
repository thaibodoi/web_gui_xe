package com.group1.parking_management.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.group1.parking_management.entity.ParkingRecord;

@Repository
public interface ParkingRecordRepository extends JpaRepository<ParkingRecord, String> {
    boolean existsByCard_CardId(Integer cardId);

    boolean existsByLicensePlate(String licensePlate);

    boolean existsByIdentifier(String identifier);

    Optional<ParkingRecord> findByLicensePlate(String licensePlate);

    Optional<ParkingRecord> findByIdentifier(String identifier);

    Optional<ParkingRecord> findByLicensePlateAndCard_CardId(String licensePlate, Integer cardId);

    Optional<ParkingRecord> findByIdentifierAndCard_CardId(String identifier, Integer cardId);

    List<ParkingRecord> findByEntryTimeBetween(LocalDateTime start, LocalDateTime end);

}
