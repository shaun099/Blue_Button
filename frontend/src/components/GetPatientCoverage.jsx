import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetPatientCoverage = () => {
  const [coverageData, setCoverageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = 'http://localhost:5500/api/coverage/';

  const fetchCoverageData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      
      // Assuming backend already processed data with CoverageField
      setCoverageData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = 'http://localhost:5500/api/auth/login';
      } else {
        setError('Failed to fetch coverage data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'done') {
      fetchCoverageData();
    }
  }, []);

  if (loading) return <div className="container mx-auto p-6 text-center text-gray-500">Loading coverage data...</div>;
  if (error) return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Patient Coverage Details</h1>
        <button
          onClick={fetchCoverageData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Coverage Data'}
        </button>
      </div>

      {coverageData.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No coverage data available.</p>
      ) : (
        <div className="space-y-6">
          {coverageData.map((coverage) => (
            <div
              key={coverage.id}
              className="bg-white rounded-xl shadow-lg p-6 bg-gradient-to-r from-blue-50 to-white hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {coverage.type} Coverage
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Status:</span> {coverage.status}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Subscriber ID:</span> {coverage.subscriberId}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Beneficiary:</span> {coverage.beneficiaryReference}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Relationship:</span> {coverage.relationship}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Payor:</span> {coverage.payor}
                  </p>
                </div>
              </div>

              {/* Display all extension fields */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Coverage Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(coverage)
                    .filter(([key]) => 
                      !['id', 'status', 'subscriberId', 'beneficiaryReference', 'relationship', 'payor', 'type'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">{value}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GetPatientCoverage;