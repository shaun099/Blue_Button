import React, { useState, useEffect } from "react";
import axios from "axios";
import PatientSnf from "../components/PatientSnf";
import GetDme from "./GetDme";

const PatientDetails = () => {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Define which fields to display (customizable)
  const displayFields = [
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "birthDate", label: "Birth Date" },
    { key: "race", label: "Race" },
    { key: "id", label: "ID" },
    { key: "deceased", label: "Deceased", conditionalClass: (value) => (value === "Yes" ? "text-red-600" : "") },
    { key: "address", label: "Address", render: (address) => (
      <>
        State: {address.state}<br />
        Postal Code: {address.postalCode}
      </>
    )},
  ];

  const extractPatientData = (raw) => {
    const resource = raw.resource || {};

    const nameObj = resource.name?.[0] || {};
    const fullName = `${nameObj.given?.join(" ") || ""} ${nameObj.family || ""}`.trim();

    const raceExtension = resource.extension?.find(
      (ext) => ext.url === "https://bluebutton.cms.gov/resources/variables/race"
    );

    return {
      id: resource.id || "N/A",
      name: fullName || "No Name",
      gender: resource.gender || "N/A",
      birthDate: resource.birthDate || "N/A",
      deceased: resource.deceasedBoolean ? "Yes" : "No",
      race: raceExtension?.valueCoding?.display || "Unknown",
      address: {
        state: resource.address?.[0]?.state || "N/A",
        postalCode: resource.address?.[0]?.postalCode || "N/A",
      },
    };
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5500/api/patient/", {
        withCredentials: true,
      });

      console.log("Raw response:", res.data);

      // Fallback for JSON.parse() if the response is a string (not needed with axios, but included for robustness)
      let rawData;
      if (typeof res.data === "string") {
        try {
          rawData = JSON.parse(res.data);
        } catch (parseErr) {
          console.error("Failed to parse JSON:", parseErr);
          throw new Error("Invalid JSON data received from server");
        }
      } else {
        rawData = res.data;
      }

      // Validate and normalize data
      const dataArray = rawData.entry
        ? Array.isArray(rawData.entry)
          ? rawData.entry
          : [rawData.entry]
        : Array.isArray(rawData)
        ? rawData
        : [];

      const parsedData = dataArray.map(extractPatientData);

      setPatients(parsedData);
      setError("");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "http://localhost:5500/api/auth/login";
      } else {
        setError(err.message || "Failed to fetch patient data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "done") {
      fetchPatients();
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Patients List</h1>
        <button
          onClick={fetchPatients}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Patients"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-black">Loading patients data...</div>
      ) : (
        <div className="w-full ap-4">
          {patients.length > 0 ? (
            patients.map((patient, index) => (
              <div key={index} className="bg-slate-400  rounded-lg shadow p-4">
                {displayFields.map((field) => (
                  <div key={field.key} className="text-black mt-2">
                    <span className="font-semibold">{field.label}:</span>{" "}
                    {field.render ? (
                      field.render(patient[field.key])
                    ) : (
                      <span className={field.conditionalClass ? field.conditionalClass(patient[field.key]) : ""}>
                        {patient[field.key]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">No patients found</div>
          )}
        </div>
      )}

      <PatientSnf/>
      <GetDme/>
    </div>
  );
};

export default PatientDetails;