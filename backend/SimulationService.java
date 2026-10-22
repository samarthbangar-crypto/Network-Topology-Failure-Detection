
package com.netguard;

import java.util.LinkedHashMap;
import java.util.Map;

public class SimulationService {

    public Map<String, Object> simulate(
            double cpu,
            double memory,
            double battery,
            double latency,
            double packetLoss,
            double temperature,
            int errors) {

        Map<String, Object> result = new LinkedHashMap<>();

        // Basic input validation
        if (cpu < 0 || cpu > 100 ||
            memory < 0 || memory > 100 ||
            battery < 0 || battery > 100 ||
            latency < 0 ||
            packetLoss < 0 || packetLoss > 100 ||
            temperature < -50 || temperature > 200 ||
            errors < 0) {
            throw new IllegalArgumentException(
                "Invalid metric values."
            );
        }

        int risk = 0;
        StringBuilder evidence = new StringBuilder();

        if (cpu >= 90) {
            risk += 25;
            evidence.append("Critical CPU usage; ");
        } else if (cpu >= 75) {
            risk += 12;
            evidence.append("High CPU usage; ");
        }

        if (memory >= 90) {
            risk += 15;
            evidence.append("Critical memory usage; ");
        }

        if (battery <= 15) {
            risk += 20;
            evidence.append("Low battery; ");
        }

        if (latency >= 200) {
            risk += 20;
            evidence.append("High network latency; ");
        }

        if (packetLoss >= 5) {
            risk += 25;
            evidence.append("High packet loss; ");
        }

        if (temperature >= 85) {
            risk += 25;
            evidence.append("High temperature; ");
        }

        if (errors >= 10) {
            risk += 15;
            evidence.append("High error count; ");
        }

        risk = Math.min(risk, 100);

        String severity;
        if (risk >= 60) {
            severity = "CRITICAL";
        } else if (risk >= 30) {
            severity = "WARNING";
        } else {
            severity = "HEALTHY";
        }

        String diagnosis = "No major threshold exceeded.";
        String recommendation = "Continue monitoring.";

        if (packetLoss >= 5 || latency >= 200) {
            diagnosis = "Possible network degradation";
            recommendation =
                "Inspect network links and traffic congestion.";
        } else if (temperature >= 85) {
            diagnosis = "Possible overheating";
            recommendation =
                "Check cooling and device ventilation.";
        } else if (cpu >= 90) {
            diagnosis = "Possible CPU overload";
            recommendation =
                "Inspect workload and CPU-intensive processes.";
        } else if (battery <= 15) {
            diagnosis = "Low battery condition";
            recommendation =
                "Recharge or inspect the device power supply.";
        } else if (memory >= 90) {
            diagnosis = "Possible memory pressure";
            recommendation =
                "Inspect memory consumption and running processes.";
        } else if (errors >= 10) {
            diagnosis = "Elevated error count";
            recommendation =
                "Inspect device logs and error sources.";
        }

        result.put("riskScore", risk);
        result.put("severity", severity);
        result.put("diagnosis", diagnosis);
        result.put("recommendation", recommendation);
        result.put("evidence",
            evidence.length() == 0
                ? "No configured warning thresholds exceeded."
                : evidence.toString());

        return result;
    }
}
