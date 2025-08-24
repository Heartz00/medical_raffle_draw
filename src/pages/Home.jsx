// pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      {/* Hero section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="mb-8 relative">
          <div className="absolute -inset-4 bg-blue-500 rounded-full filter blur-xl opacity-30 animate-ping"></div>
          <h1 className="text-6xl md:text-8xl font-bold text-white relative">
            MEDICAL IMAGING{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              RAFFLE
            </span>
          </h1>
        </div>

        {/* BIG BOLD $500 PRIZE SECTION */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-3xl filter blur-2xl opacity-70 group-hover:opacity-90 transition-all duration-1000 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-8 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-all duration-500">
            <div className="text-7xl md:text-9xl font-black text-white drop-shadow-2xl">
              $500
            </div>
            <div className="text-xl md:text-2xl font-bold text-white mt-4 uppercase tracking-wider">
              CASH PRIZE
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-300 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>

        <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mb-12 font-light">
          Participate in our Nigeria Medical Imaging Survey for a chance to win
          <span className="font-bold text-yellow-300 mx-1">$500</span>
          and help build a comprehensive GIS database of medical equipment.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            to="/survey"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-900 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105"
          >
            Join the Raffle
          </Link>
          <Link
            to="/map"
            className="px-8 py-4 bg-transparent border-2 border-blue-400 text-blue-100 rounded-full font-semibold text-lg hover:bg-blue-800/30 transition-all duration-300"
          >
            View GIS Map
          </Link>
        </div>
      </div>

      {/* Info section */}
      <div className="relative z-10 bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center p-6 rounded-xl bg-gradient-to-b from-white to-blue-50 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Complete the Survey
              </h3>
              <p className="text-gray-900">
                Provide information about your medical imaging facility and
                equipment.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-b from-white to-blue-50 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Earn Raffle Tickets
              </h3>
              <p className="text-gray-900">
                Gain more entries based on the completeness of your information.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-gradient-to-b from-white to-blue-50 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Win Prizes</h3>
              <p className="text-gray-900">
                Selected participants will receive{" "}
                <span className="font-bold text-orange-900">$500</span> for
                their contribution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
