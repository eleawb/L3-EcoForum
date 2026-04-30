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

function Connexion() {
    
    const [email, setEmail] = useState("") //pour récupérer l'email
    const [password, setPassword] = useState("") //pr récupérer le mdp (j'ai pas encore fait de sécurité)

    const handleLogin = ()=>{} //pour l'instant, rien d'implémenté

    const navigate = useNavigate()
    return (

      <Box sx={{ flexGrow: 1 }}> {/*sx = prop de style de MUI
                                    flexGrow : 1 prend tt l'espace visuel dispo */}
        {/*barre de navigation*/}
        <AppBar position="static"> 
          <Toolbar> {/*éléments à côté sur la barre nav*/}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              CONNEXION
            </Typography>
            <Button color="inherit" onClick={() => navigate('/')}>Retour</Button> {/*retour menu principal*/}
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{mt : 4}}> 
          <Paper
            elevation={3} //effet d'ombre du container (carte avec les éléments dessus)
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
            {/*<Typography variant="h5">Login</Typography>*/}
            <Box sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                name="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleLogin}
              >
                Connexion
              </Button>


              </Box>
            </Stack>
            </Paper>
            </Container>
            </Box>

            
          
      )
          }

export default Connexion