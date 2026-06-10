import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Tabs } from './components';
import './global.css';
import { useEventListener } from './hooks';
import Login from './routes/login';
import Special from './routes/special';
import Todos from './routes/todos';
import { disableTransitions } from './utils';

export function App() {
  useEventListener('resize', disableTransitions);

  return (
    <BrowserRouter>
      <Tabs items={['Login', 'Todos', 'Special']} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/special" element={<Special />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <App />
  // </StrictMode>
);
