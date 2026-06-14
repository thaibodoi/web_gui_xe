package com.group1.parking_management.util;

public class SystemLogger {
    private static SystemLogger instance;

    private SystemLogger() {
        // Private constructor để ngăn không cho tạo object từ bên ngoài
    }

    public static synchronized SystemLogger getInstance() {
        if (instance == null) {
            instance = new SystemLogger();
        }
        return instance;
    }

    public void log(String message) {
        System.out.println("[SYSTEM LOG] " + message);
    }
}
