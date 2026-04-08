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

function AjoutLigne(){
  const navigate = useNavigate();


  return(
    <Box sx={{ flexGrow: 1 }}>                         
    <AppBar position="static"
      sx={{
        bgcolor:"#EC9706",
      }}
      >

    <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>SAISISE</Typography>
                    <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth = 'md' sx = {{mt:4}}>
                <Paper elevation = {3} sx={{p:4}}>
                    <Typography variant ='h4' gutterBottom align ="center">AJOUT LIGNE</Typography>
                    <Stack spacing={3}>

                <Button
                    
                variant="contained" //bouton rempli
                startIcon={<AddIcon />}
                size="large"
                
                sx={{
                  bgcolor: '#EC9706',
                  py:1.5,
                '&:hover': '#C78023',} //qd on passe dessus
                }
              >AJOUTER DES LIGNES
              </Button>
            </Stack>


                </Paper>
            </Container>
        </Box>
        

      

  );

}
export default AjoutLigne;