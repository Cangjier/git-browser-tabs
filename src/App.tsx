import './App.css';
import { Home } from './lib/home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Settings } from './lib/settings';
import { AboutBlabk } from './lib/about_blank';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/about_blank' element={<AboutBlabk></AboutBlabk>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
