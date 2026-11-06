import { Route, Routes } from 'react-router';
import LandingPage from './pages/LandingPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}
