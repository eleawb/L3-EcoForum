import {  Routes, Route } from 'react-router-dom'; 
import Accueil from './pages/accueil'; //menu initial
import Recherche from './pages/recherche'; //formulaire recherche de données
import Ajout from './pages/ajout';//choix du format d'ajout de données
import User from './pages/user'; //paramètres user
import Maintenance from './pages/maintenance'; //paramètres capteurs
import Connexion from './pages/connexion'; //paramètres connexion
import DepotFichier from './pages/depotFichier'; //Formulaire de depot de fichier
import SaisieManuelle from './pages/saisieManuelle';//Saisie Manuelle dinfomrations
import AjoutLigne from './pages/ajoutligne'; //Ajout manuelle de lignes pour une saisie manuelle




function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/recherche" element={<Recherche />} />
      <Route path="/ajout" element={<Ajout />} />
      <Route path="/user" element={<User />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/depotFichier" element={<DepotFichier />} />
      <Route path="/saisieManuelle" element={<SaisieManuelle />} />
      <Route path="/ajoutligne" element={<AjoutLigne />} />


    </Routes>
  );
}

export default App;