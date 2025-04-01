// Communication Libraries
#include <Arduino.h>
#include <WiFi.h>

// Component Libraries
#include <DHT.h>

// Firebase Libraries
#include <Firebase_ESP_Client.h>

// Firebase Addons
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Wi-Fi Credentials
#define WIFI_SSID "A23"
#define WIFI_PASSWORD "ogum9009@"

// Database API and URL
#define API_KEY "AIzaSyDBqzSBXPemW9tjY3mtK8wu40Nc7var_Uw"
#define DATABASE_URL "https://mineguard-670af-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Authentication Credentials
#define USER_EMAIL "admin@mineguard.com"
#define USER_PASSWORD "admin@mineguard"

// Firebase Object Creation
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// PrevMillis for each sensor
unsigned long dhtPrevMillis = 0;
unsigned long mq9PrevMillis = 0;
unsigned long ldrPrevMillis = 0;
unsigned long helmetPrevMillis = 0;
unsigned long alertPrevMillis = 0;

// Check intervals (in milliseconds)
const unsigned long dhtInterval = 30000;  
const unsigned long mq9Interval = 30000;  
const unsigned long ldrInterval = 1000;   
const unsigned long helmetInterval = 1000;  
const unsigned long alertCheckInterval = 1000;

// Sensor and Pin Definitions
#define DHTPIN 33
#define DHTTYPE DHT11
#define MQ9PIN 32
#define LDRPIN 34
#define HELMETPIN 25
#define BUZZERPIN 26

// DHT Object
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Serial Communication
  Serial.begin(115200);

  // Wi-Fi Initialization
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Connecting to Wi-Fi
  Serial.print("Connecting to Wi-Fi");
  unsigned long ms = millis();
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  // Finished Connecting
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  // Initialize API Key
  config.api_key = API_KEY;

  // Authorize User
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // Initialize Database and Callback
  config.database_url = DATABASE_URL;

  Firebase.reconnectNetwork(true);

  // Firebase Begin
  Firebase.begin(&config, &auth);

  // DHT Start
  dht.begin();
  Serial.println("DHT Sensor Initialized!");

  // Pin Mode Initialization
  pinMode(HELMETPIN, INPUT_PULLUP);
  pinMode(BUZZERPIN, OUTPUT);
  Serial.println("Pin Modes Set!");
}

void loop() {
  unsigned long currentMillis = millis();

  // DHT11 and MQ9 Sensors (30 seconds interval)
  if (Firebase.ready() && (currentMillis - dhtPrevMillis >= dhtInterval)) {
    dhtPrevMillis = currentMillis;

    // DHT Sensor Data Transfer to Firebase
    float humidity = dht.readHumidity();
    float tempC = dht.readTemperature();
    if (!isnan(humidity) && !isnan(tempC)) {
      if (Firebase.RTDB.setFloat(&fbdo, "/DHT11/Humidity", humidity)) {
        Serial.println("Humidity Data Sent to Firebase: " + String(humidity));
      } else {
        Serial.println("Failed to Send Humidity Data to Firebase");
        Serial.println("Reason: " + fbdo.errorReason());
      }
      if (Firebase.RTDB.setFloat(&fbdo, "/DHT11/Temperature", tempC)) {
        Serial.println("Temperature Data Sent to Firebase: " + String(tempC));
      } else {
        Serial.println("Failed to Send Temperature Data to Firebase");
        Serial.println("Reason: " + fbdo.errorReason());
      }
    } else {
      Serial.println("Failed to Read Values from DHT Sensor");
    }

    // MQ9 Reading
    int MQ9_Value = analogRead(MQ9PIN);
    int MQ9_ValuePPM = MQ9_Value / 10;
    if (Firebase.RTDB.setInt(&fbdo, "/MQ9/Value", MQ9_ValuePPM)) {
      Serial.println("MQ9 Sensor Value Sent to Firebase: " + String(MQ9_ValuePPM));
    } else {
      Serial.println("Failed to Send MQ9 Sensor Value to Firebase");
      Serial.println("Reason: " + fbdo.errorReason());
    }

    // Control Buzzer
    MQ9_ValuePPM > 500 ? tone(BUZZERPIN, 400, 250) : noTone(BUZZERPIN);
    Serial.println(MQ9_ValuePPM > 200 ? "Buzzer turned ON" : "Buzzer turned OFF");
  }

  // LDR Sensor (5 seconds interval)
  if (Firebase.ready() && (currentMillis - ldrPrevMillis >= ldrInterval)) {
    ldrPrevMillis = currentMillis;

    // LDR Reading
    int LDR_Value = analogRead(LDRPIN);
    Serial.println(LDR_Value);
    bool lampStatus = LDR_Value < 700;
    if (Firebase.RTDB.setBool(&fbdo, "/LDR/LampStatus", lampStatus)) {
      Serial.println("LDR Sensor Value Sent to Firebase: " + String(lampStatus));
    } else {
      Serial.println("Failed to Send LDR Sensor Value to Firebase");
      Serial.println("Reason: " + fbdo.errorReason());
    }
  }

  // Helmet Status (5 seconds interval)
  if (Firebase.ready() && (currentMillis - helmetPrevMillis >= helmetInterval)) {
    helmetPrevMillis = currentMillis;

    bool helmetStatus = !digitalRead(HELMETPIN);
    if (Firebase.RTDB.setBool(&fbdo, "/Helmet/Status", helmetStatus)) {
      Serial.println("Helmet Status Sent to Firebase: " + String(helmetStatus));
    } else {
      Serial.println("Failed to Send Helmet Status to Firebase");
      Serial.println("Reason: " + fbdo.errorReason());
    }
  }

  // Check for Alert Status (every second)
  if (Firebase.ready() && (currentMillis - alertPrevMillis >= alertCheckInterval)) {
    alertPrevMillis = currentMillis;
    
    if (Firebase.RTDB.getBool(&fbdo, "/alertStatus")) {
      bool alertStatus = fbdo.boolData();
      if (alertStatus) {
        tone(BUZZERPIN, 1000);  // Turn on buzzer
        delay(5000);             // Wait for 5 seconds
        noTone(BUZZERPIN);       // Turn off buzzer

        // Reset alertStatus to false in Firebase
        Firebase.RTDB.setBool(&fbdo, "/alertStatus", false);
        Serial.println("Alert triggered and reset in Firebase");
      }
    } else {
      Serial.println("Failed to read alertStatus");
      Serial.println("Reason: " + fbdo.errorReason());
    }
  }
}
