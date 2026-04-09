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
import { SelectChangeEvent } from '@mui/material/Select';

function SaisieManuelle(){
const navigate = useNavigate();

//Les etats des selections du form 
const [selectedInstrument, setSelectedInstrument] = useState<string>('');
const [selectedCapteur, setSelectedCapteur] = useState<string>('');

//Verifier si les 2 selects ont des valeurs non nulles
const isFormComplete = selectedInstrument !== '' && selectedCapteur !== '';

//handle submit
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isFormComplete) {
      return;
    }
  };

  //Traitement des changements sur les Selects
    const handleInstrumentChange = (event: SelectChangeEvent) => {
    setSelectedInstrument(event.target.value);
    };
  
    const handleCapteurChange = (event: SelectChangeEvent) => {
    setSelectedCapteur(event.target.value);
    };



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
                <Typography variant ='h4' gutterBottom align ="center">AJOUT</Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <FormControl fullWidth required>
                        <InputLabel>Sélectionnez l-instrument pour lequel vous completer un fichier</InputLabel>
                        <Select
                        value={selectedInstrument}
                        onChange={handleInstrumentChange}
                        label="Sélectionnez l'instrument pour lequel vous completer un fichier">
                        
                        {/* Estos menu Items son temporales despues hay que load los de la BDD */}
                        <MenuItem value="instrument1">Instrument 1</MenuItem>
                        <MenuItem value="instrument2">Instrument 2</MenuItem>
                        <MenuItem value="instrument3">Instrument 3</MenuItem>
                        </Select>
                        </FormControl>



                        <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le capteur pour lequel vous depossez un fichier</InputLabel>
                        <Select
                        value={selectedCapteur}
                        onChange={handleCapteurChange}
                        label="Sélectionnez le capteur pour lequel vous déposez un fichier">

                        <MenuItem value="capteur1">Capteur 1</MenuItem>
                        <MenuItem value="capteur2">Capteur 2</MenuItem>
                        <MenuItem value="capteur3">Capteur 3</MenuItem>

                        </Select>
                        </FormControl>

                        <Button
                        type="submit"
                        variant="contained" //bouton rempli
                        onClick={() => navigate('/ajoutligne')}
                        startIcon={<AddIcon />}
                        size="large"
                        disabled={!isFormComplete}
                        sx={{
                        bgcolor: !isFormComplete ? '#CCCCCC' : '#EC9706',
                        color: !isFormComplete ? '#666666' : '#FFFFFF',
                        py:1.5,
                        '&:hover': {bgcolor: !isFormComplete ? '#CCCCCC' : '#C78023',}, //qd on passe dessus
                        }}
                    >AJOUTER DES LIGNES
                    {!isFormComplete ? 'Sélectionnez d\'abord instrument et capteur' : 'Parcourir pour sélectionner un fichier'}
                    </Button>
                    </Stack>
               </form>         
            </Paper>
        </Container>
    </Box>

);

}

export default SaisieManuelle;