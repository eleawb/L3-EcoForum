import {  Routes, Route } from 'react-router-dom'; 
import Accueil from './pages/accueil'; 
import Recherche from './pages/recherche';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/recherche" element={<Recherche />} />
    </Routes>
  );
}

export default App;