import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import CreateLottery from './pages/CreateLottery';
import DrawLottery from './pages/DrawLottery';
import ViewLottery from './pages/ViewLottery';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateLottery />} />
          <Route path="/draw/:lotteryId" element={<DrawLottery />} />
          <Route path="/view/:lotteryId" element={<ViewLottery />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
