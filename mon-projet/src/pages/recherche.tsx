import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; //pr navigation
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
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
    const [ddate, setDate] = useState('');

 // États pour les capteurs et instruments de la BDD
 const [capteursDisponibles, setCapteursDisponibles] = useState<any[]>([]);
 const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 //pour selectionner les capteurs correspondant à l'instrument, etc
 const [capteursParInstrument, setCapteursParInstrument] = useState<{ [key: number]: any[] }>({}); //stocke les capteurs par instru
  const [instrumentSelectionne, setInstrumentSelectionne] = useState<string>('');
  const [capteursSelectionnes, setCapteursSelectionnes] = useState<{ [key: number]: string }>({}); //stocke le capteur par instru
const[categorieSelectionnee, setCategorieSelectionnee] = useState<string>('');
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
  
//changement catégorie
const handleCategorieChange = async (index: number, value: string) => {
  setCategorieSelectionnee(value);
}

  



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



  
  // Réinitialisation du formulaire
  const resetForm = () => {
    setSearchTerm('');
    setElementsNames(['']); //on vide tout
    setNombreElements(1);
    setDate('');
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
        let nomsRecherche : string[] = [];
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
          date: ddate,
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
            }}
              >
              <FormControlLabel value="instruments" control={<Radio />} label="Instrument(s) de mesure" />
              <FormControlLabel value="capteurs" control={<Radio />} label="Capteur(s)" />
                </RadioGroup>
              </FormControl>


            


 {/*mode CAPTEURS */}
 {choixCI === 'capteurs' && (
                <>
                  <TextField
                    label="Nombre de capteur(s) recherché(s) :"
                    type="number"
                    value={nombreElements}
                    onChange={handleNombreChange}
                    inputProps={{ min: 1, max: 10 }}
                    required
                    fullWidth
                  />
                          
        
                    

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
      ) : capteursDisponibles.length === 0 ? (
        <Typography color="error">Aucun capteur trouvé</Typography>
        ) : (
          nomsElements.map((nom, index) => (
            <FormControl key={`${choixCI}-${index}`} fullWidth required>
               <InputLabel>Sélectionnez un capteur</InputLabel>
 {/*{`${labelNom} n°${index + 1}`}*/}
              <Select
                value={nom}
                label={`${labelNom} n°${index + 1}`} //{`${labelNom} n°${index + 1}`}
                onChange={(e) => handleNomChange(index, e.target.value)}
              >
                <MenuItem value="">

                  <em>Sélectionnez un capteur</em>{/*{labelUniteSing}*/}
                </MenuItem>
                {capteursDisponibles.map((item) => {
                            const isDisabled = nomsElements.includes(item.nom) && nomsElements[index] !== item.nom;
                            return (
                              <MenuItem key={item.id} value={item.nom} disabled={isDisabled}>
                                {item.id} - {item.nom}
                                
                </MenuItem>
                );
      })}
      </Select>
      </FormControl>
    ))
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
              <>
                  {/* Sélection de catégorie */}
                  <FormControl fullWidth>
                      <InputLabel>Filtrer par catégorie</InputLabel>
                      <Select
                          value={categorieSelectionnee}
                          label="Filtrer par catégorie"
                          onChange={(e) => setCategorieSelectionnee(e.target.value)}
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


                {nomsElements.map((selectedInstrument, index) => (
                <Box key={`instrument-box-${index}`} sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
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
                      {instrumentsDisponibles.map((item) => (
                        <MenuItem key={item.id_instrument} value={item.modele}>
                          {item.id_instrument} - {item.modele}
                        </MenuItem>
                      
                      ))}
                    </Select>
                  </FormControl>
                  {/*Affichage des capteurs liés à l'instrument*/}

{/*verifier l'existence puis la longueur*/}
{capteursParInstrument[index] && capteursParInstrument[index].length > 0 && (
  <FormControl component="fieldset">
    <FormLabel component="legend">Capteurs associés à cet instrument :</FormLabel>
    <MuiRadioGroup
      value={capteursSelectionnes[index]|| ''}
      onChange={(e) => handleCapteurChange(index, e.target.value)}
    >
      {capteursParInstrument[index].map((capteur) => (
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
            ))}
        
    </>
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
    <InputLabel>Veuillez choisir une date :</InputLabel>
        <input 
            type="date"
            id="ddate"
            required
            value={ddate}
            onChange={(e) => setDate(e.target.value)}
          />

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