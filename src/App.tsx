import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ToolsIndex from './pages/tools/ToolsIndex';
import BurnCreate from './pages/tools/BurnCreate';
import BurnRead from './pages/tools/BurnRead';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/burn" element={<BurnCreate />} />
        <Route path="/tools/burn/:id" element={<BurnRead />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
