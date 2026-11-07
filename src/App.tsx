import { Route, Routes } from 'react-router';
import AddMedicinePage from './pages/AddMedicinePage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import TodayPage from './pages/TodayPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<TodayPage />} />
      <Route path="/app/medicines/new" element={<AddMedicinePage />} />
    </Routes>
  );
}
