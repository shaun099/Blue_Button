import React from "react";
import PatientInfo from "./components/PatientInfo";
import GetPatientEob from "./components/GetPatientEob";
import CarrierEOB from "./components/EOBViewer";


const App = () => {
    return (
        <div className="container mx-auto p-4">
            {/* <PatientInfo/>
            <GetPatientEob/> */}
            <CarrierEOB/>
            
        </div>
    );
};
export default App;
