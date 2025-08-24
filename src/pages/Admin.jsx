// pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, useFacilities } from "../hooks/useSupabase";
import { sendWinnerEmail, sendBulkEmails } from "../utils/emailService";

const Admin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Pre-configured admin credentials
  const ADMIN_CREDENTIALS = {
    email: process.env.REACT_APP_ADMIN_EMAIL || "admin@medicalraffle.com",
    password: process.env.REACT_APP_ADMIN_PASSWORD || "adminmdraf223",
  };

  // Check authentication status on component mount
  useEffect(() => {
    const isAuthenticated =
      localStorage.getItem("adminAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const { facilities, loading, refetch } = useFacilities(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [exportFormat, setExportFormat] = useState("json");
  const [winners, setWinners] = useState([]);
  const [raffleStatus, setRaffleStatus] = useState("idle");
  const [emailStatus, setEmailStatus] = useState("idle");
  const [emailContent, setEmailContent] = useState({
    subject: "Congratulations! You won the Medical Imaging Raffle",
    body: `Dear Winner,

We are pleased to inform you that you have been selected as a winner in the Nigeria Medical Imaging Facility Survey Raffle Draw.

You have won $500 as a token of appreciation for your participation and contribution to our research.

Please provide us with your payment details to process your reward.

Best regards,
The Medical Imaging Research Team`,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
    } else {
      setError("Invalid admin credentials");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    localStorage.removeItem("adminAuthenticated");
    navigate("/login");
  };

  const approveFacility = async (facilityId) => {
    try {
      const { error } = await supabase
        .from("facilities")
        .update({ approved: true })
        .eq("id", facilityId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error approving facility:", error);
    }
  };

  const rejectFacility = async (facilityId) => {
    try {
      const { error } = await supabase
        .from("facilities")
        .update({ approved: false })
        .eq("id", facilityId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error rejecting facility:", error);
    }
  };

  const exportData = async () => {
    try {
      let dataToExport;

      if (exportFormat === "json") {
        dataToExport = JSON.stringify(facilities, null, 2);
        const blob = new Blob([dataToExport], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "medical_imaging_facilities.json";
        a.click();
      } else if (exportFormat === "csv") {
        const headers = [
          "Name",
          "State",
          "Address",
          "Facility Type",
          "Ownership",
          "MRI Machines",
          "CT Scanners",
          "Approved",
        ];
        const csvData = facilities.map((facility) => {
          const mriCount =
            facility.machines?.filter((m) => m.machine_type === "mri").length ||
            0;
          const ctCount =
            facility.machines?.filter((m) => m.machine_type === "ct").length ||
            0;

          return [
            facility.name,
            facility.state,
            facility.address,
            facility.facility_type?.join(", "),
            facility.ownership,
            mriCount,
            ctCount,
            facility.approved ? "Yes" : "No",
          ];
        });

        const csvContent = [headers, ...csvData]
          .map((row) => row.join(","))
          .join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "medical_imaging_facilities.csv";
        a.click();
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const weightedRandom = (entries) => {
    const total = entries.reduce((sum, entry) => sum + entry.points, 0);
    let r = Math.random() * total;

    for (let entry of entries) {
      if (r < entry.points) return entry;
      r -= entry.points;
    }

    return entries[entries.length - 1];
  };

  const selectWinners = async () => {
    try {
      setRaffleStatus("drawing");

      // Get facilities with respondent contact info for raffle
      const { data: entries, error } = await supabase
        .from("facilities")
        .select(
          "id, points, name, respondent_name, respondent_email, contact_person, contact_email"
        )
        .eq("approved", true)
        .gt("points", 0);

      if (error) throw error;

      if (entries.length === 0) {
        alert("No eligible entries for the raffle");
        setRaffleStatus("idle");
        return;
      }

      const winnerCount = Math.max(1, Math.floor(entries.length * 0.05));
      const selectedWinners = [];

      for (let i = 0; i < winnerCount; i++) {
        if (entries.length === 0) break;

        const winner = weightedRandom(entries);
        const winnerIndex = entries.findIndex(
          (entry) => entry.id === winner.id
        );
        if (winnerIndex > -1) {
          entries.splice(winnerIndex, 1);
        }

        selectedWinners.push(winner);

        const { error: insertError } = await supabase
          .from("raffle_draws")
          .insert([
            {
              facility_id: winner.id,
              points: winner.points,
              prize_amount: 500,
              respondent_name: winner.respondent_name,
              respondent_email: winner.respondent_email,
            },
          ]);

        if (insertError) throw insertError;
      }

      setWinners(selectedWinners);
      setRaffleStatus("completed");
    } catch (error) {
      console.error("Error selecting winners:", error);
      setRaffleStatus("idle");
    }
  };

  const sendWinnerEmails = async () => {
    try {
      setEmailStatus("sending");

      const results = await sendBulkEmails(winners, emailContent);

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      setEmailStatus("sent");

      if (failed > 0) {
        alert(
          `Emails sent successfully to ${successful} winners. Failed to send to ${failed} winners.`
        );
      } else {
        alert(`Successfully sent emails to all ${successful} winners!`);
      }
    } catch (error) {
      console.error("Error sending winner emails:", error);
      setEmailStatus("error");
      alert("Error sending emails: " + error.message);
    }
  };

  const sendIndividualEmail = async (winner) => {
    try {
      // Check if winner has valid email before attempting to send
      if (!winner.respondent_email) {
        alert(
          `Cannot send email to ${
            winner.respondent_name || winner.name
          }: No email address available`
        );
        return;
      }

      setEmailStatus("sending");

      const result = await sendWinnerEmail(winner, emailContent);

      if (result.success) {
        setEmailStatus("sent");
        alert(
          `Email successfully sent to ${
            winner.respondent_name || winner.name
          } at ${winner.respondent_email}`
        );
      } else {
        setEmailStatus("error");
        alert(
          `Failed to send email to ${winner.respondent_name || winner.name}: ${
            result.error.message
          }`
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus("error");
      alert("Error sending email: " + error.message);
    }
  };

  const sendManualEmail = (winner) => {
    const subject = encodeURIComponent(emailContent.subject);
    const body = encodeURIComponent(
      emailContent.body.replace("Winner", winner.respondent_name || winner.name)
    );
    const mailtoLink = `mailto:${winner.respondent_email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const sendBulkEmailsManual = () => {
    if (winners.length === 0) {
      alert("No winners selected yet. Please run the raffle draw first.");
      return;
    }

    const bccEmails = winners
      .map((winner) => winner.respondent_email)
      .join(",");
    const subject = encodeURIComponent(emailContent.subject);
    const body = encodeURIComponent(emailContent.body);
    const mailtoLink = `mailto:?bcc=${bccEmails}&subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Facility Approval</h2>
            <p className="text-3xl font-bold text-blue-600">
              {facilities.filter((f) => !f.approved).length}
            </p>
            <p className="text-gray-600">Pending approvals</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Total Facilities</h2>
            <p className="text-3xl font-bold text-green-600">
              {facilities.length}
            </p>
            <p className="text-gray-600">Registered facilities</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Raffle Entries</h2>
            <p className="text-3xl font-bold text-purple-600">
              {facilities.filter((f) => f.approved && f.points > 0).length}
            </p>
            <p className="text-gray-600">Eligible entries</p>
          </div>
        </div>

        {/* Raffle Draw Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Raffle Draw</h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Email Content</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailContent.subject}
                  onChange={(e) =>
                    setEmailContent({
                      ...emailContent,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body
                </label>
                <textarea
                  value={emailContent.body}
                  onChange={(e) =>
                    setEmailContent({ ...emailContent, body: e.target.value })
                  }
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={selectWinners}
                disabled={raffleStatus === "drawing"}
                className={`px-4 py-2 rounded-lg text-white ${
                  raffleStatus === "drawing"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {raffleStatus === "drawing"
                  ? "Drawing Winners..."
                  : "Run Raffle Draw"}
              </button>

              {winners.length > 0 && (
                <>
                  <button
                    onClick={sendWinnerEmails}
                    disabled={emailStatus === "sending"}
                    className={`px-4 py-2 rounded-lg text-white ${
                      emailStatus === "sending"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {emailStatus === "sending"
                      ? "Sending Emails..."
                      : "Email All Winners (Auto)"}
                  </button>

                  <button
                    onClick={sendBulkEmailsManual}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Email All Winners (Manual)
                  </button>
                </>
              )}
            </div>

            {raffleStatus === "drawing" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                  <p className="text-blue-700">
                    Drawing winners, please wait...
                  </p>
                </div>
              </div>
            )}

            {emailStatus === "sending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                  <p className="text-blue-700">
                    Sending emails, please wait...
                  </p>
                </div>
              </div>
            )}

            {emailStatus === "sent" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700">Emails sent successfully!</p>
              </div>
            )}

            {emailStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">
                  There was an error sending emails. Please try the manual
                  option.
                </p>
              </div>
            )}

            {winners.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">
                  Selected Winners:
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facility
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {winners.map((winner) => (
                        <tr key={winner.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {winner.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {winner.respondent_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {winner.respondent_email}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {winner.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => sendIndividualEmail(winner)}
                              disabled={emailStatus === "sending"}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              Email (Auto)
                            </button>
                            <button
                              onClick={() => sendManualEmail(winner)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Email (Manual)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Export Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Data Export</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Facility Approval Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Facility Approval Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facilities.map((facility) => (
                  <tr key={facility.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {facility.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {facility.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {facility.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {facility.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          facility.approved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {facility.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!facility.approved && (
                        <>
                          <button
                            onClick={() => approveFacility(facility.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectFacility(facility.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedFacility(facility)}
                        className="text-blue-600 hover:text-blue-900 ml-3"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Facility Detail Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selectedFacility.name}</h3>
              <button
                onClick={() => setSelectedFacility(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Address</h4>
                  <p className="text-gray-600">{selectedFacility.address}</p>
                  <p className="text-gray-600">
                    {selectedFacility.state} State
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Contact Information
                  </h4>
                  <p className="text-gray-600">
                    {selectedFacility.contact_person} (
                    {selectedFacility.contact_role})
                  </p>
                  <p className="text-gray-600">
                    {selectedFacility.contact_email}
                  </p>
                  <p className="text-gray-600">
                    {selectedFacility.contact_phone}
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-700 mb-2">Machines</h4>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {selectedFacility.machines?.map((machine) => (
                  <div key={machine.id} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium capitalize">
                      {machine.machine_type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {machine.manufacturer} {machine.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {machine.status}
                    </p>
                    {machine.photo_url && (
                      <img
                        src={machine.photo_url}
                        alt={machine.machine_type}
                        className="mt-2 rounded h-20 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              <h4 className="font-semibold text-gray-700 mb-2">
                Challenges & Solutions
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600">{selectedFacility.challenges}</p>
                </div>
                <div>
                  <p className="text-gray-600">{selectedFacility.solutions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
