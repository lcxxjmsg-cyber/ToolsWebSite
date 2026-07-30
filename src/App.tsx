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
import Base32Tool from './pages/tools/Base32Tool';
import HtmlEntityTool from './pages/tools/HtmlEntityTool';
import ColorConvertTool from './pages/tools/ColorConvertTool';
import CaseConvertTool from './pages/tools/CaseConvertTool';
import JsonCsvTool from './pages/tools/JsonCsvTool';
import HashTool from './pages/tools/HashTool';
import PasswordTool from './pages/tools/PasswordTool';
import RotTool from './pages/tools/RotTool';
import JwtDecoderTool from './pages/tools/JwtDecoderTool';
import RegexTool from './pages/tools/RegexTool';
import TextDiffTool from './pages/tools/TextDiffTool';
import ImageBase64Tool from './pages/tools/ImageBase64Tool';
import ColorPickerTool from './pages/tools/ColorPickerTool';

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
        <Route path="/tools/base32" element={<Base32Tool />} />
        <Route path="/tools/html-entity" element={<HtmlEntityTool />} />
        <Route path="/tools/color-convert" element={<ColorConvertTool />} />
        <Route path="/tools/case-convert" element={<CaseConvertTool />} />
        <Route path="/tools/json-csv" element={<JsonCsvTool />} />
        <Route path="/tools/hash" element={<HashTool />} />
        <Route path="/tools/password" element={<PasswordTool />} />
        <Route path="/tools/rot" element={<RotTool />} />
        <Route path="/tools/jwt" element={<JwtDecoderTool />} />
        <Route path="/tools/regex" element={<RegexTool />} />
        <Route path="/tools/text-diff" element={<TextDiffTool />} />
        <Route path="/tools/image-base64" element={<ImageBase64Tool />} />
        <Route path="/tools/color-picker" element={<ColorPickerTool />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
