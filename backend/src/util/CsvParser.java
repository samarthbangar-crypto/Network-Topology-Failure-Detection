package util;

public class CsvParser {

    public static String[] parseLine(String line) {
        return line.split(",");
    }
}