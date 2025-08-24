// components/PhotoUpload.js
import React, { useState } from "react";
import { supabase } from "../hooks/supabase";

const PhotoUpload = ({ machines, onSuccess, onBack, anonymousId }) => {
  const [selectedMachine, setSelectedMachine] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      setError(null);

      if (!selectedMachine) {
        throw new Error("Please select a machine");
      }

      if (!anonymousId) {
        throw new Error(
          "Session ID is missing. Please refresh the page and try again."
        );
      }

      const file = e.target.files[0];
      if (!file) return;

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Check file type
      const validFileTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validFileTypes.includes(file.type)) {
        throw new Error(
          "Please upload a valid image file (JPEG, PNG, GIF, or WebP)"
        );
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${anonymousId}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}.${fileExt}`;
      const filePath = `machine-photos/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("machine-photos")
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes("bucket")) {
          // Create the bucket if it doesn't exist
          const { error: bucketError } = await supabase.storage.createBucket(
            "machine-photos",
            {
              public: true,
              fileSizeLimit: 10485760, // 10MB
            }
          );

          if (bucketError) throw bucketError;

          // Retry upload
          const { error: retryError } = await supabase.storage
            .from("machine-photos")
            .upload(filePath, file);

          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("machine-photos").getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from("uploads").insert([
        {
          machine_id: selectedMachine,
          photo_url: publicUrl,
          anonymous_id: anonymousId,
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMessage("Photo uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError(error.message);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Upload Machine Photos</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          Select Machine
        </label>
        <select
          value={selectedMachine}
          onChange={(e) => setSelectedMachine(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select a machine</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.type} -{" "}
              {machine.facilities?.facility_name || "Unknown Facility"}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          Upload Photo
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={handleUpload}
                  disabled={uploading || !selectedMachine}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WebP up to 10MB
            </p>
          </div>
        </div>
        {uploading && (
          <div className="mt-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>

        <button
          onClick={onSuccess}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Complete Registration
        </button>
      </div>
    </div>
  );
};

export default PhotoUpload;
