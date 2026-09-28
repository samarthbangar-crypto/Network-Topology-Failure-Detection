import com.sun.net.httpserver.HttpServer;

import model.Fault;
import model.NetworkDevice;
import model.TopologyNode;

import service.DatasetReader;
import service.FaultDetectionService;
import service.TopologyService;
import service.HealthScoreService;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;

public class ApiServer {

    public static void main(String[] args) throws Exception {

        DatasetReader reader = new DatasetReader();
        FaultDetectionService detector = new FaultDetectionService();
        TopologyService topologyService = new TopologyService();
        HealthScoreService healthScoreService =
                new HealthScoreService();

        List<NetworkDevice> devices =
                reader.readDataset("data/network_dataset.csv");

        HttpServer server =
                HttpServer.create(new InetSocketAddress(8080), 0);


        // ==============================
        // DEVICE API
        // ==============================

        server.createContext("/api/devices", exchange -> {

            String json = createJson(devices, detector);

            exchange.getResponseHeaders()
                    .set("Content-Type", "application/json");

            exchange.getResponseHeaders()
                    .set("Access-Control-Allow-Origin", "*");

            byte[] response = json.getBytes();

            exchange.sendResponseHeaders(200, response.length);

            try (OutputStream output = exchange.getResponseBody()) {
                output.write(response);
            }
        });


        // ==============================
        // TOPOLOGY API
        // ==============================

        server.createContext("/api/topology", exchange -> {

            List<TopologyNode> topology =
                    topologyService.createTopology(devices);

            String json = createTopologyJson(topology);

            exchange.getResponseHeaders()
                    .set("Content-Type", "application/json");

            exchange.getResponseHeaders()
                    .set("Access-Control-Allow-Origin", "*");

            byte[] response = json.getBytes();

            exchange.sendResponseHeaders(200, response.length);

            try (OutputStream output = exchange.getResponseBody()) {
                output.write(response);
            }
        });


        // ==============================
        // HEALTH SCORE API
        // ==============================

        server.createContext("/api/health", exchange -> {

            String json =
                    createHealthJson(
                            devices,
                            healthScoreService
                    );

            exchange.getResponseHeaders()
                    .set("Content-Type", "application/json");

            exchange.getResponseHeaders()
                    .set("Access-Control-Allow-Origin", "*");

            byte[] response = json.getBytes();

            exchange.sendResponseHeaders(200, response.length);

            try (OutputStream output = exchange.getResponseBody()) {
                output.write(response);
            }
        });


        // ==============================
        // START SERVER
        // ==============================

        server.start();

        System.out.println("API Server started.");

        System.out.println("Devices API:");
        System.out.println(
                "http://localhost:8080/api/devices"
        );

        System.out.println("Topology API:");
        System.out.println(
                "http://localhost:8080/api/topology"
        );

        System.out.println("Health API:");
        System.out.println(
                "http://localhost:8080/api/health"
        );
    }


    // ==========================================
    // CREATE DEVICE JSON
    // ==========================================

    private static String createJson(
            List<NetworkDevice> devices,
            FaultDetectionService detector) {

        StringBuilder json = new StringBuilder();

        json.append("[");

        for (int i = 0; i < devices.size(); i++) {

            NetworkDevice device = devices.get(i);

            Fault fault =
                    detector.detectFault(device);

            json.append("{");

            json.append("\"deviceId\":")
                    .append(device.getDeviceId())
                    .append(",");

            json.append("\"cpuUsage\":")
                    .append(device.getCpuUsage())
                    .append(",");

            json.append("\"memoryUsage\":")
                    .append(device.getMemoryUsage())
                    .append(",");

            json.append("\"batteryLevel\":")
                    .append(device.getBatteryLevel())
                    .append(",");

            json.append("\"temperature\":")
                    .append(device.getTemperature())
                    .append(",");

            json.append("\"networkLatency\":")
                    .append(device.getNetworkLatency())
                    .append(",");

            json.append("\"packetLoss\":")
                    .append(device.getPacketLoss())
                    .append(",");

            json.append("\"uptime\":")
                    .append(device.getUptime())
                    .append(",");

            json.append("\"workloadIntensity\":")
                    .append(device.getWorkloadIntensity())
                    .append(",");

            json.append("\"errorCount\":")
                    .append(device.getErrorCount())
                    .append(",");

            json.append("\"faultType\":\"")
                    .append(fault.getFaultType())
                    .append("\",");

            json.append("\"severity\":\"")
                    .append(fault.getSeverity())
                    .append("\",");

            json.append("\"message\":\"")
                    .append(fault.getMessage())
                    .append("\"");

            json.append("}");

            if (i < devices.size() - 1) {
                json.append(",");
            }
        }

        json.append("]");

        return json.toString();
    }


    // ==========================================
    // CREATE TOPOLOGY JSON
    // ==========================================

    private static String createTopologyJson(
            List<TopologyNode> topology) {

        StringBuilder json = new StringBuilder();

        json.append("[");

        for (int i = 0; i < topology.size(); i++) {

            TopologyNode node =
                    topology.get(i);

            json.append("{");

            json.append("\"deviceId\":")
                    .append(node.getDeviceId())
                    .append(",");

            json.append("\"status\":\"")
                    .append(node.getStatus())
                    .append("\",");

            json.append("\"faultType\":\"")
                    .append(node.getFaultType())
                    .append("\",");

            json.append("\"connectedDevices\":[");

            List<Integer> connections =
                    node.getConnectedDevices();

            for (int j = 0; j < connections.size(); j++) {

                json.append(connections.get(j));

                if (j < connections.size() - 1) {
                    json.append(",");
                }
            }

            json.append("]");

            json.append("}");

            if (i < topology.size() - 1) {
                json.append(",");
            }
        }

        json.append("]");

        return json.toString();
    }


    // ==========================================
    // CREATE HEALTH JSON
    // ==========================================

    private static String createHealthJson(
            List<NetworkDevice> devices,
            HealthScoreService healthService) {

        StringBuilder json = new StringBuilder();

        json.append("[");

        for (int i = 0; i < devices.size(); i++) {

            NetworkDevice device =
                    devices.get(i);

            int score =
                    healthService.calculateHealthScore(device);

            String status =
                    healthService.getHealthStatus(score);

            json.append("{");

            json.append("\"deviceId\":")
                    .append(device.getDeviceId())
                    .append(",");

            json.append("\"healthScore\":")
                    .append(score)
                    .append(",");

            json.append("\"healthStatus\":\"")
                    .append(status)
                    .append("\"");

            json.append("}");

            if (i < devices.size() - 1) {
                json.append(",");
            }
        }

        json.append("]");

        return json.toString();
    }
}