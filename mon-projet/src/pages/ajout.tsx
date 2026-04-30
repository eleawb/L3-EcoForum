import { useState } from 'react'
import { useNavigate } from 'react-router-dom' //pr navigation
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material' //icônes visuelles
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
} from '@mui/material' //import MUI

function Ajout() {
    const navigate = useNavigate()

    return (
        <Box sx={{ flexGrow: 1 }}> 

        {/*barre navigation*/}                        
        <AppBar position="static"
        sx={{
          bgcolor:"#EC9706",
        }}
        >
              <Toolbar> {/*pr que les éléments soient à côté dans la barre nav*/}
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>AJOUTER DES DONNÉES</Typography>
                  <Button color="inherit" onClick={() => navigate('/')}>Retour</Button> {/*retour menu*/}
          
              </Toolbar>
          </AppBar>


        {/*choix d'ajout de données*/}
        <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={4} sx={{ p: 4 }}> 
        <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                  <center><b>VEUILLEZ CHOISIR UNE MÉTHODE :</b></center>
                  <br></br>
                  </Typography>       

          <Stack direction="row" spacing={2} justifyContent="center"> {/*les choix seront alignés l'un dessus l'autre*/}

            {/*dépôt de fichier*/}
          <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />} //icône + 
                onClick={()=> navigate('/depotFichier')}//redirection vers les depots
              sx={{
              bgcolor:'#EC9706',
              '&:hover': { bgcolor: '#C78023' }, //quand on passe dessus, couleur plus foncée
            }}
              >
                Dépôt d'un fichier
              </Button>

            {/*saisie manuelle*/}
              <Button
                type="submit"
                onClick={() => navigate('/saisieManuelle')} //redirection saisieManuelle
                variant="contained"
                startIcon={<AddIcon />}  //icônes +
              sx={{
              bgcolor:'#EC9706',
              '&:hover': { bgcolor: '#C78023' }, //quand on passe dessus, couleur plus foncée
            }}
              >
                Saisie manuelle
              </Button>

              </Stack>
              </Paper>
              </Container>
              </Box>
      )
  }

export default Ajout