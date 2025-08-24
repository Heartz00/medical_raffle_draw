// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SurveyPage from "./pages/SurveyPage";
import Raffle from "./pages/Raffle";
import Map from "./pages/Map";
import Admin from "./pages/Admin";
import Login from "./pages/Login"; // Add this import
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/raffle" element={<Raffle />} />
          <Route path="/map" element={<Map />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} /> {/* Add this route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
