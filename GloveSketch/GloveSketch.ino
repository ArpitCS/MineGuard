// Communication Libraries
#include <Wire.h>
#include <WiFi.h>

// Firebase Libraries
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Component Libraries
#include "MAX30100_PulseOximeter.h"
#include <OneWire.h>
#include <DallasTemperature.h>

// Wi-Fi Credentials
#define WIFI_SSID "A23"
#define WIFI_PASSWORD "ogum9009@"

// Firebase Credentials
#define API_KEY "AIzaSyDBqzSBXPemW9tjY3mtK8wu40Nc7var_Uw"
#define DATABASE_URL "https://mineguard-670af-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define USER_EMAIL "admin@mineguard.com"
#define USER_PASSWORD "admin@mineguard"

// Firebase and Sensor Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
PulseOximeter pox;
OneWire oneWireTemp(4);  // DS18B20 connected to pin 4
DallasTemperature tempProbe(&oneWireTemp);

// Time and Interval Definitions
unsigned long tempPrevMillis = 0;
unsigned long max30100RetryMillis = 0;
const unsigned long tempInterval = 15000;  // 15 seconds
const unsigned long max30100RetryInterval = 5000;  // 5 seconds

bool isMax30100Initialized = false;

void sendToFirebase(const String& path, float value) {
    if (Firebase.RTDB.setFloat(&fbdo, path, value)) {
        Serial.println(path + " sent to Firebase: " + String(value));
    } else {
        Serial.println("Failed to send " + path + " to Firebase");
        Serial.println("Reason: " + fbdo.errorReason());
    }
}

void initializeMax30100() {
    Serial.print("Attempting to initialize MAX30100...");
    if (pox.begin()) {
        Serial.println("SUCCESS");
        isMax30100Initialized = true;
        pox.setOnBeatDetectedCallback(onBeatDetected);
    } else {
        Serial.println("FAILED");
        isMax30100Initialized = false;
    }
}

void onBeatDetected() {
    Serial.println("Beat detected!");
    float heartRate = pox.getHeartRate();
    float spO2 = pox.getSpO2();

    // Only send values if heart rate is above 65 bpm and SpO2 is above 90%
    if (heartRate > 65 && spO2 > 90) {
        sendToFirebase("/Health/heartRate", heartRate);
        sendToFirebase("/Health/spO2", spO2);
    } else {
        Serial.println("Heart rate or SpO2 not within range, data not sent to Firebase");
    }
}

void setup() {
    // Serial and WiFi Setup
    Serial.begin(115200);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }
    Serial.println();
    Serial.print("Connected with IP: ");
    Serial.println(WiFi.localIP());

    // Firebase Initialization
    Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);
    config.api_key = API_KEY;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    config.database_url = DATABASE_URL;
    Firebase.reconnectNetwork(true);
    Firebase.begin(&config, &auth);

    // I2C and Temperature Sensor Initialization
    Wire.begin();
    Wire.setClock(100000);  // Set I2C clock for ESP32
    tempProbe.begin();
    Serial.println("Temperature sensor initialized!");

    // First attempt to initialize the MAX30100
    initializeMax30100();
}

void loop() {
    // Check and reinitialize MAX30100 sensor every 5 seconds if it's not initialized
    if (!isMax30100Initialized && (millis() - max30100RetryMillis >= max30100RetryInterval)) {
        max30100RetryMillis = millis();
        initializeMax30100();
    }

    // Update the pulse oximeter if it is initialized
    if (isMax30100Initialized) {
        pox.update();
    }

    unsigned long currentMillis = millis();

    // Temperature Sensor (15 seconds interval)
    if (Firebase.ready() && (currentMillis - tempPrevMillis >= tempInterval)) {
        tempPrevMillis = currentMillis;

        // Temperature Data Transfer to Firebase
        tempProbe.requestTemperatures();
        float bodyTempC = tempProbe.getTempCByIndex(0);
        if (!isnan(bodyTempC)) {
            sendToFirebase("/Health/bodyTemperature", bodyTempC);
        } else {
            Serial.println("Failed to read temperature from DS18B20 sensor");
        }
    }
}
