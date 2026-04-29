import { useState, useEffect } from 'react'
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
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  Checkbox,
  MenuItem
} from '@mui/material'; //import MUI
import { SelectChangeEvent } from '@mui/material/Select';

function SaisieManuelle(){
const navigate = useNavigate()
    const [chargement, setChargement] = useState(true) //boucle de chargement si la récupération initiale des instruments de la bdd est trop long ou pb infini
    const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]) //instruments disponibles selon la catégorie / bdd en général
    //choix instruments
    const [instrumentsSelectionnes, setInstrumentsSelectionnes] = useState<string[]>([]) //récupérer les instruments sélectionnés par l'user

    useEffect(() => {
            const fetchData = async () => {
                console.log("début du fetch data")
                try {
                      const instrumentsRes = await fetch('http://localhost:3000/api/instruments') //récupérer les instruments de la bdd
                      const instrumentsData = await instrumentsRes.json() //conversion 
                      setInstrumentsDisponibles(instrumentsData || []) //si pas de données, on laisse vide
                    }
                    catch (error) {
                      console.error('Erreur lors du chargement des données:', error)
                      setChargement(false)
                    }
                }
        fetchData()
    }, [])
  

// gestion de la sélection d'un instrument
// au lieu de stocker les noms, on stocke les ids (plus sûr)
const InstrumentSelection = (valeurId: number) => {
  setInstrumentsSelectionnes(prev => {
      if (prev.includes(valeurId.toString())) {
          return prev.filter(v => v !== valeurId.toString())
      } else {
          return [...prev, valeurId.toString()]
      }
  })
}

//Buton de submit
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (instrumentsSelectionnes.length===0) {
            alert('Veuillez sélectionner au moins un instrument')
            return
        }
      }

/*const listeInstruments =  instrumentsDisponibles*/

return(

    <Box sx={{ flexGrow: 1 }}>                         
    <AppBar position="static"
      sx={{
        bgcolor:"#EC9706",
      }}
      >
        <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>SAISIE MANUELLE</Typography>
                <Button color="inherit" onClick={() => navigate('/ajout')}>Retour</Button>
            </Toolbar>
        </AppBar>
        <Container maxWidth = 'md' sx = {{mt:4}}>
            <Paper elevation = {3} sx={{p:4}}>
            <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>SAISIE MANUELLE</b></center>
                <br></br>
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>

                      {/*Sélection de l'instrument*/}
                                  <FormControl component="fieldset" required sx={{ mb: 2 }}>
                                  <FormLabel component="legend">Sélectionnez un ou plusieurs instruments</FormLabel>
    
                                  {/* Liste des instruments */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {instrumentsDisponibles.map((item) => (
                                                <FormControlLabel
                                                    key={item.id_instrument}
                                                    control={
                                                        <Checkbox
                                                            checked={instrumentsSelectionnes.includes(item.id_instrument.toString())}
                                                            onChange={() => InstrumentSelection(item.id_instrument)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={`${item.nom_outil || item.modele} - ${item.num_instrument || ''}`}
                                                />
                                            ))}
                                        </Box>
                                    </FormControl>

                        <Button
                        type="submit"
                        variant="contained" //bouton rempli
                        onClick={() => navigate('/ajoutligne')}
                        startIcon={<AddIcon />}
                        size="large"
                        >AJOUTER DES LIGNES 
                    </Button>
                    </Stack>
               </form>         
            </Paper>
        </Container>
    </Box>

);

}

export default SaisieManuelle;