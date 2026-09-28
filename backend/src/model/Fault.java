package model;

public class Fault {

    private int deviceId;
    private String faultType;
    private String severity;
    private String message;

    public Fault(int deviceId, String faultType, String severity, String message) {
        this.deviceId = deviceId;
        this.faultType = faultType;
        this.severity = severity;
        this.message = message;
    }

    public int getDeviceId() {
        return deviceId;
    }

    public String getFaultType() {
        return faultType;
    }

    public String getSeverity() {
        return severity;
    }

    public String getMessage() {
        return message;
    }
}