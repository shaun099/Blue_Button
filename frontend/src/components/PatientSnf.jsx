import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClaimDetails = () => {
  const [claimData, setClaimData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = 'http://localhost:5500/api/eob?type=snf'; // Replace with your API URL

  const fetchClaimData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      console.log('Response data:', res.data);
      // Ensure data.entry exists and is an array
      if (res.data.entry && Array.isArray(res.data.entry) && res.data.entry.length > 0) {
        setClaimData(res.data);
      } else {
        setClaimData({ entry: [{ resource: {} }] }); // Fallback for empty response
      }
      setError('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = 'http://localhost:5500/api/auth/login';
      } else {
        setError('Failed to fetch claim data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'done') {
      fetchClaimData();
    }
  }, []);

  // Format date function
  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  // Financial Extensions
  const getFinancialExtensions = (entry) => [
    { label: 'Deductible', value: entry.extension?.[0]?.valueMoney?.value || 0 },
    { label: 'Coinsurance Liability', value: entry.extension?.[1]?.valueMoney?.value || 0 },
    { label: 'Non-Covered Charges', value: entry.extension?.[2]?.valueMoney?.value || 0 },
    { label: 'Primary Payer Amount', value: entry.extension?.[3]?.valueMoney?.value || 0 },
    { label: 'Capital Disproportionate Share', value: entry.extension?.[4]?.valueMoney?.value || 0 },
    { label: 'Capital Exception', value: entry.extension?.[5]?.valueMoney?.value || 0 },
    { label: 'Capital FSP', value: entry.extension?.[6]?.valueMoney?.value || 0 },
    { label: 'Capital IME', value: entry.extension?.[7]?.valueMoney?.value || 0 },
    { label: 'Capital Outlier', value: entry.extension?.[8]?.valueMoney?.value || 0 },
    { label: 'Old Capital Harmless', value: entry.extension?.[9]?.valueMoney?.value || 0 },
    { label: 'Blood Deductible', value: entry.extension?.[10]?.valueMoney?.value || 0 },
  ];

  const entry = claimData?.entry?.[0]?.resource || {};

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">SNF</h1>
        {/* <button
          onClick={fetchClaimData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Claim Data'}
        </button> */}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading claim data...</div>
      ) : (
        claimData && (
          <>
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-600">Claim ID: {entry.id || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">
                  Status: <span className="font-semibold">{entry.status || 'N/A'}</span>
                </p>
                <p className="text-gray-600">Last Updated: {formatDate(entry.meta?.lastUpdated)}</p>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Financial Summary</h2>
                <p>
                  Total Cost: <span className="font-medium">${(entry.totalCost?.value || 0).toFixed(2)}</span>
                </p>
                <p>
                  Payment Amount: <span className="font-medium">${(entry.payment?.amount?.value || 0).toFixed(2)}</span>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Key Metrics</h2>
                <p>
                  Deductible: <span className="font-medium">${(entry.extension?.[0]?.valueMoney?.value || 0).toFixed(2)}</span>
                </p>
                <p>
                  Coinsurance Liability:{' '}
                  <span className="font-medium">${(entry.extension?.[1]?.valueMoney?.value || 0).toFixed(2)}</span>
                </p>
              </div>
            </div>

            {/* Patient/Provider Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Patient & Provider</h2>
              <p>Patient ID: {entry.patient?.reference || 'N/A'}</p>
              <p>Provider Number: {entry.provider?.identifier?.value || 'N/A'}</p>
              <p>
                Organization: {entry.organization?.display || 'N/A'} (NPI: {entry.organization?.identifier?.value || 'N/A'})
              </p>
              <p>
                Care Team:{' '}
                {entry.careTeam?.map((team, index) => (
                  <span key={index} className="block">
                    {' '}
                    - {team.provider?.display || `NPI: ${team.provider?.identifier?.value || 'N/A'}`}
                  </span>
                )) || 'N/A'}
              </p>
            </div>

            {/* Timeline Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Timeline</h2>
              <p>
                Billable Period: {formatDate(entry.billablePeriod?.start)} - {formatDate(entry.billablePeriod?.end)}
              </p>
              <p>
                Hospitalization: {formatDate(entry.hospitalization?.start)} - {formatDate(entry.hospitalization?.end)}
              </p>
              <p>Procedure Date: {formatDate(entry.procedure?.[0]?.date)}</p>
            </div>

            {/* Details Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Additional Details</h2>
              <p>DRG Code: {entry.diagnosis?.[0]?.packageCode?.coding?.[0]?.code || 'N/A'}</p>
              <p>Primary Diagnosis: {entry.diagnosis?.[1]?.diagnosisCodeableConcept?.coding?.[0]?.display || 'N/A'}</p>
              <p>Procedure Code: {entry.procedure?.[0]?.procedureCodeableConcept?.coding?.[0]?.code || 'N/A'}</p>
              <p>Facility Type: {entry.facility?.extension?.[0]?.valueCoding?.display || 'N/A'}</p>
              <p>State: {entry.item?.[0]?.locationAddress?.state || 'N/A'}</p>
              <p>Quantity: {entry.item?.[0]?.quantity?.value || 'N/A'}</p>
              <p>Utilization Days: {entry.benefitBalance?.[0]?.financial?.[0]?.usedUnsignedInt || 'N/A'}</p>
              <p>Blood Pints Furnished: {entry.information?.[0]?.valueQuantity?.value || 'N/A'}</p>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Financial Breakdown</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Category</th>
                    <th className="py-2">Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {getFinancialExtensions(entry).map((ext, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{ext.label}</td>
                      <td className="py-2">${ext.value.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-b">
                    <td className="py-2">Revenue Center Rate</td>
                    <td className="py-2">${(entry.item?.[0]?.adjudication?.[0]?.amount?.value || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Total Charge</td>
                    <td className="py-2">${(entry.item?.[0]?.adjudication?.[1]?.amount?.value || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Non-Covered Charge</td>
                    <td className="py-2">${(entry.item?.[0]?.adjudication?.[2]?.amount?.value || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <p>Non-Payment Reason: {entry.extension?.[11]?.valueCoding?.display || 'N/A'}</p>
              <p>Claim Status: {entry.billablePeriod?.extension?.[0]?.valueCoding?.display || 'N/A'}</p>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ClaimDetails;