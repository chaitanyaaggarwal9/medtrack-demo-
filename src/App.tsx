import { Route, Routes } from 'react-router';
import AboutPage from './pages/AboutPage.tsx';
import LandingPage from './pages/LandingPage.tsx';
import MedicineFormPage from './pages/MedicineFormPage.tsx';
import MedicinesPage from './pages/MedicinesPage.tsx';
import TodayRoute from './pages/TodayRoute.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/app" element={<TodayRoute />} />
      <Route path="/app/medicines" element={<MedicinesPage />} />
      <Route path="/app/medicines/new" element={<MedicineFormPage />} />
      <Route path="/app/medicines/:id/edit" element={<MedicineFormPage />} />
    </Routes>
  );
}
