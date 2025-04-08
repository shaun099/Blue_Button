import React, { useState, useEffect } from "react";
import axios from 'axios';

const GetPatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5500/api/patient/", {
        withCredentials: true,
      });
      
      console.log("Response data:", res.data);
      // Make sure we're setting the data properly
      setPatients(Array.isArray(res.data) ? res.data : [res.data]);
      setError("");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "http://localhost:5500/api/auth/login";
      } else {
        setError("Failed to fetch patient data");
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
        <div className="text-gray-500">Loading patients data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.length > 0 ? (
            patients.map((patient, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold">
                  {patient.name || "No Name"}
                </h2>
                <p className="text-gray-600 mt-2">
                  Address: {patient.address ? (
                   <>
                      Postal Code: {patient.address.postalCode || "N/A"}<br />
                      State: {patient.address.state || "N/A"}
                    </>
                  ) : "No Address"}
                </p>
                <p className="text-gray-600">Gender: {patient.gender || "N/A"}</p>
                <p className="text-gray-600">Race: {patient.race || "N/A"}</p>
                <p className="text-gray-600">Birth Date: {patient.birthDate || "N/A"}</p>
                <p className="text-gray-600">ID: {patient.id || "N/A"}</p>
                {patient.deceasedDateTime && (
                  <p className="text-red-600">Deceased: {patient.deceasedDateTime}</p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">No patients found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GetPatientsList;