import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; //pr navigation
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { TimepickerUI } from "timepicker-ui"; //choix heure
import "timepicker-ui/main.css";
import {
  Radio,
  RadioGroup,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container, //centrer avec des marges
  Box, //conteneur principal
  Paper,
  Card,
  CardContent,
  TextField,
  Stack, //aligner boutons en colonne par ex
  FormControl,
  FormLabel,
  InputLabel,
  RadioGroup as MuiRadioGroup,
  Select,
  MenuItem,
  CircularProgress, //barre de progression %
  FormControlLabel
} from '@mui/material'; //import MUI

function Recherche() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [choixCI, setChoixCI] = useState('capteurs'); // Valeur par défaut
    const [categories, setCategories] = useState<any[]>([]);
    const [nomsElements, setElementsNames]= useState<string[]>(['']); //tab des noms capteurs init à vide
    const [nombreElements, setNombreElements] = useState<number>(1);
    

 // États pour les capteurs et instruments de la BDD
 const [capteursDisponibles, setCapteursDisponibles] = useState<any[]>([]);
 const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isOk, setOk] = useState(true);


 //pour selectionner les capteurs correspondant à l'instrument, etc
 const [capteursParInstrument, setCapteursParInstrument] = useState<{ [key: number]: any[] }>({}); //stocke les capteurs par instru
  const [instrumentSelectionne, setInstrumentSelectionne] = useState<string>('');
  const [capteursSelectionnes, setCapteursSelectionnes] = useState<{ [key: number]: string }>({}); //stocke le capteur par instru
const[categorieSelectionnee, setCategorieSelectionnee] = useState<string>('');
const [capteursFiltres, setCapteursFiltres] = useState<any[]>([]); //filtre de catégorie
const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<{ [key: number]: string }>({});
const [categoriesFiltrees, setCategoriesFiltrees] = useState<{ [key: number]: any[] }>({});
const [instrumentsFiltres, setInstrumentsFiltres] = useState<{[key:number]: any[] }>({});

//methode de datation
const [choixDate, setChoixDate] = useState(''); // Valeur par défaut
//dates journalières pr le filtre
const [jourdeb, setJourDeb] = useState('');
const [jourfin, setJourFin] = useState('');
//heures pr le filtre
const [heuredeb, setHeureDeb] = useState('');
const [heurefin, setHeureFin] = useState('');
//dates hebdomadaires pr le filtre
const [semainedeb, setSemaineDeb] = useState('');
const [semainefin, setSemaineFin] = useState('');
//dates mensuelles pr le filtre
const [moisdeb, setMoisDeb] = useState('');
const [moisfin, setMoisFin] = useState('');
//dates annuelles pr le filtre
const [anneedeb, setAnneeDeb] = useState('');
const [anneefin, setAnneeFin] = useState('');

console.log("test debug avant useEffect");
    // Charger les capteurs depuis la BDD au chargement de la page
  useEffect(() => {
    const fetchData = async () => {
      console.log("début du fetch data");
      try {
        const [capteursRes, instrumentsRes] = await Promise.all([fetch('http://localhost:3000/api/capteurs'),fetch('http://localhost:3000/api/instruments')]);
        
        const capteursData = await capteursRes.json();
        console.log("capteurs reçus");
        setCapteursDisponibles(capteursData || []);
        console.log(`capteursData : ${capteursData}`);
        
        const instrumentsData = await instrumentsRes.json();
        console.log("instruments reçus");
        setInstrumentsDisponibles(instrumentsData || []); 
        console.log(`instrumentsData : ${instrumentsData}`);
        
        const categoriesRes = await fetch('http://localhost:3000/api/categories');
        const categoriesData = await categoriesRes.json();
        console.log("Catégories reçues :", categoriesData);
        setCategories(categoriesData||[]);

        //initialiser avec tous les capteurs pr chaque index
        const initialFiltres: { [key: number]: any[] } = {};
        for (let i = 0; i < nomsElements.length; i++) {
          initialFiltres[i] = capteursData || [];
        }
        setCategoriesFiltrees(initialFiltres);
        console.log(categoriesFiltrees);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
        console.log("fetch fini");
      }
    };
    
    fetchData();
  }, []);

   // Gestion du nb d'éléments à sélectionner
   const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nb = parseInt(e.target.value) || 1;
    setNombreElements(nb);
    
    setElementsNames(prev => {
      const newNoms = [...prev];
      if (nb > prev.length) {
        for (let i = prev.length; i < nb; i++) {
          newNoms.push('');
        }
        return newNoms;
      } else {
        return newNoms.slice(0, nb);
      }
    });
     // maj categoriesFiltrees pour les nouveaux index
     setCategoriesFiltrees(prev => {
      const newFiltres = { ...prev };
      for (let i = 0; i < nb; i++) {
        if (!newFiltres[i]) {
          newFiltres[i] = capteursDisponibles;
        }
      }
      Object.keys(newFiltres).forEach(key => {
        if (parseInt(key) >= nb) {
          delete newFiltres[parseInt(key)];
        }
      });
      return newFiltres;
    });

 // Aussi pour categoriesSelectionnees
 setCategoriesSelectionnees(prev => {
  const newSelections = { ...prev };
  Object.keys(newSelections).forEach(key => {
    if (parseInt(key) >= nb) {
      delete newSelections[parseInt(key)];
    }
  });
  return newSelections;
});
};

  //changement nom capteur
  const handleNomChange = (index: number, value: string) => {
    setElementsNames(prev => {
      const newNoms = [...prev];
      newNoms[index] = value;
      return newNoms;
    });
  };
  

  //changement d'instru
  const handleInstrumentChange = async (index: number, value: string) => {
    // maj du nom de l'instru
    setElementsNames(prev => {
      const newNoms = [...prev];
      newNoms[index] = value;
      return newNoms;
  });

    // Trouver l'instrument sélectionné
    const instrument = instrumentsDisponibles.find(i => i.modele === value);
    if (instrument) {
      try {
        const response = await fetch(`http://localhost:3000/api/capteurs/by-instrument/${instrument.id_instrument}`);
        const data = await response.json();
        setCapteursParInstrument(prev => ({
            ...prev,
            [index]: data || []
        }));
    } catch (error) {
        console.error('Erreur:', error);
        setCapteursParInstrument(prev => ({
            ...prev,
            [index]: []
        }));
    }
}
  }
//changement capteur sélectionné pr un instru
const handleCapteurChange = (instrumentIndex: number, capteurNom: string) => {
  setCapteursSelectionnes(prev => ({
      ...prev,
      [instrumentIndex]: capteurNom
  }));
};



  // Fonction pour récupérer les capteurs liés à un instrument
  const fetchCapteursParInstrument = async (instrumentId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/capteurs/by-instrument/${instrumentId}`);
      const data = await response.json();
      setCapteursParInstrument(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setCapteursParInstrument([]);
    }
  };
  


// Filtrer les capteurs par catégorie
const filtrerCapteursParCategorie = async (categorieNom: string) => {
  
  if (!categorieNom) {
      // Si aucune catégorie, afficher tous les capteurs
      const response = await fetch('http://localhost:3000/api/capteurs');
      const data = await response.json();
      setCapteursFiltres(data);
      return;
  }
  
  try {
      const response = await fetch('http://localhost:3000/api/capteurs/by-categorie', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categorie: categorieNom })
        });
        
      if (response.ok) {
        const data = await response.json();
        setCapteursFiltres(data);

        if (data.length === 0) {
          console.log(`Aucun capteur trouvé pour la catégorie: ${categorieNom}`);
          setOk(false);
      }
    } else {
        setCapteursFiltres([]);
        setOk(false);
    }
    
    
  } catch (error) {
      console.error('Erreur lors du filtrage:', error);
      setCapteursFiltres([]);
      setOk(false);
  }
};

//changement catégorie pr capteurs
const handleCategorieChange = async (index: number, value: string) => {
  setCategoriesSelectionnees(prev => ({
      ...prev,
      [index]: value
  }));
  
  if (!value) {
      setCategoriesFiltrees(prev => ({
          ...prev,
          [index]: capteursDisponibles
      }));
      return;
  }
  
  try {
      const response = await fetch('http://localhost:3000/api/capteurs/by-categorie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categorie: value })
      });
      
      if (response.ok) {
          const data = await response.json();
          setCategoriesFiltrees(prev => ({
              ...prev,
              [index]: data
          }));
      } else {
          setCategoriesFiltrees(prev => ({
              ...prev,
              [index]: []
          }));
      }
  } catch (error) {
      console.error('Erreur:', error);
      setCategoriesFiltrees(prev => ({
          ...prev,
          [index]: []
      }));
  }
};


//changement catégorie pr instruments
const handleCategorieChangeInstrument = async (index: number, value: string) => {
  setCategoriesSelectionnees(prev => ({
      ...prev,
      [index]: value
  }));
  
  if (!value) {
      setInstrumentsFiltres(prev => ({
          ...prev,
          [index]: instrumentsDisponibles
      }));
      return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/instruments/by-categorie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorie: value })
    });
    
    if (response.ok) {
        const data = await response.json();
        setInstrumentsFiltres(prev => ({
            ...prev,
            [index]: data
        }));
    } else {
        setInstrumentsFiltres(prev => ({
            ...prev,
            [index]: []
        }));
    }
} catch (error) {
    console.error('Erreur:', error);
    setInstrumentsFiltres(prev => ({
        ...prev,
        [index]: []
    }));
}
};
  

  
  // Réinitialisation du formulaire
  const resetForm = () => {
    setSearchTerm('');
    setElementsNames(['']); //on vide tout
    setNombreElements(1);
    setJourDeb('');
    setJourFin('');
    setHeureDeb('');
    setHeureFin('');
    setSemaineDeb('');
    setSemaineFin('');
    setInstrumentSelectionne('');
    setCapteursSelectionnes({});
    setCapteursParInstrument({});
  };

  //Données à afficher selon le choix
  const dataDisponibles = choixCI === 'capteurs' ? capteursDisponibles : instrumentsDisponibles;
  const labelUnite = choixCI === 'capteurs' ? 'capteur(s)' : 'instrument(s) de mesure'; //personnaliser affichage selon capteur ou instr
  const labelUniteSing = labelUnite === 'capteur(s)' ? 'capteur' : 'instrument de mesure'; //singulier

  const labelNom = choixCI === 'capteurs' ? 'Nom du capteur' : 'Nom de l\'instrument';


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // empêche le rechargement de la page
        let nomsRecherche: string[] = [];
        // mode capteur 
        if (choixCI === 'capteurs') {
          nomsRecherche = nomsElements.filter(nom => nom.trim());
        }
        else {
          //mode instrument, on recupere les capteurs séléctionnés
          nomsRecherche = Object.values(capteursSelectionnes).filter(c => c);
        }
        if (nomsRecherche.length === 0) {
          alert(`Veuillez sélectionner au moins un ${choixCI === 'capteurs' ? 'capteur' : 'instrument'}`);
          return;
        }
        try {
          //const endpoint = choixCI === 'capteurs' ? '/api/recherche' : '/api/recherche-instruments';
          const response = await fetch(`http://localhost:3000/api/recherche`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomsCapteurs: nomsRecherche,
          date: jourdeb,
          searchTerm
        })
      });
      const resultats = await response.json();
      console.log('Résultats de la recherche:', resultats);
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la recherche');
    }
  };

    return (
      <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                  flexGrow : 1 prend tt l'espace visuel dispo */}
      <AppBar position="static"
      sx={{
        bgcolor:"#0370B2",
      }}
      >
        <Toolbar>
        
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RECHERCHER DES DONNÉES
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">Formulaire de recherche</Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>

            
          
            <Box key={`choixCI-box`} sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <InputLabel>Veuillez choisir un type d'appareil :</InputLabel>
              <FormControl component="fieldset">
              <RadioGroup
              row
              value={choixCI}
              onChange={(e)=>{
                setChoixCI(e.target.value);
                setElementsNames(['']);
                setNombreElements(1);
                setCapteursParInstrument({});
                setCapteursSelectionnes({});
                setCategorieSelectionnee('');
                setCapteursFiltres([]);
            }}
              >
              <FormControlLabel value="instruments" control={<Radio />} label="Instrument(s) de mesure" />
              <FormControlLabel value="capteurs" control={<Radio />} label="Capteur(s)" />
                </RadioGroup>
              </FormControl>
              </Box>

            


 {/*mode CAPTEURS */}
 
{choixCI === 'capteurs' && (
    <>
        <TextField
            label="Nombre de capteur(s) recherché(s) :"
            type="number"
            value={nombreElements}
            onChange={handleNombreChange}
            inputProps={{ min: 1, max: 10 }}
            style= {{width: '32%'}}
            required
            fullWidth
        />

        {loading ? (
            <CircularProgress />
        ) : (
            nomsElements.map((nom, index) => {
                const listeCapteurs = categoriesSelectionnees[index]
                    ? (categoriesFiltrees[index] || [])
                    : capteursDisponibles;
                    
                return (
                    <Box key={`capteur-box-${index}`}  sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2}}>
                                  

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Filtrer par catégorie</InputLabel>
                            <Select
                                value={categoriesSelectionnees[index] || ''}
                                label={`Catégorie du capteur n°${index + 1}`}
                                onChange={(e) => handleCategorieChange(index, e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Toutes les catégories</em>
                                </MenuItem>
                                {categories.map((item) => (
                                    <MenuItem key={item.id_categorie} value={item.nom}>
                                        {item.nom}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {listeCapteurs.length === 0 ? (
                            <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                Aucun capteur ne correspond à la catégorie "{categoriesSelectionnees[index]}"
                            </Typography>
                        ) : (
                            <FormControl fullWidth required>
                                <InputLabel>Capteur n°{index + 1}</InputLabel>
                                <Select
                                    value={nom}
                                    label={`Capteur n°${index + 1}`}
                                    onChange={(e) => handleNomChange(index, e.target.value)}
                                >
                                    <MenuItem value="">
                                        <em>Sélectionnez un capteur</em>
                                    </MenuItem>
                                    {listeCapteurs.map((item) => {
                                        const isDisabled = nomsElements.includes(item.nom) && nomsElements[index] !== item.nom;
                                        return (
                                            <MenuItem key={item.id} value={item.nom} disabled={isDisabled}>
                                                {item.id} - {item.nom}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                );
            })
        )}
    </>
)}
    
                
  
   {/* mode INSTRUMENTS */}
   {choixCI === 'instruments' && (
                <>
                <TextField
                    label="Nombre d'instrument(s) recherché(s) :"
                    type="number"
                    value={nombreElements}
                    onChange={handleNombreChange}
                    inputProps={{ min: 1, max: 10 }}
                    required
                    fullWidth
                  />
            {loading ? (
            <CircularProgress />
        ) : instrumentsDisponibles.length === 0 ? (
            <Typography color="error">Aucun instrument trouvé</Typography>
            ) : (
              //liste instruments qui ont des capteurs appartenant a categorie
              nomsElements.map((selectedInstrument, index) => {
                const listeInstruments = categoriesSelectionnees[index]
                    ? (instrumentsFiltres[index] || [])
                    : instrumentsDisponibles;
                //recup les capteurs associés aux instruments sélectionnés
                const capteursAssocies = capteursParInstrument[index] || [];

                return (
                    <Box key={`instrument-box-${index}`} sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                        
                  {/* Sélection de catégorie */}
                  <FormControl fullWidth sx={{mb:2}}>
                      <InputLabel>Filtrer par catégorie</InputLabel>
                      <Select
                          value={categoriesSelectionnees[index]|| ''}
                          label={`Catégorie de l'instrument n°${index + 1}`}
                          onChange={(e) => handleCategorieChangeInstrument(index, e.target.value)}
                      >
                          <MenuItem value="">
                              <em>Toutes les catégories</em>
                          </MenuItem>
                          {categories.map((item) => (
                              <MenuItem key={item.id_categorie} value={item.nom}>
                                  {item.nom}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
                  {listeInstruments.length === 0 ? (
                            <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                Aucun capteur d'instrument ne correspond à la catégorie "{categoriesSelectionnees[index]}"
                            </Typography>
                        ) : (

                
                  <FormControl fullWidth required>
                    <InputLabel>Sélectionnez un instrument</InputLabel>
                    <Select
                      value={selectedInstrument}
                      label={`Instrument n°${index + 1}`}
                      onChange={(e) => {
                        const nValue = e.target.value;
                        handleNomChange(index, nValue);
                        handleInstrumentChange(index, nValue);
                      }}
                    >
                      <MenuItem value="">
                        <em>Sélectionnez un instrument</em>
                      </MenuItem>
                      {listeInstruments.map((item) => (
                        <MenuItem key={item.id_instrument} value={item.modele}>
                          {item.id_instrument} - {item.modele}
                        </MenuItem>
                      
                      ))}
                    </Select>
                  </FormControl>
                  )}
                  
                {/*Affichage des capteurs liés à l'instrument*/}
                      
{/*verifier l'existence puis la longueur*/}
{selectedInstrument && capteursAssocies.length > 0 && (
  <FormControl component="fieldset" sx={{mt:2}}>
    <FormLabel component="legend">Capteurs associés à cet instrument :</FormLabel>
    <MuiRadioGroup
      value={capteursSelectionnes[index]|| ''}
      onChange={(e) => handleCapteurChange(index, e.target.value)}
    >
      {capteursAssocies.map((capteur) => (
        <FormControlLabel
          key={capteur.id}
          value={capteur.nom}
          control={<Radio />}
          label={`${capteur.id} - ${capteur.nom}`}
        />
      ))}
    </MuiRadioGroup>
  </FormControl>
)}
                
                </Box>
            );
      })
   
  )}
</>
 )}
             

    


        
      {/*
          <TextField
            label="blabla"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          
            required
          />
      */}
      
      <Box key={`date-box`} sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2}}>

    <InputLabel>Veuillez choisir une méthode de datation :</InputLabel>
        
          

    <FormControl component="fieldset">
              <RadioGroup
              row
              value={choixDate}
              
              onChange={(e)=>{
                setChoixDate(e.target.value);
                
                
            }}
              >
              <FormControlLabel value="Heure" control={<Radio />} label="Heure" />
              <FormControlLabel value="Jour" control={<Radio />} label="Jour" />
              <FormControlLabel value="Semaine" control={<Radio />} label="Semaine" />
              <FormControlLabel value="Mois" control={<Radio />} label="Mois" />
              <FormControlLabel value="Année" control={<Radio />} label="Année" />

                </RadioGroup>
              </FormControl>
          </Box>


          {/*choix HEURE*/}

        {choixDate === 'Heure' && (
              <Box sx={{ mt: 2 }}>
                <InputLabel>Choisissez une heure de début et une heure de fin:</InputLabel>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <input 
                  type="time"
                  id="heuredeb"
                  value={heuredeb}
                onChange={(e) => setHeureDeb(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />
               
            <input 
                type="time"
                id="heurefin"
                value={heurefin}
                onChange={(e) => setHeureFin(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
            />
        </Stack>
    </Box>
)}
            {/*choix JOUR*/}
            {choixDate === 'Jour' && (
              <Box sx={{ mt: 2 }}>
                <InputLabel>Choisissez une date de début et une date de fin:</InputLabel>
                <input 
                  type="date"
                  id="jourdeb"
                  required
                  value={jourdeb}
                  onChange={(e) => setJourDeb(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />

<input 
                  type="date"
                  id="jourfin"
                  required
                  value={jourfin}
                  onChange={(e) => setJourFin(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />
        </Box> //AJOUTER UN AUTOFILL DU LENDEMAIN
        
            )}


            {/*choix SEMAINE*/}
            {choixDate === 'Semaine' && (
              <Box sx={{ mt: 2 }}>
                <InputLabel>Choisissez une date de début et une date de fin:</InputLabel>
                <input 
                  type="date"
                  id="semainedeb"
                  required
                  value={semainedeb}
                  onChange={(e) => setSemaineDeb(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />

<input 
                  type="date"
                  id="semainefin"
                  required
                  value={semainefin}
                  onChange={(e) => setSemaineFin(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                /> 
        </Box> //AJOUTER UN AUTOFILL 7 JOURS PILE APRES
        
            )}


            {/*choix MOIS*/}
            {choixDate === 'Mois' && (
              <Box sx={{ mt: 2 }}>
                <InputLabel>Choisissez une date de début et une date de fin:</InputLabel>
                <input 
                  type="date"
                  id="moisdeb"
                  required
                  value={moisdeb}
                  onChange={(e) => setMoisDeb(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />

<input 
                  type="date"
                  id="moisfin"
                  required
                  value={moisfin}
                  onChange={(e) => setMoisFin(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                /> 
        </Box> //AJOUTER UN AUTOFILL 1 MOIS PILE APRES
        
            )}

 {/*choix ANNÉE*/}
 {choixDate === 'Année' && (
              <Box sx={{ mt: 2 }}>
                <InputLabel>Choisissez une date de début et une date de fin:</InputLabel>
                <input 
                  type="date"
                  id="anneedeb"
                  required
                  value={anneedeb}
                  onChange={(e) => setAnneeDeb(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                />

<input 
                  type="date"
                  id="anneefin"
                  required
                  value={anneefin}
                  onChange={(e) => setAnneeFin(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '20%' }}
                /> 
        </Box> //AJOUTER UN AUTOFILL 1 AN PILE APRES
        
            )}
            



          <Stack direction="row" spacing={2} justifyContent="center">
     
            <Button
              type="submit"
              variant="contained"
               startIcon={<SearchIcon />}  
            sx={{
            bgcolor:'#0370B2',
            '&:hover': { bgcolor: '#00517C' },
          }}
            >
              Rechercher
            </Button>
            </Stack>
            </Stack>
           </form>
           </Paper>
           </Container>
           </Box>
    );   
}


export default Recherche;