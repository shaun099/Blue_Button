// src/components/GetPatientEob.jsx
import React, { useState } from 'react';
import axios from 'axios';

const GetPatientEob = () => {
  const [eobData, setEobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5500/api/eob/', {
          withCredentials:true
        });
        setEobData(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch patient EOB data. Please try again.');
        setLoading(false);
        console.error(err);
      }
    };

  //  useEffect(() => {
  //      const params = new URLSearchParams(window.location.search);
  //      if (params.get("auth") === "done") {
  //        ;
  //      }
  //    }, []);
 

  //if (loading) return <div className="text-center text-gray-500">Loading...</div>;
  //if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Patient Explanation of Benefit Data</h1>
      <button
          onClick={fetchData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          
        >
          {loading ? "Loading..." : "Get EoB"}
        </button>
      
      {eobData.length === 0 ? (
        <p className="text-center text-gray-500">No data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eobData.map((item, index) => (
            <div key={item.id || index} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-600">Claim ID: {item.id}</h2>
              <p className="text-gray-700"><strong>Patient:</strong> {item.patientReference}</p>
              <p className="text-gray-700"><strong>Status:</strong> {item.status}</p>
              <p className="text-gray-700"><strong>Type:</strong> {item.type}</p>
              <p className="text-gray-700">
                <strong>Billable Period:</strong> {item.billablePeriod.start} to {item.billablePeriod.end}
              </p>
              <p className="text-gray-700"><strong>Org NPI:</strong> {item.organizationNPI}</p>
              <p className="text-gray-700"><strong>Facility Type:</strong> {item.facilityType}</p>
              <p className="text-gray-700"><strong>Facility NPI:</strong> {item.facilityNPI}</p>
              <p className="text-gray-700"><strong>Service Date:</strong> {item.servicedDate}</p>
              <p className="text-gray-700"><strong>Medication:</strong> {item.medication}</p>
              <div className="text-gray-700">
                <strong>Quantity:</strong>
                <ul className="list-disc list-inside">
                  <li>Value: {item.quantity.value}</li>
                  <li>Fill #: {item.quantity.fillNum}</li>
                  <li>Days Supply: {item.quantity.daysSupply}</li>
                </ul>
              </div>
              <div className="text-gray-700">
                <strong>Adjudications:</strong>
                <ul className="list-disc list-inside">
                  {item.adjudications.map((adj, idx) => (
                    <li key={idx}>
                      {adj.category}: ${adj.amount} ({adj.currency})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-gray-700">
                <strong>Information:</strong>
                <ul className="list-disc list-inside">
                  {item.information.map((info, idx) => (
                    <li key={idx}>
                      Seq {info.sequence}: {info.category} - {info.code}
                    </li>
                  ))}
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