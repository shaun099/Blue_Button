import React from "react";

import GetPatientEob from "./components/GetPatientEob";


import JsonTable1 from "./components/Coverage";
import JsonTable2 from "./components/Jsontable2";
import JsonTable3 from "./components/JsonTable3";
import PatientDetails from "./components/PatientDetails";



const App = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Patient data</h1>
            <PatientDetails/> {/* finalized */}
            
            {/* <GetPatientEob /> */}
            
            <JsonTable1 />

            <JsonTable2/>

            <JsonTable3/>
           
           
        </div>
    );
};

export default App;
