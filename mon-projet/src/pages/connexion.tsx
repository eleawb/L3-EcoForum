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

function Connexion() {
    
    const navigate = useNavigate();
    return (

  
    <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                  flexGrow : 1 prend tt l'espace visuel dispo */}
      <AppBar position="static"> {/*barre de navigation*/}
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CONNEXION
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{mt : 4}}> 
        <Paper
          elevation={3} //effet d'ombre du container (carte)
          sx = {{
            p : 4, //padding
            display : 'flex',
            flexDirection: 'column', //affichage des boutons en colonne
            alignItems: 'center', //centre horizontalement
            gap: 2 //espace entre les boutons
          }}
        >
        <Typography variant="h5" gutterBottom sx={{ color: '#5d4037' }}> {/*gutterBottom : ajoute une marge en bas*/}
            <center><b>Veuillez vous connecter :</b></center>
          </Typography>
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}> {/*alignement entre bouton*/}
          </Stack>
          </Paper>
          </Container>
          </Box>

    );

}
export default Connexion;