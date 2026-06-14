package com.group1.parking_management.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.group1.parking_management.dto.ApiResponse;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<ApiResponse<Void>> handlingRuntimeException(RuntimeException exception) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.<Void>builder()
                        .code(ErrorCode.SYSTEM_INTERNAL_ERROR.getCode())
                        .message(ErrorCode.SYSTEM_INTERNAL_ERROR.getMessage())
                        .build());
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .message(exception.getMessage())
                        .build());
    }

    @ExceptionHandler(value = AuthorizationDeniedException.class)
    ResponseEntity<ApiResponse<Void>> handlingAuthorizationDeniedException(AuthorizationDeniedException exception) {
        ErrorCode errorCode = ErrorCode.AUTH_UNAUTHORIZED;
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleJsonParseException(HttpMessageNotReadableException exception) {
        ErrorCode errorCode = ErrorCode.ENUM_INVALID_VALUE;
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.<Void>builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handlingValidation(MethodArgumentNotValidException exception) {
        ErrorCode errorCode = ErrorCode.SYSTEM_UNKNOWN_ERROR;

        FieldError fieldError = exception.getFieldError();
        if (fieldError != null) {
            String enumKey = fieldError.getDefaultMessage();
            if (enumKey != null) {
                try {
                    errorCode = ErrorCode.valueOf(enumKey);
                } catch (IllegalArgumentException e) {
                    throw new AppException(errorCode);
                }
            }
        }
        ApiResponse<Void> apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }
}
