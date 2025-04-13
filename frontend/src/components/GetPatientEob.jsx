import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetPatientEob = () => {
  const [eobData, setEobData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = 'http://localhost:5500/api/eob/'; // Ensure this matches your API endpoint

  const fetchEobData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      console.log('Response data:', res.data);
      // Handle both single object with entry array and plain array response
      const data = res.data.entry ? res.data.entry.map((item) => item.resource) : Array.isArray(res.data) ? res.data : [res.data];
      setEobData(data);
      setError('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = 'http://localhost:5500/api/auth/login';
      } else {
        setError('Failed to fetch EOB data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'done') {
      fetchEobData();
    }
  }, []);

  // Format date function
  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  // Check if data is loaded and valid
  if (loading) return <div className="container mx-auto p-4 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="container mx-auto p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Patient Explanation of Benefit Data</h1>
        <button
          onClick={fetchEobData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get EoB'}
        </button>
      </div>

      {eobData.length === 0 ? (
        <p className="text-center text-gray-500">No data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eobData.map((item, index) => (
            <div key={item.id || index} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-600">Claim ID: {item.id || 'N/A'}</h2>
              <p className="text-gray-700"><strong>Patient:</strong> {item.patient?.reference || 'N/A'}</p>
              <p className="text-gray-700"><strong>Status:</strong> {item.status || 'N/A'}</p>
              <p className="text-gray-700"><strong>Type:</strong> {item.type?.coding?.[0]?.display || item.type || 'N/A'}</p>
              <p className="text-gray-700">
                <strong>Billable Period:</strong> {formatDate(item.billablePeriod?.start)} to {formatDate(item.billablePeriod?.end)}
              </p>
              <p className="text-gray-700"><strong>Org NPI:</strong> {item.organization?.identifier?.value || 'N/A'}</p>
              <p className="text-gray-700"><strong>Facility Type:</strong> {item.facility?.extension?.[0]?.valueCoding?.display || 'N/A'}</p>
              <p className="text-gray-700"><strong>Facility NPI:</strong> {item.facility?.identifier?.value || 'N/A'}</p>
              <p className="text-gray-700"><strong>Service Date:</strong> {formatDate(item.item?.[0]?.serviced?.date || item.procedure?.[0]?.date)}</p>
              <p className="text-gray-700"><strong>Medication:</strong> {'N/A'} {/* Add mapping if applicable */}</p>
              <div className="text-gray-700">
                <strong>Quantity:</strong>
                <ul className="list-disc list-inside">
                  <li>Value: {item.item?.[0]?.quantity?.value || 'N/A'}</li>
                  <li>Fill #: {'N/A'} {/* Add mapping if applicable */}</li>
                  <li>Days Supply: {'N/A'} {/* Add mapping if applicable */}</li>
                </ul>
              </div>
              <div className="text-gray-700">
                <strong>Adjudications:</strong>
                <ul className="list-disc list-inside">
                  {item.item?.[0]?.adjudication?.map((adj, idx) => (
                    <li key={idx}>
                      {adj.category?.coding?.[0]?.display || adj.category}: $
                      {adj.amount?.value || '0.00'} ({adj.amount?.currency || 'USD'})
                    </li>
                  )) || <li>No adjudications</li>}
                </ul>
              </div>
              <div className="text-gray-700">
                <strong>Information:</strong>
                <ul className="list-disc list-inside">
                  {item.information?.map((info, idx) => (
                    <li key={idx}>
                      Seq {info.sequence}: {info.category?.coding?.[0]?.display || info.category} -{' '}
                      {info.code?.coding?.[0]?.display || info.code}
                    </li>
                  )) || <li>No information</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GetPatientEob;