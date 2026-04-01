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
  InputLabel,
  Select,
  MenuItem,
  CircularProgress, //barre de progression %
  FormControlLabel
} from '@mui/material'; //import MUI

/*
 <form onSubmit={handleSubmit}>
          <Stack spacing={3}> 
          <TextField
label="Nombre de capteurs recherchés :"
         type="number" 
         value={nbCapteurs}
         onChange={handleNbCapteursChange}
         inputProps={{min:1, max:5}} //à xhanger qd on aura le nb de capteurs reliés à la bdd
        required
        fullWidth
        />
        
        <FormControl fullWidth>
        <InputLabel>Type de capteurs</InputLabel>
        <Select
          value={category}
          label="Type de capteurs"
          onChange={(e) => setCategory(e.target.value)}
        >
          <MenuItem value="temperature">Température</MenuItem>
          <MenuItem value="humidite">Humidité</MenuItem>
          <MenuItem value="pression">Pression</MenuItem>
          <MenuItem value="lumiere">Lumière</MenuItem>
        </Select>
      </FormControl>
      */

function Recherche() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [choixCI, setChoixCI] = useState('capteurs'); // Valeur par défaut
    const [nomsElements, setElementsNames]= useState<string[]>(['']); //tab des noms capteurs init à vide
    const [nombreElements, setNombreElements] = useState<number>(1);
    const [ddate, setDate] = useState('');

 // États pour les capteurs et instruments de la BDD
 const [capteursDisponibles, setCapteursDisponibles] = useState<any[]>([]);
 const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

console.log("test debug avant useEffect");
    // Charger les capteurs depuis la BDD au chargement de la page
  useEffect(() => {
    const fetchData = async () => {
      console.log("début du fetch data");
      try {
        //const [capteursRes,instrumentsRes]
        const [capteursRes, instrumentsRes] = await Promise.all([fetch('http://localhost:3000/api/capteurs'),fetch('http://localhost:3000/api/instruments')]);
        const capteursData = await capteursRes.json();
        console.log("capteurs reçus");
        setCapteursDisponibles(capteursData || []);
        console.log(`capteursData : ${capteursData}`);
        const instrumentsData = await instrumentsRes.json();
        console.log("instruments reçus");
        setInstrumentsDisponibles(instrumentsData || []); 
        console.log(`instrumentsData : ${instrumentsData}`);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des capteurs:', error);
        setLoading(false);
        console.log("fetch fini");
      }
    };
    
    fetchData();
  }, []);

  // Gestion du nombre d'éléments à sélectionner
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

  const handleNomChange = (index: number, value: string) => {
    setElementsNames(prev => {
      const newNoms = [...prev];
      newNoms[index] = value;
      return newNoms;
    });
  };
  
  // Réinitialisation du formulaire
  const resetForm = () => {
    setSearchTerm('');
    setElementsNames(['']); //on vide tout
    setNombreElements(1);
    setDate('');
  };

  //Données à afficher selon le choix
  const dataDisponibles = choixCI === 'capteurs' ? capteursDisponibles : instrumentsDisponibles;
  const labelUnite = choixCI === 'capteurs' ? 'capteur(s)' : 'instrument(s) de mesure'; //personnaliser affichage selon capteur ou instr
  const labelUniteSing = labelUnite === 'capteur(s)' ? 'capteur' : 'instrument de mesure'; //singulier

  const labelNom = choixCI === 'capteurs' ? 'Nom du capteur' : 'Nom de l\'instrument';


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // empêche le rechargement de la page
        if (nomsElements.some(nom => !nom.trim())) {
          alert(`Veuillez remplir tous les noms de capteurs`);//${labelUnite}`);
          return;
        }
        try {
          const endpoint = choixCI === 'capteurs' ? '/api/recherche' : '/api/recherche-instruments';
          const response = await fetch(`http://localhost:3000/api/recherche`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomsCapteurs: nomsElements.filter(nom => nom.trim()),
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
              onChange={(e)=>{setChoixCI(e.target.value); setElementsNames(['']); setNombreElements(1);}}
              >
              <FormControlLabel value="capteurs" control={<Radio />} label="Capteur(s)" />
                  <FormControlLabel value="instruments" control={<Radio />} label="Instrument(s) de mesure" />
                </RadioGroup>
              </FormControl>


                {/* Nombre d'éléments à sélectionner */}
<TextField
  label="Nombre de capteurs recherché(s) :"
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
        ) : (
          nomsElements.map((nom, index) => (
            <FormControl key={`${choixCI}-${index}`} fullWidth required>
              <InputLabel>{`${labelNom} n°${index + 1}`}</InputLabel> {/*{`${labelNom} n°${index + 1}`}*/}
              <Select
                value={nom}
                label={`${labelNom} n°${index + 1}`} //{`${labelNom} n°${index + 1}`}
                onChange={(e) => handleNomChange(index, e.target.value)}
              >
                <MenuItem value="">

                  <em>Sélectionnez un {labelUniteSing}</em>{/*{labelUniteSing}*/}
                </MenuItem>
                
                  {/* Si on est en mode CAPTEURS */}
  {choixCI === 'capteurs' && capteursDisponibles.map((item) => {
    const isDisabled = nomsElements.includes(item.nom) && nomsElements[index] !== item.nom;
    return (
      <MenuItem 
        key={item.Id} 
        value={item.nom}
        disabled={isDisabled}
      >
        {item.nom} - {item.Localisation || ''}
      </MenuItem>
    );
  })}
   {/* Si on est en mode INSTRUMENTS */}
   {choixCI === 'instruments' && instrumentsDisponibles.map((item) => {
    const isDisabled = nomsElements.includes(item.modele) && nomsElements[index] !== item.modele;
    return (
      <MenuItem 
        key={item.id_instrument} 
        value={item.modele}
        disabled={isDisabled}
      >
        {item.modele} - {item.num_instrument || ''}
      </MenuItem>
    );
  })}

              </Select>
            </FormControl>
          ))
        )}

        
     
          <TextField
            label="blabla"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          
            required
          />

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