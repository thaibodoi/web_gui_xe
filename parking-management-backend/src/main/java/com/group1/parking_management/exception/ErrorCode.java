package com.group1.parking_management.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    
    // Authentication & Authorization
    AUTH_INVALID_CREDENTIALS(1001, "Invalid username or password", HttpStatus.UNAUTHORIZED),
    AUTH_USERNAME_INVALID(1002,"Username must be at least 4 characters", HttpStatus.BAD_REQUEST),
    AUTH_PASSWORD_INVALID(1003, "Password must be at least 6 characters", HttpStatus.BAD_REQUEST),
    AUTH_EMAIL_INVALID(1004, "Email must be ended with '@gmail.com'", HttpStatus.BAD_REQUEST),
    AUTH_FORBIDDEN(1005, "Access denied", HttpStatus.FORBIDDEN),
    AUTH_UNAUTHENTICATED(1006, "Unauthenticated request", HttpStatus.UNAUTHORIZED),
    AUTH_UNAUTHORIZED(1007, "Unauthorized request", HttpStatus.FORBIDDEN),
    AUTH_WRONG_PASSWORD(1008, "Password is incorrect", HttpStatus.BAD_REQUEST),
    AUTH_PASSWORD_SAME_AS_OLD(1009, "New password must be different from the old password", HttpStatus.BAD_REQUEST),
    
    // Staff
    USERNAME_EXISTED(2001, "Username already exists", HttpStatus.BAD_REQUEST),
    STAFF_IDENTIFICATION_EXISTED(2002, "Identification already exists", HttpStatus.BAD_REQUEST),
    USERNAME_NOT_FOUND(2003, "User not found", HttpStatus.NOT_FOUND),
    STAFF_NOT_FOUND(2004, "Staff not found", HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(2005, "Role not found", HttpStatus.NOT_FOUND),

    //JWT (Token & Security)
    JWT_GENERATION_ERROR(3001, "Could not generate JWT token", HttpStatus.INTERNAL_SERVER_ERROR),
    JWT_INVALID(3002, "Invalid JWT token", HttpStatus.UNAUTHORIZED),
    JWT_EXPIRED(3003, "JWT token has expired", HttpStatus.UNAUTHORIZED),
    JWT_UNSUPPORTED(3004, "Unsupported JWT token", HttpStatus.BAD_REQUEST),

    // Parking Exception
    PARKING_IDENTIFICATION_ERROR(4001, "Vehicle must have license plate or identifier", HttpStatus.BAD_REQUEST),
    PARKING_VEHICLE_TYPE_NOT_FOUND(4002, "Vehicle type not found", HttpStatus.NOT_FOUND),
    PARKING_CARD_ID_INVALID(4003, "Card id invalid", HttpStatus.BAD_REQUEST),
    PARKING_CARD_NOT_FOUND(4004, "Parking card not found", HttpStatus.NOT_FOUND),
    PARKING_CARD_IN_USED(4005, "Parking card being used", HttpStatus.BAD_REQUEST),
    PARKING_LICENSE_PLATE_EXISTED(4006, "Lisence plate existed", HttpStatus.BAD_REQUEST),
    PARKING_IDENTIFIER_EXISTED(4007, "Identifier existed", HttpStatus.BAD_REQUEST),
    PARKING_RECORD_NOT_FOUND(4008, "Record not found", HttpStatus.NOT_FOUND),
    PARKING_PRICE_NOT_FOUND(4009, "Price not found", HttpStatus.NOT_FOUND),
    VEHICLE_BLACKLISTED(4010, "Vehicle is blacklisted due to missing report", HttpStatus.BAD_REQUEST),
    PARKING_CARD_LIMIT_IN_USE(4011, "Khong the giam gioi han: van con the vuot muc dang co xe do", HttpStatus.BAD_REQUEST),
    PARKING_CARD_EXCEEDS_LIMIT(4012, "Ma the vuot qua gioi han so the cua bai xe", HttpStatus.BAD_REQUEST),

    // Monthly Registration
    MONTHLY_CUSTOMER_TYPE_INVALID(5001, "Customer type invalid", HttpStatus.BAD_REQUEST),
    MONTHLY_VEHICLE_BEING_REGISTERED(5002, "Lisence plate is still registered", HttpStatus.BAD_REQUEST),
    MONTHLY_VEHICLE_TYPE_NOT_EQUALS_TO_RECORD(5003, "The vehicle type you choose not equals with vehicle type in record", HttpStatus.BAD_REQUEST),
    LECTURER_INPUT_ERROR(5004, "Lecturer must have lecturerId, and student fields must be empty", HttpStatus.BAD_REQUEST),
    STUDENT_INPUT_ERROR(5005, "Student must have studentId, faculty, major, classInfo, and lecturerId must be empty", HttpStatus.BAD_REQUEST),

    // Missing Report
    VEHICLE_NOT_IN_PARKING(6001, "Vehicle not in parking", HttpStatus.BAD_REQUEST),

    // Data error
    ENUM_INVALID_VALUE(8001, "Invalid enum", HttpStatus.BAD_REQUEST),

    // System error
    SYSTEM_INTERNAL_ERROR(9001, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    SYSTEM_UNKNOWN_ERROR(9999, "Unknown error", HttpStatus.INTERNAL_SERVER_ERROR);

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}
