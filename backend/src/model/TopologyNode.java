package model;

import java.util.List;

public class TopologyNode {

    private int deviceId;
    private String status;
    private String faultType;
    private List<Integer> connectedDevices;

    public TopologyNode(
            int deviceId,
            String status,
            String faultType,
            List<Integer> connectedDevices) {

        this.deviceId = deviceId;
        this.status = status;
        this.faultType = faultType;
        this.connectedDevices = connectedDevices;
    }

    public int getDeviceId() {
        return deviceId;
    }

    public String getStatus() {
        return status;
    }

    public String getFaultType() {
        return faultType;
    }

    public List<Integer> getConnectedDevices() {
        return connectedDevices;
    }
}