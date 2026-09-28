package service;

import model.Fault;
import model.NetworkDevice;
import model.TopologyNode;

import java.util.ArrayList;
import java.util.List;

public class TopologyService {

    private FaultDetectionService faultDetectionService;

    public TopologyService() {
        faultDetectionService = new FaultDetectionService();
    }

    public List<TopologyNode> createTopology(
            List<NetworkDevice> devices) {

        List<TopologyNode> topology = new ArrayList<>();

        int limit = Math.min(devices.size(), 20);

        for (int i = 0; i < limit; i++) {

            NetworkDevice device = devices.get(i);

            Fault fault =
                    faultDetectionService.detectFault(device);

            String status;

            if (fault.getFaultType().equals("Normal")) {
                status = "Normal";
            } else {
                status = "Failed";
            }

            List<Integer> connectedDevices =
                    new ArrayList<>();

            if (i > 0) {
                connectedDevices.add(
                        devices.get(i - 1).getDeviceId()
                );
            }

            if (i < limit - 1) {
                connectedDevices.add(
                        devices.get(i + 1).getDeviceId()
                );
            }

            TopologyNode node = new TopologyNode(
                    device.getDeviceId(),
                    status,
                    fault.getFaultType(),
                    connectedDevices
            );

            topology.add(node);
        }

        return topology;
    }
}