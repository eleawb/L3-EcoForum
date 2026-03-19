import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; //pr navigation
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
  Stack //aligner boutons en colonne par ex
} from '@mui/material'; //import MUI
import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon, Settings as SettingsIcon } from '@mui/icons-material'; //icônes texte

/*
interface Item {
  id: number;
  nom: string;
  description: string;
}*/



function Accueil() { //composant principal
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                  flexGrow : 1 prend tt l'espace visuel dispo */}
      <AppBar position="static"> {/*barre de navigation*/}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EcoForum
          </Typography>
          <Button color="inherit">Connexion</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{mt : 4}}> 
        <Paper
          elevation={3} //effet d'ombre qd on survole un bouton
          sx = {{
            p : 4, //padding
            display : 'flex',
            flexDirection: 'column', //affichage des boutons en colonne
            alignItems: 'center', //centre horizontalement
            gap: 2 //espace entre les boutons
          }}
        >
        <Typography variant="h5" gutterBottom sx={{ color: '#5d4037' }}> {/*gutterBottom : ajoute une marge en bas*/}
            <center><b>MENU PRINCIPAL</b></center>
          </Typography>
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}> {/*alignement entre bouton*/}
          
            <Button
              variant="contained" //bouton rempli
              startIcon={<AddIcon />}
              onClick={() => navigate('/ajout')} //redirection
              size="large"
              sx={{
                py:1.5,
              bgcolor :'#EC9706',
              '&:hover': { bgcolor: '#C78023' } //qd on passe dessus
              }}
            >
                AJOUTER DES DONNÉES
            </Button>
        
        <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/recherche')} //redirection
              size="large"
              sx={{
                py:1.5,
              bgcolor :'#0370B2',
              '&:hover': { bgcolor: '#00517C' } //qd on passe dessus
              }}
              >
              RECHERCHER DES DONNÉES
            </Button>


      
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              size="large"
              sx={{
                py:1.5,
              bgcolor :'#808080',
              '&:hover': { bgcolor: '#515151' } //qd on passe dessus
              }}
              //onClick={lookForCaptor}
              >
              MAINTENANCE DES CAPTEURS
            </Button>
            
          </Stack>
          
        </Paper>
      </Container>
    </Box>
   
  );
}

export default Accueil;