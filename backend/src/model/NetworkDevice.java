package model;

public class NetworkDevice {

    private int deviceId;
    private double cpuUsage;
    private double memoryUsage;
    private double batteryLevel;
    private double networkLatency;
    private double packetLoss;
    private double temperature;
    private double uptime;
    private int workloadIntensity;
    private int errorCount;
    private int failureType;

    public NetworkDevice(int deviceId,
                         double cpuUsage,
                         double memoryUsage,
                         double batteryLevel,
                         double networkLatency,
                         double packetLoss,
                         double temperature,
                         double uptime,
                         int workloadIntensity,
                         int errorCount,
                         int failureType) {

        this.deviceId = deviceId;
        this.cpuUsage = cpuUsage;
        this.memoryUsage = memoryUsage;
        this.batteryLevel = batteryLevel;
        this.networkLatency = networkLatency;
        this.packetLoss = packetLoss;
        this.temperature = temperature;
        this.uptime = uptime;
        this.workloadIntensity = workloadIntensity;
        this.errorCount = errorCount;
        this.failureType = failureType;
    }

    public int getDeviceId() {
        return deviceId;
    }

    public double getCpuUsage() {
        return cpuUsage;
    }

    public double getMemoryUsage() {
        return memoryUsage;
    }

    public double getBatteryLevel() {
        return batteryLevel;
    }

    public double getNetworkLatency() {
        return networkLatency;
    }

    public double getPacketLoss() {
        return packetLoss;
    }

    public double getTemperature() {
        return temperature;
    }

    public double getUptime() {
        return uptime;
    }

    public int getWorkloadIntensity() {
        return workloadIntensity;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public int getFailureType() {
        return failureType;
    }
}