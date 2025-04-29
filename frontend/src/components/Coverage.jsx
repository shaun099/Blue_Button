import React, { useState, useEffect } from "react";
import axios from "axios";

const Coverage = () => {
  const [coverageData, setCoverageData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to summarize repeating fields (e.g., buyin, dual)
  const summarizeRepeatingFields = (extensions, fieldPrefix, fieldCount) => {
    const values = [];
    for (let i = 1; i <= fieldCount; i++) {
      const fieldNum = i.toString().padStart(2, "0");
      const field = extensions.find(ext => ext.url === `https://bluebutton.cms.gov/resources/variables/${fieldPrefix}${fieldNum}`);
      values.push(field?.valueCoding?.display || field?.valueCoding?.code || "N/A");
    }

    // Check if all values are the same
    const uniqueValues = [...new Set(values)];
    if (uniqueValues.length === 1) {
      return uniqueValues[0] === "N/A" ? "N/A" : `${uniqueValues[0]} for all months`;
    }

    // Group by value and months
    let summary = "";
    let currentValue = values[0];
    let startMonth = 1;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 1; i <= values.length; i++) {
      if (i === values.length || values[i] !== currentValue) {
        const endMonth = i;
        const monthRange = startMonth === endMonth ? monthNames[startMonth - 1] : `${monthNames[startMonth - 1]}-${monthNames[endMonth - 1]}`;
        summary += `${currentValue} for ${monthRange}${i === values.length ? "" : ", "}`;
        startMonth = i + 1;
        currentValue = values[i];
      }
    }
    return summary || "N/A";
  };

  const extractCoverageData = (raw) => {
    const resource = raw.resource || {};

    const extensions = resource.extension || [];

    return {
      id: resource.id || "N/A",
      status: resource.status || "N/A",
      type: resource.type?.coding?.[0]?.code || "N/A",
      subscriberId: resource.subscriberId || "N/A",
      beneficiary: resource.beneficiary?.reference || "N/A",
      relationship: resource.relationship?.coding?.[0]?.display || "N/A",
      payor: resource.payor?.[0]?.identifier?.value || "N/A",
      group: resource.class?.find(c => c.type?.coding?.[0]?.code === "group")?.value || "N/A",
      plan: resource.class?.find(c => c.type?.coding?.[0]?.code === "plan")?.value || "N/A",
      medicareStatus: extensions.find(ext => ext.url === "https://bluebutton.cms.gov/resources/variables/ms_cd")?.valueCoding?.display || "N/A",
      esrdStatus: extensions.find(ext => ext.url === "https://bluebutton.cms.gov/resources/variables/esrd_ind")?.valueCoding?.display || "N/A",
      referenceYear: extensions.find(ext => ext.url === "https://bluebutton.cms.gov/resources/variables/rfrnc_yr")?.valueDate || "N/A",
      stateBuyIn: summarizeRepeatingFields(extensions, "buyin", 12),
      dualEligibility: summarizeRepeatingFields(extensions, "dual_", 12),
      lastUpdated: resource.meta?.lastUpdated || "N/A",
    };
  };

  // Define which fields to display
  const displayFields = [
    { key: "id", label: "Coverage ID" },
    { key: "status", label: "Status" },
    { key: "type", label: "Coverage Type" },
    { key: "subscriberId", label: "Subscriber ID" },
    { key: "beneficiary", label: "Beneficiary" },
    { key: "relationship", label: "Relationship" },
    { key: "payor", label: "Payer" },
    { key: "group", label: "Group" },
    { key: "plan", label: "Plan" },
    { key: "medicareStatus", label: "Medicare Status" },
    { key: "esrdStatus", label: "ESRD Status" },
    { key: "referenceYear", label: "Reference Year" },
    { key: "stateBuyIn", label: "State Buy-in" },
    { key: "dualEligibility", label: "Dual Eligibility" },
    { key: "lastUpdated", label: "Last Updated" },
  ];

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5500/api/coverage/", {
        withCredentials: true,
      });

      console.log("Raw response:", res.data);

      let rawData;
      if (typeof res.data === "string") {
        try {
          rawData = JSON.parse(res.data);
        } catch (parseErr) {
          console.error("Failed to parse JSON:", parseErr);
          throw new Error("Invalid JSON data received from server");
        }
      } else {
        rawData = res.data;
      }

      const dataArray = rawData.entry
        ? Array.isArray(rawData.entry)
          ? rawData.entry
          : [rawData.entry]
        : Array.isArray(rawData)
        ? rawData
        : [];

      const parsedData = dataArray.map(extractCoverageData);

      setCoverageData(parsedData);
      setError("");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        window.location.href = "http://localhost:5500/api/auth/login";
      } else {
        setError(err.message || "Failed to fetch coverage data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "done") {
      fetchCoverage();
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Coverage List</h1>
        <button
          onClick={fetchCoverage}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Coverage"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading coverage data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coverageData.length > 0 ? (
            coverageData.map((coverage, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                {displayFields.map((field) => (
                  <div key={field.key} className="text-gray-600 mt-2">
                    <span className="font-semibold">{field.label}:</span>{" "}
                    {coverage[field.key]}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">No coverage found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Coverage;