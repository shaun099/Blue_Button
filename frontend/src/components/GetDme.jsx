import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GetDme = () => {
  const [eobData, setEobData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl = 'http://localhost:5500/api/eob?type=dme'; // Ensure this matches your API endpoint

  const fetchEobData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, {
        withCredentials: true,
      });
      console.log('Response data:', res.data);
      // Handle Bundle with entry array
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

  if (loading) return <div className="container mx-auto p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Durable Medical Equipment Claim Details</h1>
        {/* <button
          onClick={fetchEobData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch EOB Data'}
        </button> */}
      </div>

      {eobData.length === 0 ? (
        <p className="text-center text-gray-500">No data available.</p>
      ) : (
        eobData.map((item, index) => (
          <div key={item.id || index} className="mb-8">
            {/* General Information Panel */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-600">Claim ID: {item.id || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">
                  Status: <span className="font-semibold">{item.status || 'N/A'}</span>
                </p>
                <p className="text-gray-600">Last Updated: {formatDate(item.meta?.lastUpdated)}</p>
                <p className="text-gray-600">Disposition: {item.disposition || 'N/A'}</p>
              </div>
            </div>

            {/* Patient Information Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
              <p>Patient ID: {item.patient?.reference || 'N/A'}</p>
              <p>Principal Diagnosis: {item.diagnosis?.[0]?.diagnosisCodeableConcept?.coding?.[0]?.display || 'N/A'}</p>
              <p>Secondary Diagnosis: {item.diagnosis?.[1]?.diagnosisCodeableConcept?.coding?.[0]?.code || 'N/A'}</p>
            </div>

            {/* Provider/CareTeam Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Provider & Care Team</h2>
              <p>Provider NPI: {item.careTeam?.[0]?.provider?.identifier?.value || 'N/A'}</p>
              <p>Provider Name: {item.careTeam?.[0]?.provider?.display || 'N/A'}</p>
              <p>Provider Role: {item.careTeam?.[0]?.role?.coding?.[0]?.display || 'N/A'}</p>
              <p>Provider Specialty: {item.careTeam?.[0]?.qualification?.coding?.[0]?.display || 'N/A'}</p>
              <p>Participating Indicator: {item.careTeam?.[0]?.extension?.[0]?.valueCoding?.display || 'N/A'}</p>
            </div>

            {/* Timeline Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Timeline</h2>
              <p>
                Billable Period: {formatDate(item.billablePeriod?.start)} - {formatDate(item.billablePeriod?.end)}
              </p>
              <p>Service Date: {formatDate(item.item?.[0]?.servicedPeriod?.start)}</p>
              <p>Processing Date: {formatDate(item.information?.[0]?.timingDate)}</p>
            </div>

            {/* Facility/Location Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Facility & Location</h2>
              <p>Facility Type: {item.item?.[0]?.locationCodeableConcept?.coding?.[0]?.display || 'N/A'}</p>
              <p>Provider State: {item.item?.[0]?.locationCodeableConcept?.extension?.[0]?.valueCoding?.code || 'N/A'}</p>
              <p>Pricing State: {item.item?.[0]?.locationCodeableConcept?.extension?.[1]?.valueCoding?.code || 'N/A'}</p>
              <p>Supplier Type: {item.item?.[0]?.locationCodeableConcept?.extension?.[2]?.valueCoding?.display || 'N/A'}</p>
            </div>

            {/* Financial Information Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Financial Information</h2>
              <p>
                Payment Amount: <span className="font-medium">${(item.payment?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Submitted Charge: <span className="font-medium">${(item.item?.[0]?.adjudication?.[8]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Allowed Charge: <span className="font-medium">${(item.item?.[0]?.adjudication?.[9]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Medicare Payment: <span className="font-medium">${(item.item?.[0]?.adjudication?.[2]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Provider Payment: <span className="font-medium">${(item.item?.[0]?.adjudication?.[4]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Beneficiary Payment: <span className="font-medium">${(item.item?.[0]?.adjudication?.[3]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Deductible: <span className="font-medium">${(item.item?.[0]?.adjudication?.[5]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Coinsurance: <span className="font-medium">${(item.item?.[0]?.adjudication?.[7]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Primary Payer Paid: <span className="font-medium">${(item.item?.[0]?.adjudication?.[6]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                DME Purchase Price: <span className="font-medium">${(item.item?.[0]?.adjudication?.[1]?.amount?.value || 0).toFixed(2)}</span>
              </p>
              <p>
                Primary Allowed Charge: <span className="font-medium">${(item.item?.[0]?.adjudication?.[0]?.amount?.value || 0).toFixed(2)}</span>
              </p>
            </div>

            {/* Item Details Panel */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Item Details</h2>
              <p>Medication: {item.item?.[0]?.extension?.[7]?.valueCoding?.display || 'N/A'}</p>
              <p>Quantity: {item.item?.[0]?.quantity?.value || 'N/A'}</p>
              <p>MTUS Count: {item.item?.[0]?.extension?.[2]?.valueQuantity?.value || 'N/A'}</p>
              <p>Service Category: {item.item?.[0]?.category?.coding?.[0]?.display || 'N/A'}</p>
              <p>HCPCS Code: {item.item?.[0]?.service?.coding?.[0]?.code || 'N/A'}</p>
            </div>

            {/* Observations Panel */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Observations</h2>
              <p>Hematocrit Test Result: {item.contained?.[1]?.valueQuantity?.value || 'N/A'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GetDme;