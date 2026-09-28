import model.Fault;
import model.NetworkDevice;
import service.DatasetReader;
import service.FaultDetectionService;

import java.util.List;

public class Main {

    public static void main(String[] args) {

        String filePath = "data/network_dataset.csv";

        // Create required service objects
        DatasetReader reader = new DatasetReader();
        FaultDetectionService detector = new FaultDetectionService();

        // Read dataset
        List<NetworkDevice> devices =
                reader.readDataset(filePath);

        System.out.println("Total devices: " + devices.size());

        System.out.println("\n--- Fault Detection Results ---");

        int count = 0;

        // Analyze each device
        for (NetworkDevice device : devices) {

            Fault fault = detector.detectFault(device);

            // Display first 10 results
            if (count < 10) {

                System.out.println(
                        "Device " + fault.getDeviceId()
                        + " -> " + fault.getFaultType()
                        + " | Severity: " + fault.getSeverity()
                );
            }

            count++;
        }

        System.out.println(
                "\nTotal records processed: " + count
        );
    }
}