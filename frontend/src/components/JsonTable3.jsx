import React, { useEffect, useState } from "react";
import axios from "axios";

const JsonTable3 = () => {
  const [data, setData] = useState([]);
  const [TableComponent, setTableComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const mod = await import("@ehvenga/json-to-html-table");
        console.log(mod); // Debugging: Check module exports
        setTableComponent(() => mod.JsonToTable); // Store the imported function
      } catch (err) {
        console.error("Failed to load JsonToTable module:", err);
        setError("Failed to load table component");
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "done") {
      fetchPatientData();
    }

    loadComponent();
  }, []);

  const fetchPatientData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5500/api/eob?type=snf", {
        withCredentials: true,
      });
      const json = response.data;
      setData(json.entry ? json.entry.map((e) => e.resource) : json);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "http://localhost:5500/api/auth/login";
      } else {
        console.error("Error fetching patient data:", err);
        setError("Failed to fetch data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">EOB(snf)</h2>
      <button
        onClick={fetchPatientData}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Fetch Data"}
      </button>
      <div className="overflow-x-auto">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {isLoading && <p>Loading data...</p>}
        {!isLoading && !error && TableComponent ? (
          data.length === 0 ? (
            <p>No data available</p>
          ) : (
            // If JsonToTable is not a React component, you may need to modify this
            // e.g., <div dangerouslySetInnerHTML={{ __html: TableComponent(data) }} />
            <TableComponent data={data} />
          )
        ) : (
          !isLoading && !error && <p>Loading table component...</p>
        )}
      </div>
    </div>
  );
};

export default JsonTable3;