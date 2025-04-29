import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Test   = () => {
  const [patientData, setPatientData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = 'http://localhost:5500/api/patient/';

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      console.log('Response data:', res.data);
      // Expecting an array of patient objects from backend
      const data = Array.isArray(res.data) ? res.data : [];
      setPatientData(data);
      setError('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = 'http://localhost:5500/api/auth/login';
      } else {
        setError('Failed to fetch patient data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'done') {
      fetchPatientData();
    }
  }, []);

  // Format date function
  const formatDate = (dateStr) =>
    dateStr && dateStr !== 'N/A'
      ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';

  if (loading) return <div className="container mx-auto p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Patient Details</h1>
        <button
          onClick={fetchPatientData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Claim Data'}
        </button>
      </div>

      {patientData.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No patient data available.</p>
      ) : (
        <div className="space-y-6">
          {patientData.map((patient) => (
            <div
              key={patient.id || Math.random()}
              className="bg-white rounded-xl shadow-lg p-6 bg-gradient-to-r from-blue-50 to-white hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {patient.firstname} {patient.middlename !== 'N/A' ? patient.middlename : ''} {patient.lastname}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">ID:</span> {patient.id}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Birth Date:</span> {formatDate(patient.birthDate)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Gender:</span> {patient.gender}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Address:</span><br />
                    <span className="ml-2">Postal Code: {patient.postalCode}</span><br />
                    <span className="ml-2">State: {patient.state}</span>
                  </p>

                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Race:</span> {patient.race}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Deceased:</span> {patient.deceased}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Test;