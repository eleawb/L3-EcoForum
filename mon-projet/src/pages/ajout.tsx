import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom'; //pr navigation
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
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

function Ajout() {
    const navigate = useNavigate();


    return (
        <Box sx={{ flexGrow: 1 }}>                         
      <AppBar position="static"
      sx={{
        bgcolor:"#EC9706",
      }}
      >
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>AJOUTER DES DONNÉES</Typography>
                <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
        
            </Toolbar>
        </AppBar>


      <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={4} sx={{ p: 4 }}> 
      <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>VEUILLEZ CHOISIR UNE MÉTHODE :</b></center>
                <br></br>
                </Typography>        
        <Stack direction="row" spacing={2} justifyContent="center">
        <Button
              type="submit"
              variant="contained"
               startIcon={<AddIcon />}  
               onClick={()=> navigate('/depotFichier')}//redirection vers les depot
            sx={{
            bgcolor:'#EC9706',
            '&:hover': { bgcolor: '#C78023' },
          }}
            >
              Dépôt d'un fichier
            </Button>

            <Button
              type="submit"
              onClick={() => navigate('/saisieManuelle')}
              variant="contained"
               startIcon={<AddIcon />}  
            sx={{
            bgcolor:'#EC9706',
            '&:hover': { bgcolor: '#C78023' },
          }}
            >
              Saisie manuelle
            </Button>

            </Stack>
            </Paper>
            </Container>
            </Box>
    );
}

export default Ajout;