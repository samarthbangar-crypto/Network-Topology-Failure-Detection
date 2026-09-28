package service;

import model.NetworkDevice;

public class HealthScoreService {

    public int calculateHealthScore(NetworkDevice device) {

        double score = 100;

        // CPU usage penalty
        if (device.getCpuUsage() > 80) {
            score -= 20;
        } else if (device.getCpuUsage() > 60) {
            score -= 10;
        }

        // Memory usage penalty
        if (device.getMemoryUsage() > 80) {
            score -= 15;
        } else if (device.getMemoryUsage() > 60) {
            score -= 8;
        }

        // Battery penalty
        if (device.getBatteryLevel() < 20) {
            score -= 20;
        } else if (device.getBatteryLevel() < 40) {
            score -= 10;
        }

        // Network latency penalty
        if (device.getNetworkLatency() > 100) {
            score -= 15;
        } else if (device.getNetworkLatency() > 50) {
            score -= 8;
        }

        // Packet loss penalty
        if (device.getPacketLoss() > 5) {
            score -= 15;
        } else if (device.getPacketLoss() > 2) {
            score -= 8;
        }

        // Temperature penalty
        if (device.getTemperature() > 80) {
            score -= 20;
        } else if (device.getTemperature() > 60) {
            score -= 10;
        }

        // Error count penalty
        if (device.getErrorCount() > 10) {
            score -= 10;
        } else if (device.getErrorCount() > 5) {
            score -= 5;
        }

        // Keep score between 0 and 100
        if (score < 0) {
            score = 0;
        }

        if (score > 100) {
            score = 100;
        }

        return (int) score;
    }


    public String getHealthStatus(int score) {

        if (score >= 80) {
            return "Healthy";
        } else if (score >= 60) {
            return "Warning";
        } else {
            return "Critical";
        }
    }
}