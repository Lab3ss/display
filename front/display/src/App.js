import React from "react";
import { MobileView, BrowserView } from "react-device-detect";
import Mobile from "./mobile/Mobile";
import Desktop from "./desktop/Desktop";
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserView style={{height: '100vh'}}>
        <Desktop />
      </BrowserView>
      <MobileView style={{height: '100vh'}}>
        <Mobile />
      </MobileView>
    </div>
  );
}

export default App;
