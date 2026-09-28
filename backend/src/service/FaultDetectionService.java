package service;

import model.Fault;
import model.NetworkDevice;

public class FaultDetectionService {

    public Fault detectFault(NetworkDevice device) {

        int failureType = device.getFailureType();

        switch (failureType) {

            case 0:
                return new Fault(
                        device.getDeviceId(),
                        "Normal",
                        "Low",
                        "Device is operating normally."
                );

            case 1:
                return new Fault(
                        device.getDeviceId(),
                        "Battery Failure",
                        "High",
                        "Battery failure detected."
                );

            case 2:
                return new Fault(
                        device.getDeviceId(),
                        "CPU Failure",
                        "High",
                        "CPU failure detected."
                );

            case 3:
                return new Fault(
                        device.getDeviceId(),
                        "Network Failure",
                        "High",
                        "Network failure detected."
                );

            case 4:
                return new Fault(
                        device.getDeviceId(),
                        "Overheat Failure",
                        "High",
                        "Overheating failure detected."
                );

            default:
                return new Fault(
                        device.getDeviceId(),
                        "Unknown",
                        "Medium",
                        "Unknown failure type."
                );
        }
    }
}