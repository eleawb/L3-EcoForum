import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; //pr navigation
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
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
  MenuItem
} from '@mui/material'; //import MUI

function Recherche() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [nbCapteurs, setNbCapteurs]= useState<number>(1); //stocke le nb de capteurs choisi
    const [nomsCapteurs, setCapteursNames]= useState<string[]>(['']); //tab des noms capteurs init à vide
    const [ddate, setDate] = useState('');


    // maj du nb de capteurs si changement et ajustement du tab des noms
  const handleNbCapteursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nb = parseInt(e.target.value) || 1;
    setNbCapteurs(nb);
    
    // ajuste la taille du tab des noms
    setCapteursNames(prev => {
      const newNoms = [...prev];
      if (nb > prev.length) {
        //ajoute des cases vides si nv nb supérieur
        for (let i = prev.length; i < nb; i++) {
          newNoms.push('');
        }
      } else {
        // si nv nb inférieur, on coupe le tableau
        return newNoms.slice(0, nb);
      }
      return newNoms;
    });
  };

  const handleNomCapteurChange = (index: number, value: string) => {
    setCapteursNames(prev => {
      const newNoms = [...prev];
      newNoms[index] = value;
      return newNoms;
    });
  };



    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // empêche le rechargement de la page
        if (nomsCapteurs.some(nom => !nom.trim())) {
          alert("Veuillez remplir tous les noms de capteurs");
          return;
        }
        console.log('Recherche:', { searchTerm, category, nbCapteurs, nomsCapteurs });
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
            Recherche de données
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">Formulaire de recherche</Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}> {/*espacé*/}
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

         {/* champs dynamiques pour les noms des capteurs */}
         {nomsCapteurs.map((nom, index) => (
                  <FormControl key={index}fullWidth required>
                  <InputLabel>{`Capteur ${index + 1}`}</InputLabel>
                  <Select
                  value={nom}
                  label={`Capteur ${index + 1}`}
                  onChange={(e) => handleNomCapteurChange(index, e.target.value)}
                  >
                  <MenuItem value="c1">Capteur 1</MenuItem>
                  <MenuItem value="c2">Capteur 2</MenuItem>
                  <MenuItem value="c3">Capteur 3</MenuItem>
                  <MenuItem value="c4">Capteur 4</MenuItem> 
                  <MenuItem value="c5">Capteur 5</MenuItem> 

                </Select>
                </FormControl>
              ))}
              {/*à changer : ajouter qu'on peut pas remettre un qu'on a déjà choisi*/}

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