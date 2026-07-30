import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ToolsIndex from './pages/tools/ToolsIndex';
import BurnCreate from './pages/tools/BurnCreate';
import BurnRead from './pages/tools/BurnRead';
import ChatRoom from './pages/tools/ChatRoom';
import Base64Tool from './pages/tools/Base64Tool';
import UrlEncodeTool from './pages/tools/UrlEncodeTool';
import BaseConvertTool from './pages/tools/BaseConvertTool';
import JsonFormatTool from './pages/tools/JsonFormatTool';
import UuidTool from './pages/tools/UuidTool';
import TimestampTool from './pages/tools/TimestampTool';

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
        <Route path="/tools/chat" element={<ChatRoom />} />
        <Route path="/tools/chat/:id" element={<ChatRoom />} />
        <Route path="/tools/base64" element={<Base64Tool />} />
        <Route path="/tools/url-encode" element={<UrlEncodeTool />} />
        <Route path="/tools/base-convert" element={<BaseConvertTool />} />
        <Route path="/tools/json-format" element={<JsonFormatTool />} />
        <Route path="/tools/uuid" element={<UuidTool />} />
        <Route path="/tools/timestamp" element={<TimestampTool />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
