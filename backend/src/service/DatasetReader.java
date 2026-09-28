package service;

import model.NetworkDevice;
import util.CsvParser;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

public class DatasetReader {

    public List<NetworkDevice> readDataset(String filePath) {

        List<NetworkDevice> devices = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {

            // Skip header
            reader.readLine();

            String line;

            while ((line = reader.readLine()) != null) {

                String[] data = CsvParser.parseLine(line);

                NetworkDevice device = new NetworkDevice(
                        Integer.parseInt(data[0]),
                        Double.parseDouble(data[1]),
                        Double.parseDouble(data[2]),
                        Double.parseDouble(data[3]),
                        Double.parseDouble(data[4]),
                        Double.parseDouble(data[5]),
                        Double.parseDouble(data[6]),
                        Double.parseDouble(data[7]),
                        Integer.parseInt(data[8]),
                        Integer.parseInt(data[9]),
                        Integer.parseInt(data[10])
                );

                devices.add(device);
            }

        } catch (Exception e) {
            System.out.println("Error reading dataset: " + e.getMessage());
        }

        return devices;
    }
}