import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProblemSetting from './pages/ProblemSetting';

function App() {
  const isLoggedIn = true; // TODO: Replace with actual authentication logic
  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen">
        {isLoggedIn && <Sidebar />}
        <Routes>
          <Route index element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/problemsetting" element={<ProblemSetting />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
