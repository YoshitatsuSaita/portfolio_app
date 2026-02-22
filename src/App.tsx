import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Medications from './pages/Medications/Medications';
import Calendar from './pages/Calendar/Calendar';
import NotFound from './pages/NotFound/NotFound';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          error: {
            duration: 5000,
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="medications" element={<Medications />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="*" element={<NotFound />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
