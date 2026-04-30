import { useState } from 'react'
import { useNavigate } from 'react-router-dom' //pr navigation
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

function Materiel() {
    const navigate = useNavigate()


    //afficher carte du campus avec localisation instruments
    //états des instruments (panne)
    //documentation instruments (formats de fichiers)
    //pour les administrateurs : possibilité de modifier les instruments
    
    return (

            <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                        flexGrow : 1 prend tt l'espace visuel dispo */}
            {/*barre de navigation*/}
            <AppBar position="static"
            sx={{
              bgcolor:"#808080",
            }}
            >
              <Toolbar> {/*pour afficher texte/boutons à côté sur la même barre navigation*/}
              
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  INSTRUMENTS DE MESURE
                </Typography>
                <Button color="inherit" onClick={() => navigate('/')}>Retour</Button> {/*retour menu principal*/}
              </Toolbar>
            </AppBar>
            </Box>
    )
}
export default Materiel