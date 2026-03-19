import {  Routes, Route } from 'react-router-dom'; 
import Accueil from './pages/accueil'; 
import Recherche from './pages/recherche';
import Ajout from './pages/ajout';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/recherche" element={<Recherche />} />
      <Route path="/ajout" element={<Ajout />} />

    </Routes>
  );
}

export default App;