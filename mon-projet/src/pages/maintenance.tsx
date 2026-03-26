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

function Maintenance() {
    const navigate = useNavigate();


    return (

            <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                        flexGrow : 1 prend tt l'espace visuel dispo */}
            <AppBar position="static"
            sx={{
              bgcolor:"#808080",
            }}
            >
              <Toolbar>
              
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  MAINTENANCE DES CAPTEURS
                </Typography>
                <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
              </Toolbar>
            </AppBar>
            </Box>
    );
}
export default Maintenance;