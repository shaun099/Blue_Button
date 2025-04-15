import React from "react";
import GetPatientsList from "./components/GetPatientsList"; // Renamed import
import GetPatientEob from "./components/GetPatientEob";
import ClaimDetails from "./components/ClaimDetails";
import GetDme from "./components/GetDme";



const App = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Patient List</h1>
            <GetPatientsList /> {/* Use renamed component */}
            {/* <GetPatientEob /> */}
            <ClaimDetails/>
            <GetDme/>
           
        </div>
    );
};

export default App;
