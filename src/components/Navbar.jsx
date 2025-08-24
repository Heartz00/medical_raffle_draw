// components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useSupabase";

// Import your logo - adjust the path as needed
import logo from "../assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin =
    user &&
    (user.email === process.env.REACT_APP_ADMIN_EMAIL ||
      user.email?.endsWith("@admin.com"));

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left side with logo and text */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center">
              <img
                src={logo}
                alt="MAI Lab Logo"
                className="h-32 w-auto mr-2" // Adjusted to a more standard logo size
              />
              <div className="flex flex-col">
                <span className="text-blue-900 font-bold text-xl leading-tight">
                  Medical Artificial Intelligence Laboratory
                </span>
                <span className="text-blue-700 text-sm leading-tight">
                  (MAI Lab)
                </span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex space-x-1 md:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/"
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              }`}
            >
              Home
            </Link>

            <Link
              to="/survey"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/survey"
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              }`}
            >
              Survey
            </Link>

            <Link
              to="/raffle"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/raffle"
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              }`}
            >
              Raffle
            </Link>

            <Link
              to="/map"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === "/map"
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              }`}
            >
              Map
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === "/admin"
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-700 hover:bg-blue-100 hover:text-blue-900"
                }`}
              >
                Admin
              </Link>
            )}

            {!user && (
              <Link
                to="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-900"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
