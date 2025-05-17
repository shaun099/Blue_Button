import React from "react";
import PatientInfo from "./components/PatientInfo";
import GetPatientEob from "./components/GetPatientEob";
import GetPatientCoverage from "./components/GetPatientCoverage";


const App = () => {
    return (
        <div className="container mx-auto p-4">
            <PatientInfo/>
            <GetPatientEob/>
            <GetPatientCoverage/>
        </div>
    );
};
export default App;
