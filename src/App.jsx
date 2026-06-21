import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import GeneratePage from "./pages/GeneratePage";
import TrackPage from "./pages/TrackPage";
import { loadStorage, saveStorage } from "./utils/tracking";

export default function App() {
  const [storage, setStorage] = useState(loadStorage());

  useEffect(() => {
    saveStorage(storage);
  }, [storage]);

  return (
    <HashRouter>
      <Routes>
        {/* Admin route to generate tracking numbers */}
        <Route path="/" element={<GeneratePage storage={storage} setStorage={setStorage} />} />
        
        {/* Public routes for tracking */}
        <Route path="/track" element={<TrackPage storage={storage} />} />
        <Route path="/track/:trackingNumber" element={<TrackPage storage={storage} />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
