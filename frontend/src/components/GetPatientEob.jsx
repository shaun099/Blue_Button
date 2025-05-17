import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetPatientEob = () => {
  const [eobData, setEobData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = 'http://localhost:5500/api/eob/';

  const fetchEobData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      console.log('EOB Response data:', res.data);
      // Expecting an array of EOB objects from backend
      const data = Array.isArray(res.data) ? res.data : [];
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
    dateStr && dateStr !== 'N/A'
      ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';

  // Format currency function
  const formatCurrency = (amount, currency = 'USD') => 
    amount !== undefined && amount !== null && amount !== 'N/A'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
      : 'N/A';

  if (loading) return <div className="container mx-auto p-6 text-center text-gray-500">Loading EOB data...</div>;
  if (error) return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Explanation of Benefits</h1>
        <button
          onClick={fetchEobData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh EOB Data'}
        </button>
      </div>

      {eobData.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No EOB data available.</p>
      ) : (
        <div className="space-y-6">
          {eobData.map((eob) => (
            <div
              key={eob.id || Math.random()}
              className="bg-white rounded-xl shadow-lg p-6 bg-gradient-to-r from-blue-50 to-white hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                EOB ID: {eob.id}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Status:</span> {eob.status}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Created:</span> {formatDate(eob.created)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Patient Reference:</span> {eob.patientReference}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">Type:</span> {eob.type?.display} ({eob.type?.code})
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Billable Period:</span> {formatDate(eob.billablePeriod?.start)} to {formatDate(eob.billablePeriod?.end)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Payment:</span> {formatCurrency(eob.payment?.amount, eob.payment?.currency)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Provider Information</h3>
                <p className="text-gray-700">
                  <span className="font-medium">Name:</span> {eob.provider?.name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">NPI:</span> {eob.provider?.npi}
                </p>
              </div>

              {eob.diagnoses?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Diagnoses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {eob.diagnoses.map((diag, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">#{diag.sequence}: {diag.display}</p>
                        <p className="text-sm text-gray-600">Code: {diag.code} ({diag.system})</p>
                        <p className="text-sm text-gray-600">Type: {diag.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eob.items?.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Line Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 text-left">Service</th>
                          <th className="py-2 px-4 text-left">Date</th>
                          <th className="py-2 px-4 text-right">Submitted</th>
                          <th className="py-2 px-4 text-right">Allowed</th>
                          <th className="py-2 px-4 text-right">Paid</th>
                          <th className="py-2 px-4 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {eob.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-2 px-4">
                              <p className="font-medium">{item.productCode}</p>
                              <p className="text-sm text-gray-600">{item.productSystem}</p>
                              {item.ndcCode !== 'N/A' && (
                                <p className="text-xs text-gray-500">NDC: {item.ndcCode}</p>
                              )}
                            </td>
                            <td className="py-2 px-4">{item.serviceDate}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(item.submittedAmount)}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(item.allowedAmount)}</td>
                            <td className="py-2 px-4 text-right">{formatCurrency(item.paidAmount)}</td>
                            <td className="py-2 px-4">
                              {item.modifiers.length > 0 && (
                                <p className="text-xs">Modifiers: {item.modifiers.join(', ')}</p>
                              )}
                              <p className="text-xs">Location: {item.locationDisplay}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GetPatientEob;