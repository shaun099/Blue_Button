import React from "react";
import GetPatientsList from "./components/GetPatientsList"; // Renamed import


const App = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Patient List</h1>
            <GetPatientsList /> {/* Use renamed component */}
        </div>
    );
};

export default App;
