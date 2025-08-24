// pages/SurveyPage.jsx
import React, { useState } from "react";
import SurveyForm from "../components/SurveyForm";
import ProgressBar from "../components/ProgressBar";
import { supabase } from "../hooks/useSupabase";
import { useAnonymousSession } from "../hooks/useAnonymousSession";

const SurveyPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const anonymousId = useAnonymousSession();

  const [formData, setFormData] = useState({
    // Respondent Information (for raffle contact)
    respondent_name: "",
    respondent_email: "",
    respondent_phone: "",
    designation: "",
    designation_other: "",

    // Facility Information
    name: "",
    address: "",
    state: "",
    facility_type: [],
    facility_type_other: "",
    ownership: "",

    // Facility Contact Information (for validation)
    contact_person: "",
    contact_role: "",
    contact_phone: "",
    contact_email: "",

    // Machine information
    mriCount: 0,
    ctCount: 0,
    ultrasoundCount: 0,
    xrayCount: 0,
    mriMachines: [],
    ctMachines: [],
    ultrasoundMachines: [],
    xrayMachines: [],

    // Usage & Maintenance
    power_availability: "",
    has_backup_power: null,
    service_engineer_type: "",
    maintenance_frequency: "",

    // Personnel & Training
    staff_radiologists: 0,
    staff_radiographers: 0,
    staff_physicists: 0,
    staff_nurses: 0,
    staff_admin: 0,
    cpd_participation: "",
    interest_in_training: null,

    // Cost & Access
    cost_mri: "",
    cost_ct: "",
    cost_ultrasound: "",
    cost_xray: "",
    payment_methods: [],
    payment_methods_other: "",

    // Research & Collaboration
    research_participation: null,
    has_ethics_committee: null,

    // Challenges & Solutions
    challenges: "",
    solutions: "",

    // Points
    points: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 13; // Total number of steps in the survey

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "facility_type" || name === "payment_methods") {
        const currentValues = formData[name] || [];
        if (checked) {
          setFormData((prev) => ({
            ...prev,
            [name]: [...currentValues, value],
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [name]: currentValues.filter((item) => item !== value),
          }));
        }
      }
    } else if (type === "radio") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "true",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleMachineChange = (e, machineType, index, fieldName) => {
    const { value } = e.target;
    const machineKey = `${machineType}Machines`;
    const updatedMachines = [...(formData[machineKey] || [])];

    if (!updatedMachines[index]) {
      updatedMachines[index] = { machine_type: machineType };
    }

    updatedMachines[index][fieldName] = value;

    setFormData((prev) => ({
      ...prev,
      [machineKey]: updatedMachines,
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const calculatePoints = () => {
    let points = 50; // Base points for completing the survey

    // Points for each machine reported
    points += (formData.mriCount || 0) * 10;
    points += (formData.ctCount || 0) * 8;
    points += (formData.ultrasoundCount || 0) * 5;
    points += (formData.xrayCount || 0) * 3;

    // Points for detailed information
    if (formData.respondent_email) points += 5;
    if (formData.respondent_phone) points += 5;
    if (formData.challenges) points += 10;
    if (formData.solutions) points += 10;

    return points;
  };

  const submitSurvey = async () => {
    try {
      setSubmitting(true);

      if (!anonymousId) {
        alert("Please refresh the page and try again.");
        return;
      }

      const points = calculatePoints();

      // Save facility with anonymous_id
      const { data: facility, error: facilityError } = await supabase
        .from("facilities")
        .insert([
          {
            // Respondent information (for raffle)
            respondent_name: formData.respondent_name,
            respondent_email: formData.respondent_email,
            respondent_phone: formData.respondent_phone,
            designation: formData.designation,
            designation_other: formData.designation_other,

            // Facility information
            name: formData.name,
            address: formData.address,
            state: formData.state,
            facility_type: formData.facility_type,
            facility_type_other: formData.facility_type_other,
            ownership: formData.ownership,

            // Facility contact information (for validation)
            contact_person: formData.contact_person,
            contact_role: formData.contact_role,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,

            // Usage & Maintenance
            power_availability: formData.power_availability,
            has_backup_power: formData.has_backup_power,
            service_engineer_type: formData.service_engineer_type,
            maintenance_frequency: formData.maintenance_frequency,

            // Personnel & Training
            staff_radiologists: formData.staff_radiologists,
            staff_radiographers: formData.staff_radiographers,
            staff_physicists: formData.staff_physicists,
            staff_nurses: formData.staff_nurses,
            staff_admin: formData.staff_admin,
            cpd_participation: formData.cpd_participation,
            interest_in_training: formData.interest_in_training,

            // Cost & Access
            cost_mri: formData.cost_mri,
            cost_ct: formData.cost_ct,
            cost_ultrasound: formData.cost_ultrasound,
            cost_xray: formData.cost_xray,
            payment_methods: formData.payment_methods,
            payment_methods_other: formData.payment_methods_other,

            // Research & Collaboration
            research_participation: formData.research_participation,
            has_ethics_committee: formData.has_ethics_committee,

            // Challenges & Solutions
            challenges: formData.challenges,
            solutions: formData.solutions,

            points: points,
            anonymous_id: anonymousId,
            approved: false,
          },
        ])
        .select()
        .single();

      if (facilityError) throw facilityError;

      // Save all machines
      const allMachines = [
        ...formData.mriMachines.map((machine) => ({
          ...machine,
          facility_id: facility.id,
          anonymous_id: anonymousId,
        })),
        ...formData.ctMachines.map((machine) => ({
          ...machine,
          facility_id: facility.id,
          anonymous_id: anonymousId,
        })),
        ...formData.ultrasoundMachines.map((machine) => ({
          ...machine,
          facility_id: facility.id,
          anonymous_id: anonymousId,
        })),
        ...formData.xrayMachines.map((machine) => ({
          ...machine,
          facility_id: facility.id,
          anonymous_id: anonymousId,
        })),
      ];

      if (allMachines.length > 0) {
        const { error: machinesError } = await supabase
          .from("machines")
          .insert(allMachines);

        if (machinesError) throw machinesError;
      }

      // Update points in form data for confirmation display
      setFormData((prev) => ({ ...prev, points }));

      // Move to confirmation step
      setCurrentStep(13);
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Error submitting survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-2 bg-gradient-to-r from-blue-900 to-cyan-600">
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Nigeria Medical Imaging Facility Survey
          </h1>
        </div>

        <div className="p-6 md:p-8">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          {currentStep < 13 && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800">
                <strong>Raffle Points:</strong> Complete the survey to earn
                raffle tickets. You currently have{" "}
                <span className="font-bold text-blue-900">
                  {calculatePoints()} points
                </span>
                .
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (calculatePoints() / 200) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <SurveyForm
            currentStep={currentStep}
            formData={formData}
            handleChange={handleChange}
            handleMachineChange={handleMachineChange}
            nextStep={nextStep}
            prevStep={prevStep}
            totalSteps={totalSteps}
            submitSurvey={submitSurvey}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
