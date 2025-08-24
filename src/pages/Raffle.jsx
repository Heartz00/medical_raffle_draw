// pages/Raffle.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../hooks/useSupabase";

const Raffle = () => {
  const [facilities, setFacilities] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch eligible facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from("facilities")
        .select(
          "id, points, name, respondent_email, respondent_person, approved"
        )
        .eq("approved", true)
        .gt("points", 0)
        .order("points", { ascending: false });

      if (facilitiesError) throw facilitiesError;

      // Fetch draw history
      const { data: drawData, error: drawError } = await supabase
        .from("raffle_draws")
        .select(
          `
          *,
          facilities (
            respondent_name,
            responden_email
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (drawError) throw drawError;

      setFacilities(facilitiesData || []);
      setDrawHistory(drawData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalPoints = facilities.reduce(
    (sum, facility) => sum + facility.points,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Medical Equipment Raffle
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">$500 Cash Prize</h2>
          <p className="text-gray-700 mb-6">
            Participate in our survey of medical imaging equipment in Nigeria
            for a chance to win $500! The more information you provide, the
            higher your chances of winning.
          </p>

          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Each piece of information you provide earns you points</li>
              <li>More points = higher chance of winning</li>
              <li>Raffle draws are conducted periodically by administrators</li>
              <li>Winners are selected using a weighted random algorithm</li>
              <li>All approved facilities with points are eligible</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Current Status:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-green-600">
                  {facilities.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalPoints}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Participants</h2>
          {facilities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Chance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facilities.map((facility, index) => {
                    const winChance =
                      totalPoints > 0
                        ? ((facility.points / totalPoints) * 100).toFixed(2)
                        : "0.00";

                    return (
                      <tr
                        key={facility.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facility.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.respondent_email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {facility.points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {winChance}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No eligible facilities yet.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Past Winners</h2>
          {drawHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prize
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawHistory.map((draw) => (
                    <tr key={draw.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(draw.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {draw.facilities?.respondent_name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {draw.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${draw.prize_amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              No winners yet. Check back after the next raffle draw!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Raffle;
