import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper for formatting currency
const fmt = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : "-";

const CarrierEOB = () => {
  const [carrierData, setCarrierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const apiUrl='http"//localhost:5500/api/eob/';

  // Fetch function
  const fetchCarrierData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiUrl, { withCredentials: true });
      setCarrierData(res.data);
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        window.location.href = 'http://localhost:5500/api/auth/login';
      } else {
        setError('Failed to fetch Carrier EOB data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarrierData();
    // eslint-disable-next-line
  }, [apiUrl]);

  if (loading) return <div className="container mx-auto p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="container mx-auto p-6 text-center text-red-500">{error}</div>;

  if (!carrierData)
    return (
      <div className="container mx-auto p-6 text-center text-gray-500">
        No Carrier EOB data available.
      </div>
    );

  const { claimInfo, patient, providers, insurance, lineItems, diagnoses, testResults, financials, meta } = carrierData;

  // Format date
  const formatDate = (dateStr) =>
    dateStr && dateStr !== 'N/A'
      ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Carrier EOB Details</h1>
        <button
          onClick={fetchCarrierData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Carrier Data'}
        </button>
      </div>

      {/* Claim Info */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Claim Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><span className="font-medium">Claim ID:</span> {claimInfo.id}</p>
          <p><span className="font-medium">Type:</span> {claimInfo.type}</p>
          <p><span className="font-medium">Status:</span> {claimInfo.status}</p>
          <p><span className="font-medium">Outcome:</span> {claimInfo.outcome}</p>
          <p><span className="font-medium">Service Period:</span> {claimInfo.servicePeriod?.start} — {claimInfo.servicePeriod?.end}</p>
          <p><span className="font-medium">Received Date:</span> {formatDate(claimInfo.receivedDate)}</p>
        </div>
      </section>

      {/* Patient Info */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Patient</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><span className="font-medium">Reference:</span> {patient.id}</p>
          <p><span className="font-medium">Medicare ID:</span> {patient.medicareId}</p>
        </div>
      </section>

      {/* Providers */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Providers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-1 text-left">Seq</th>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">NPI</th>
                <th className="px-2 py-1 text-left">Role</th>
                <th className="px-2 py-1 text-left">Specialty</th>
                <th className="px-2 py-1 text-left">Responsible</th>
              </tr>
            </thead>
            <tbody>
              {providers.allMembers.map((p) => (
                <tr key={p.sequence}>
                  <td className="px-2 py-1">{p.sequence}</td>
                  <td className="px-2 py-1">{p.name}</td>
                  <td className="px-2 py-1">{p.npi}</td>
                  <td className="px-2 py-1">{p.role}</td>
                  <td className="px-2 py-1">{p.specialty || '-'}</td>
                  <td className="px-2 py-1">{p.isResponsible ? 'Yes' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insurance */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Insurance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><span className="font-medium">Type:</span> {insurance.type}</p>
          <p><span className="font-medium">Payer Name:</span> {insurance.payer.name}</p>
          <p><span className="font-medium">Payer ID:</span> {insurance.payer.id}</p>
          <p><span className="font-medium">Assigned Claim:</span> {insurance.isAssigned ? 'Yes' : 'No'}</p>
        </div>
      </section>

      {/* Diagnoses */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Diagnoses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-1">Seq</th>
                <th className="px-2 py-1">Code</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1">Type</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.map((d) => (
                <tr key={d.sequence}>
                  <td className="px-2 py-1">{d.sequence}</td>
                  <td className="px-2 py-1">{d.code}</td>
                  <td className="px-2 py-1">{d.description}</td>
                  <td className="px-2 py-1">{d.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Line Items */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Service Line Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-1">Line</th>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Proc Code</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1">Qty</th>
                <th className="px-2 py-1">NDC</th>
                <th className="px-2 py-1">Modifiers</th>
                <th className="px-2 py-1">Place of Service</th>
                <th className="px-2 py-1">Diagnoses</th>
                <th className="px-2 py-1">Care Team</th>
                <th className="px-2 py-1">Submitted</th>
                <th className="px-2 py-1">Allowed</th>
                <th className="px-2 py-1">Paid</th>
                <th className="px-2 py-1">Coinsur.</th>
                <th className="px-2 py-1">Deductible</th>
                <th className="px-2 py-1">NonCov.</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.lineNumber}>
                  <td className="px-2 py-1">{li.lineNumber}</td>
                  <td className="px-2 py-1">{li.serviceDate}</td>
                  <td className="px-2 py-1">{li.procedureCode}</td>
                  <td className="px-2 py-1">{li.procedureDescription}</td>
                  <td className="px-2 py-1">{li.quantity || '-'}</td>
                  <td className="px-2 py-1">{li.ndcCode || '-'}</td>
                  <td className="px-2 py-1">
                    {(li.modifiers || []).map((m) => (
                      <span key={m.code} className="inline-block mr-1">
                        {m.code} ({m.description})
                      </span>
                    ))}
                  </td>
                  <td className="px-2 py-1">
                    {li.placeOfService?.code
                      ? `${li.placeOfService.code} (${li.placeOfService.description || ''})`
                      : '-'}
                  </td>
                  <td className="px-2 py-1">
                    {(li.diagnoses || []).map((d) => d.code).join(', ') || '-'}
                  </td>
                  <td className="px-2 py-1">
                    {(li.careTeam || []).map((p) => p.name).join(', ') || '-'}
                  </td>
                  <td className="px-2 py-1">{fmt(li.pricing.submitted)}</td>
                  <td className="px-2 py-1">{fmt(li.pricing.allowed)}</td>
                  <td className="px-2 py-1">{fmt(li.pricing.payment)}</td>
                  <td className="px-2 py-1">{fmt(li.pricing.patientResponsibility.coinsurance)}</td>
                  <td className="px-2 py-1">{fmt(li.pricing.patientResponsibility.deductible)}</td>
                  <td className="px-2 py-1">{fmt(li.pricing.patientResponsibility.nonCovered)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Test Results */}
      {testResults && testResults.length > 0 && (
        <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-2 py-1">Test Name</th>
                  <th className="px-2 py-1">Code</th>
                  <th className="px-2 py-1">Result</th>
                  <th className="px-2 py-1">Unit</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((tr) => (
                  <tr key={tr.testId}>
                    <td className="px-2 py-1">{tr.testName}</td>
                    <td className="px-2 py-1">{tr.code}</td>
                    <td className="px-2 py-1">{tr.result}</td>
                    <td className="px-2 py-1">{tr.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Financials */}
      <section className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Financials Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><span className="font-medium">Total Submitted:</span> {fmt(financials.totals.submitted)}</p>
          <p><span className="font-medium">Total Allowed:</span> {fmt(financials.totals.allowed)}</p>
          <p><span className="font-medium">Total Paid:</span> {fmt(financials.totals.paid)}</p>
          <p><span className="font-medium">Patient Coinsurance:</span> {fmt(financials.totals.patientResponsibility.coinsurance)}</p>
          <p><span className="font-medium">Patient Deductible:</span> {fmt(financials.totals.patientResponsibility.deductible)}</p>
          <p><span className="font-medium">Patient Non-Covered:</span> {fmt(financials.totals.patientResponsibility.nonCovered)}</p>
          <p><span className="font-medium">Payment Method:</span> {financials.payment.method}</p>
          <p><span className="font-medium">Payment Amount:</span> {fmt(financials.payment.amount)}</p>
          <p><span className="font-medium">Payment Date:</span> {formatDate(financials.payment.date)}</p>
        </div>
      </section>

      {/* Meta */}
      <section className="mb-2 text-xs text-gray-500">
        <div>Last Updated: {meta.lastUpdated}</div>
        <div>Profile: {meta.profile}</div>
      </section>
    </div>
  );
};

export default CarrierEOB;