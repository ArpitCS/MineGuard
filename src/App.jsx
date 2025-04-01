import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// Icons
import HelmetIcon from './components/HelmetIcon';
import GloveIcon from './components/GloveIcon';
import { FaTemperatureHigh, FaHeartbeat, FaTint, FaWind, FaLightbulb, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { FaMaskVentilator } from 'react-icons/fa6';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBqzSBXPemW9tjY3mtK8wu40Nc7var_Uw",
  authDomain: "mineguard-670af.firebaseapp.com",
  databaseURL:
    "https://mineguard-670af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mineguard-670af",
  storageBucket: "mineguard-670af.firebasestorage.app",
  messagingSenderId: "398115897293",
  appId: "1:398115897293:web:2f37c610d83bb6f9358e84",
  measurementId: "G-WD2XFK3W2V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  // Health monitoring data
  const [healthData, setHealthData] = useState({
    heartRate: 0,
    spO2: 0,
    bodyTemperature: 0,
  });

  // Environmental data
  const [envData, setEnvData] = useState({
    humidity: 0,
    temperature: 0,
    gasLevel: 0,
  });

  // Safety status
  const [safetyData, setSafetyData] = useState({
    helmetStatus: false,
    lampStatus: false,
  });

  // Historical data for charts
  const [healthHistory, setHealthHistory] = useState([]);
  const [envHistory, setEnvHistory] = useState([]);
  const [gasHistory, setGasHistory] = useState([]);

  // Miner information
  const [minerInfo, setMinerInfo] = useState({
    name: "Sajal garg",
    id: "MG-7845",
    shift: "Morning",
    location: "Sector B-12",
  });

  // Alert control
  const [alertStatus, setAlertStatus] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  // Refs
  const healthChartRef = useRef(null);

  useEffect(() => {
    // Health data listeners
    const healthRef = ref(database, '/Health');
    onValue(healthRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newHealthData = {
          heartRate: data.heartRate || 0,
          spO2: data.spO2 || 0,
          bodyTemperature: data.bodyTemperature || 0,
        };
        
        setHealthData(newHealthData);
        
        // Add to history with timestamp
        const timestamp = new Date().toLocaleTimeString();
        setHealthHistory(prev => {
          const newHistory = [...prev, { timestamp, ...newHealthData }];
          // Keep only last 10 records
          return newHistory.slice(-10);
        });
      }
    });

    // Environmental data listeners
    const humidityRef = ref(database, '/DHT11/Humidity');
    const tempRef = ref(database, '/DHT11/Temperature');
    const gasRef = ref(database, '/MQ9/Value');

    onValue(humidityRef, (snapshot) => {
      const humidity = snapshot.val();
      if (humidity !== null) {
        setEnvData(prev => {
          const updated = { ...prev, humidity };
          
          // Add to environment history
          const timestamp = new Date().toLocaleTimeString();
          setEnvHistory(prevHistory => {
            const newHistory = [...prevHistory, { 
              timestamp, 
              humidity: updated.humidity, 
              temperature: updated.temperature 
            }];
            return newHistory.slice(-10);
          });
          
          return updated;
        });
      }
    });

    onValue(tempRef, (snapshot) => {
      const temperature = snapshot.val();
      if (temperature !== null) {
        setEnvData(prev => {
          const updated = { ...prev, temperature };
          return updated;
        });
      }
    });

    onValue(gasRef, (snapshot) => {
      const gasLevel = snapshot.val();
      if (gasLevel !== null) {
        setEnvData(prev => {
          const updated = { ...prev, gasLevel };
          
          // Add to gas history
          const timestamp = new Date().toLocaleTimeString();
          setGasHistory(prevHistory => {
            const newHistory = [...prevHistory, { timestamp, gasLevel: updated.gasLevel }];
            return newHistory.slice(-10);
          });
          
          return updated;
        });
      }
    });

    // Safety status listeners
    const helmetRef = ref(database, '/Helmet/Status');
    const lampRef = ref(database, '/LDR/LampStatus');

    onValue(helmetRef, (snapshot) => {
      const helmetStatus = snapshot.val();
      if (helmetStatus !== null) {
        setSafetyData(prev => ({ ...prev, helmetStatus }));
      }
    });

    onValue(lampRef, (snapshot) => {
      const lampStatus = snapshot.val();
      if (lampStatus !== null) {
        setSafetyData(prev => ({ ...prev, lampStatus }));
      }
    });

    // Alert status listener
    const alertRef = ref(database, '/alertStatus');
    onValue(alertRef, (snapshot) => {
      const status = snapshot.val();
      if (status !== null) {
        setAlertStatus(status);
      }
    });
  }, []);

  // Function to trigger alert
  const triggerAlert = () => {
    set(ref(database, '/alertStatus'), true);
    setAlertStatus(true);
    setShowAlertModal(true);
    
    // Auto-close alert modal after 5 seconds
    setTimeout(() => {
      setShowAlertModal(false);
    }, 5000);
  };

  // Determine status warnings
  const isHeartRateNormal = healthData.heartRate >= 60 && healthData.heartRate <= 100;
  const isSpO2Normal = healthData.spO2 >= 95;
  const isBodyTempNormal = healthData.bodyTemperature >= 36.1 && healthData.bodyTemperature <= 37.2;
  const isGasLevelSafe = envData.gasLevel < 200;
  
  // Calculate overall health and safety scores
  const healthScore = [
    isHeartRateNormal ? 33.3 : 0, 
    isSpO2Normal ? 33.3 : 0, 
    isBodyTempNormal ? 33.4 : 0
  ].reduce((sum, val) => sum + val, 0);
  
  const safetyScore = [
    isGasLevelSafe ? 34 : 0,
    safetyData.helmetStatus ? 33 : 0,
    safetyData.lampStatus ? 33 : 0
  ].reduce((sum, val) => sum + val, 0);
  
  return (
    <div className="dashboard">
      {/* Top navigation bar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">⛑️</span>
          <h1>MineGuard</h1>
        </div>
        <div className="nav-links">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link">Reports</button>
          <button className="nav-link">Settings</button>
        </div>
        <div className="user-profile">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-info">
            <span>{minerInfo.name}</span>
            <small>Miner ID: {minerInfo.id}</small>
          </div>
        </div>
      </nav>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="alert-modal">
          <div className="alert-modal-content">
            <FaExclamationTriangle size={48} />
            <h2>Emergency Alert Triggered</h2>
            <p>Alert signal has been sent to the miner's device.</p>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Summary row */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-header">
              <h3>Miner Info</h3>
            </div>
            <div className="miner-details">
              <div className="miner-avatar">
                <FaUser size={32} />
              </div>
              <div className="miner-info">
                <p><strong>Name:</strong> {minerInfo.name}</p>
                <p><strong>ID:</strong> {minerInfo.id}</p>
                <p><strong>Shift:</strong> {minerInfo.shift}</p>
                <p><strong>Location:</strong> {minerInfo.location}</p>
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-header">
              <h3>Equipment Status</h3>
            </div>
            <div className="equipment-status">
              <div className="equipment-item">
                <div className={`equipment-icon ${safetyData.helmetStatus ? 'active' : 'inactive'}`}>
                  <HelmetIcon active={safetyData.helmetStatus} />
                </div>
                <p>Safety Helmet</p>
              </div>
              <div className="equipment-item">
                <div className={`equipment-icon ${healthData.heartRate > 0 ? 'active' : 'inactive'}`}>
                  <GloveIcon active={healthData.heartRate > 0} />
                </div>
                <p>Health Monitor</p>
              </div>
              <div className="equipment-item">
                <div className={`equipment-icon ${safetyData.lampStatus ? 'active' : 'inactive'}`}>
                  <FaLightbulb size={24} />
                </div>
                <p>Mining Lamp</p>
              </div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button className="action-button primary">Check-In</button>
              <button 
                className="action-button danger"
                onClick={triggerAlert}
                disabled={alertStatus}
              >
                {alertStatus ? "Alert Sent" : "Emergency Alert"}
              </button>
              <button className="action-button secondary">Request Break</button>
            </div>
          </div>
        </div>

        {/* First row - Health and Safety Score */}
        <div className="score-row">
          <div className={`score-card ${healthScore > 80 ? 'good' : healthScore > 40 ? 'warning' : 'danger'}`}>
            <div className="score-info">
              <h3>Health Status</h3>
              <div className="score-value">{healthScore.toFixed(0)}%</div>
            </div>
            <div className="score-gauge">
              <div className="gauge-background"></div>
              <div className="gauge-fill" style={{ width: `${healthScore}%` }}></div>
            </div>
          </div>
          
          <div className={`score-card ${safetyScore > 80 ? 'good' : safetyScore > 40 ? 'warning' : 'danger'}`}>
            <div className="score-info">
              <h3>Safety Status</h3>
              <div className="score-value">{safetyScore.toFixed(0)}%</div>
            </div>
            <div className="score-gauge">
              <div className="gauge-background"></div>
              <div className="gauge-fill" style={{ width: `${safetyScore}%` }}></div>
            </div>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="dashboard-grid">
          {/* Health Section */}
          <section className="dashboard-section health-section">
            <h2>Health Monitoring</h2>
            <div className="dashboard-cards">
              <div className={`dashboard-card ${isHeartRateNormal ? 'normal' : 'warning'}`}>
                <div className="card-icon">
                  <FaHeartbeat />
                </div>
                <h3>Heart Rate</h3>
                <p className="card-value">{healthData.heartRate.toFixed(1)} <span>BPM</span></p>
                <p className="card-status">{isHeartRateNormal ? 'Normal' : 'Warning'}</p>
              </div>
              
              <div className={`dashboard-card ${isSpO2Normal ? 'normal' : 'warning'}`}>
                <div className="card-icon">
                  <FaTint />
                </div>
                <h3>SpO2</h3>
                <p className="card-value">{healthData.spO2.toFixed(1)} <span>%</span></p>
                <p className="card-status">{isSpO2Normal ? 'Normal' : 'Warning'}</p>
              </div>
              
              <div className={`dashboard-card ${isBodyTempNormal ? 'normal' : 'warning'}`}>
                <div className="card-icon">
                  <FaTemperatureHigh />
                </div>
                <h3>Body Temperature</h3>
                <p className="card-value">{healthData.bodyTemperature.toFixed(1)} <span>°C</span></p>
                <p className="card-status">{isBodyTempNormal ? 'Normal' : 'Warning'}</p>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Health Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={healthHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  ref={healthChartRef}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" orientation="left" domain={[40, 120]} />
                  <YAxis yAxisId="right" orientation="right" domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#e74c3c"
                    activeDot={{ r: 8 }}
                    name="Heart Rate (BPM)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="spO2"
                    stroke="#3498db"
                    name="SpO2 (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          
          {/* Environment Section */}
          <section className="dashboard-section environment-section">
            <h2>Environment Monitoring</h2>
            <div className="dashboard-cards">
              <div className="dashboard-card normal">
                <div className="card-icon">
                  <FaTint />
                </div>
                <h3>Humidity</h3>
                <p className="card-value">{envData.humidity.toFixed(1)} <span>%</span></p>
              </div>
              
              <div className="dashboard-card normal">
                <div className="card-icon">
                  <FaTemperatureHigh />
                </div>
                <h3>Temperature</h3>
                <p className="card-value">{envData.temperature.toFixed(1)} <span>°C</span></p>
              </div>
              
              <div className={`dashboard-card ${isGasLevelSafe ? 'normal' : 'warning'}`}>
                <div className="card-icon">
                  {/* <FaGasMask /> */}
                  <FaMaskVentilator />
                </div>
                <h3>Carbon Monoxide</h3>
                <p className="card-value">{envData.gasLevel} <span>PPM</span></p>
                <p className="card-status">{isGasLevelSafe ? 'Safe' : 'Danger'}</p>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>Environment Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={envHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3498db"
                    name="Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#e67e22"
                    name="Temperature (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="chart-container">
                <h3>Gas Level</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={gasHistory}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 500]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="gasLevel"
                      name="CO Level (PPM)"
                      fill={(dataPoint) => dataPoint.gasLevel > 200 ? "#e74c3c" : "#27ae60"}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
          
          {/* Safety Status Section */}
          <section className="dashboard-section safety-section">
            <h2>Safety Status</h2>
            <div className="equipment-status-large">
              <div className={`equipment-status-card ${safetyData.helmetStatus ? 'active' : 'inactive'}`}>
                <div className="equipment-status-icon">
                  <HelmetIcon active={safetyData.helmetStatus} size={64} />
                </div>
                <div className="equipment-status-info">
                  <h3>Safety Helmet</h3>
                  <p className="equipment-status-value">{safetyData.helmetStatus ? 'Properly Worn' : 'Not Detected'}</p>
                </div>
              </div>
              
              <div className={`equipment-status-card ${safetyData.lampStatus ? 'active' : 'inactive'}`}>
                <div className="equipment-status-icon">
                  <FaLightbulb size={64} />
                </div>
                <div className="equipment-status-info">
                  <h3>Mining Lamp</h3>
                  <p className="equipment-status-value">{safetyData.lampStatus ? 'Illuminated' : 'Off'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;