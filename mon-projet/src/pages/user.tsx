import { useState } from 'react'
import { useNavigate } from 'react-router-dom' //pr la navigation
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material' //icônes visuelles
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

function User() {
    const navigate = useNavigate()

    return (

            <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                        flexGrow : 1 prend tt l'espace visuel dispo */}
            
            {/*barre de navigation en haut*/}
            <AppBar position="static" 
            sx={{
              bgcolor:"#A84296", //gris
            }}
            >
              <Toolbar> {/*permet d'afficher du texte ou boutons à côté sur la même barre nav*/}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}> 
                  GESTION UTILISATEUR
                </Typography>
                <Button color="inherit" onClick={() => navigate('/')}>Retour</Button> {/*retour au menu principal*/}
              </Toolbar>
            </AppBar>
            </Box>
    )
}
export default User