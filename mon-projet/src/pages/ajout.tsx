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
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Recherche de données</Typography>
                <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
        
            </Toolbar>
        </AppBar>


      <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">Veuillez choisir une méthode :</Typography>
        
        <Stack direction="row" spacing={2} justifyContent="center">
        <Button
              type="submit"
              variant="contained"
               startIcon={<AddIcon />}  
            sx={{
            bgcolor:'#EC9706',
            '&:hover': { bgcolor: '#C78023' },
          }}
            >
              Dépôt d'un fichier
            </Button>

            <Button
              type="submit"
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