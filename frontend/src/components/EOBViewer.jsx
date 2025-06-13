import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Enhanced currency formatter
const fmt = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "-";

// Date formatter with better handling
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (e) {
    console.log(e)
    return dateStr; // Return original if parsing fails
  }
};

const CarrierEOB = () => {
  const [carrierData, setCarrierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    claimInfo: true,
    patient: true,
    providers: false,
    insurance: false,
    diagnoses: false,
    lineItems: false,
    testResults: false,
    financials: true
  });
  const apiUrl = 'http://localhost:5500/api/eob/';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarrierData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-6">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button 
          onClick={fetchCarrierData}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!carrierData) return (
    <div className="container mx-auto p-6 text-center text-gray-500">
      No Carrier EOB data available.
    </div>
  );

  const { claimInfo, patient, providers, insurance, lineItems, diagnoses, testResults, financials, meta } = carrierData;

  // Calculate financial percentages for visual indicators
  const paidPercentage = financials.totals.allowed > 0 
    ? (financials.totals.paid / financials.totals.allowed) * 100 
    : 0;

  return (
    <div className="container mx-auto p-4 md:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Explanation of Benefits</h1>
          <p className="text-gray-600">Claim ID: {claimInfo.id}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={fetchCarrierData}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
          <div className="bg-blue-100 text-blue-800 py-2 px-4 rounded-lg text-sm">
            <span className="font-medium">Last Updated:</span> {formatDate(meta.lastUpdated)}
          </div>
        </div>
      </div>

      {/* Status Summary Card */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Claim Summary</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  claimInfo.status === 'processed' ? 'bg-green-100 text-green-800' :
                  claimInfo.status === 'denied' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  Status: {claimInfo.status}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  claimInfo.outcome === 'paid' ? 'bg-green-100 text-green-800' :
                  claimInfo.outcome === 'denied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Outcome: {claimInfo.outcome}
                </span>
                <span className="text-sm text-gray-600">
                  Service Date: {formatDate(claimInfo.servicePeriod?.start)} to {formatDate(claimInfo.servicePeriod?.end)}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-bold">{fmt(financials.totals.submitted)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Allowed</p>
                  <p className="font-bold">{fmt(financials.totals.allowed)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="font-bold text-green-600">{fmt(financials.totals.paid)}</p>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${paidPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {paidPercentage.toFixed(1)}% of allowed amount paid
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Info Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('claimInfo')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Claim Information</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.claimInfo ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.claimInfo && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Claim ID</p>
                <p className="font-medium">{claimInfo.id}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Claim Type</p>
                <p className="font-medium">{claimInfo.type}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Received Date</p>
                <p className="font-medium">{formatDate(claimInfo.receivedDate)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Service Period</p>
                <p className="font-medium">
                  {formatDate(claimInfo.servicePeriod?.start)} — {formatDate(claimInfo.servicePeriod?.end)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Processing Date</p>
                <p className="font-medium">{formatDate(claimInfo.processedDate || 'N/A')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Patient Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('patient')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Patient Information</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.patient ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.patient && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Patient Reference</p>
                <p className="font-medium">{patient.id}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Medicare ID</p>
                <p className="font-medium">{patient.medicareId || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Providers Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('providers')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Providers ({providers.allMembers.length})</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.providers ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.providers && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NPI</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.allMembers.map((p) => (
                    <tr key={p.sequence} className={p.isResponsible ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{p.npi}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{p.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{p.specialty || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {p.isResponsible ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Insurance Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('insurance')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Insurance Information</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.insurance ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.insurance && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Insurance Type</p>
                <p className="font-medium">{insurance.type}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Payer Name</p>
                <p className="font-medium">{insurance.payer.name}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Payer ID</p>
                <p className="font-medium">{insurance.payer.id}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Claim Assignment</p>
                <p className="font-medium">
                  {insurance.isAssigned ? (
                    <span className="text-green-600">Assigned to provider</span>
                  ) : (
                    <span className="text-yellow-600">Not assigned</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnoses Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('diagnoses')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Diagnoses ({diagnoses.length})</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.diagnoses ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.diagnoses && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sequence</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {diagnoses.map((d) => (
                    <tr key={d.sequence}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{d.sequence}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">{d.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{d.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {d.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Line Items Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('lineItems')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Service Line Items ({lineItems.length})</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.lineItems ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.lineItems && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allowed</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lineItems.map((li) => (
                    <tr key={li.lineNumber} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{li.lineNumber}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{li.serviceDate}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-blue-600">{li.procedureCode}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{li.procedureDescription}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{fmt(li.pricing.submitted)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{fmt(li.pricing.allowed)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                        <span className={`${li.pricing.payment > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {fmt(li.pricing.payment)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-800">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Showing {lineItems.length} line items
            </div>
          </div>
        )}
      </div>

      {/* Test Results Section */}
      {testResults && testResults.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button 
            onClick={() => toggleSection('testResults')}
            className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-gray-800">Test Results ({testResults.length})</h2>
            <svg 
              className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.testResults ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.testResults && (
            <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testResults.map((tr) => (
                      <tr key={tr.testId}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{tr.testName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600">{tr.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <span className={`${
                            tr.result === 'Positive' ? 'text-red-600' :
                            tr.result === 'Negative' ? 'text-green-600' : 
                            'text-gray-600'
                          }`}>
                            {tr.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{tr.unit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financials Section */}
      <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          onClick={() => toggleSection('financials')}
          className="w-full flex justify-between items-center p-4 md:p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-800">Financial Summary</h2>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${expandedSections.financials ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.financials && (
          <div className="p-4 md:p-6 pt-0 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Claim Totals</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Submitted:</span>
                    <span className="font-medium">{fmt(financials.totals.submitted)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Allowed:</span>
                    <span className="font-medium">{fmt(financials.totals.allowed)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-medium text-green-600">{fmt(financials.totals.paid)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Paid Percentage:</span>
                    <span className="font-medium">
                      {paidPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Responsibility</h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Coinsurance:</span>
                    <span className="font-medium text-red-600">{fmt(financials.totals.patientResponsibility.coinsurance)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Deductible:</span>
                    <span className="font-medium text-red-600">{fmt(financials.totals.patientResponsibility.deductible)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Non-Covered:</span>
                    <span className="font-medium text-red-600">{fmt(financials.totals.patientResponsibility.nonCovered)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Total Responsibility:</span>
                    <span className="font-medium text-red-600">
                      {fmt(
                        financials.totals.patientResponsibility.coinsurance +
                        financials.totals.patientResponsibility.deductible +
                        financials.totals.patientResponsibility.nonCovered
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{financials.payment.method || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Payment Amount</p>
                    <p className="font-medium text-green-600">{fmt(financials.payment.amount)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-medium">{formatDate(financials.payment.date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-8 mb-4">
        <p>Profile: {meta.profile}</p>
        <p>Data last fetched: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default CarrierEOB;