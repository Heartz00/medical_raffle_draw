// pages/Map.jsx
import React, { useState, useEffect } from "react";
import { useFacilities } from "../hooks/useSupabase";

const Map = () => {
  const { facilities, loading } = useFacilities(true);
  const [selectedState, setSelectedState] = useState("All");
  const [selectedMachine, setSelectedMachine] = useState("All");
  const [filteredFacilities, setFilteredFacilities] = useState([]);

  useEffect(() => {
    let filtered = facilities;

    if (selectedState !== "All") {
      filtered = filtered.filter((f) => f.state === selectedState);
    }

    if (selectedMachine !== "All") {
      filtered = filtered.filter((f) =>
        f.machines.some(
          (m) => m.machine_type === selectedMachine && m.status === "working"
        )
      );
    }

    setFilteredFacilities(filtered);
  }, [facilities, selectedState, selectedMachine]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading map data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Medical Imaging Facilities in Nigeria
        </h1>
        <p className="text-center text-gray-900 mb-8">
          Interactive map of medical imaging equipment across Nigeria
        </p>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="All">All States</option>
                {[
                  "Abia",
                  "Adamawa",
                  "Akwa Ibom",
                  "Anambra",
                  "Bauchi",
                  "Bayelsa",
                  "Benue",
                  "Borno",
                  "Cross River",
                  "Delta",
                  "Ebonyi",
                  "Edo",
                  "Ekiti",
                  "Enugu",
                  "FCT – Abuja",
                  "Gombe",
                  "Imo",
                  "Jigawa",
                  "Kaduna",
                  "Kano",
                  "Katsina",
                  "Kebbi",
                  "Kogi",
                  "Kwara",
                  "Lagos",
                  "Nasarawa",
                  "Niger",
                  "Ogun",
                  "Ondo",
                  "Osun",
                  "Oyo",
                  "Plateau",
                  "Rivers",
                  "Sokoto",
                  "Taraba",
                  "Yobe",
                  "Zamfara",
                ].map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Machine
              </label>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="All">All Machines</option>
                <option value="mri">MRI</option>
                <option value="ct">CT Scanner</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="xray">X-Ray</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-900">
                Showing {filteredFacilities.length} of {facilities.length}{" "}
                facilities
              </span>
            </div>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="h-96 relative">
            {/* This would be replaced with an actual map library like Leaflet or Google Maps */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center p-6 bg-white/80 rounded-lg shadow-lg max-w-md">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Interactive Map Visualization
                </h3>
                <p className="text-blue-900 mb-4">
                  This map shows {filteredFacilities.length} medical facilities
                  across Nigeria
                  {selectedState !== "All" ? ` in ${selectedState} State` : ""}
                  {selectedMachine !== "All"
                    ? ` with working ${selectedMachine.toUpperCase()} machines`
                    : ""}
                  .
                </p>
                <p className="text-sm text-blue-500">
                  Each facility is represented by a marker on the map. Hover
                  over markers to see details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-blue-800 mb-2">
                {facility.name}
              </h3>
              <p className="text-sm text-gray-900 mb-2">
                {facility.address}, {facility.state}
              </p>

              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Equipment:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {facility.machines?.map((machine) => (
                    <span
                      key={machine.id}
                      className={`text-xs px-2 py-1 rounded-full ${
                        machine.status === "working"
                          ? "bg-green-100 text-green-800"
                          : machine.status === "occasionally_down"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {machine.machine_type.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {
                    facility.machines?.filter((m) => m.status === "working")
                      .length
                  }{" "}
                  working machines
                </span>
                <span className="text-xs font-medium text-blue-900">
                  {facility.points} points
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No facilities match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
