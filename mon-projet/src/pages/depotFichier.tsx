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

function DepotFichier(){
    const navigate = useNavigate();

    //Les etats des selections du form 
    const [selectedInstrument, setSelectedInstrument] = useState<string>('');
    const [selectedCapteur, setSelectedCapteur] = useState<string>('');

    //Etat du fichier, par default aucun fichier
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    //Etats des inputs qui apparaisent apres l-upload du document
    const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
    const [nom, setNom] = useState<string>('');
    const [numSerie, setnumSerie] = useState<string>('');
    const [extension, setExtension] = useState<string>('');
    const [dateImport, setDateImport] = useState<string>('');
    const [typeSource, setTypeSource] = useState<string>('');

    //Verifier si les 2 selects ont des valeurs non nulles
    const isFormComplete = selectedInstrument !== '' && selectedCapteur !== '';
    //Verifier que les 2e inputs ont des valeurs non nulles
    const areAdditionalInputsComplete = 
    nom !== '' && 
    numSerie !== '' && 
    extension !== '' && 
    dateImport !== '' && 
    typeSource !== '';

    //Traitement des changements sur les Selects
    const handleInstrumentChange = (event: SelectChangeEvent) => {
    setSelectedInstrument(event.target.value);
    };
    const handleCapteurChange = (event: SelectChangeEvent) => {
    setSelectedCapteur(event.target.value);
    };
  
    const autoFillCapteurFromFile = (fileName: string) => {
    if (fileName.includes('K-')) {
      setSelectedCapteur('capteur1'); // KUNAK
    } else if (fileName.includes('(n°')) {
      setSelectedCapteur('capteur2'); // HOBO
    }  else if (fileName.includes('te-')) {
      setSelectedCapteur('capteur3'); // Station Meteo
    } else if (fileName.includes('data_')) {
      setSelectedCapteur('capteur4'); // TSM4
    }
  };

    //Traitement du upload dun fichier
    const handleFileUpload = () => {
    // creation cache d'un file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .txt, .json'; // modifiable
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        setSelectedFile(file);
        setShowAdditionalInputs(true); // montrer les additional inputs
        autoFillCapteurFromFile(file.name); // Auto-fill the capteur select based on file name
      }
    };  
    fileInput.click();
};

    //Traitement des extensions du fichier
    const handleAutofillExtension = () => {
    if (selectedFile && selectedFile.name.includes('.')) {
      const extensionPart = selectedFile.name.split('.').pop() || '';
      setExtension(extensionPart);
    } else if (selectedFile) {
      setExtension(''); // No extension found
      alert('Le fichier sélectionné n\'a pas d\'extension');
    }
  };
    //traitement de la date, pour la posibilite dautofill.
    const handleAutofillDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDateImport(`${year}-${month}-${day}`);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isFormComplete) {
      return;
    }
    
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    if (!areAdditionalInputsComplete) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    
    // Aqui tenemos que poner el actual treatment del documento despues
    console.log('Uploading file:', selectedFile.name);
    console.log('Instrument:', selectedInstrument);
    console.log('Capteur:', selectedCapteur);
    console.log('Nom:', nom);
    console.log('Numero de serie:', numSerie);
    console.log('Extension:', extension);
    console.log('Date import:', dateImport);
    console.log('Type source:', typeSource);
    
    alert(`Fichier "${selectedFile.name}" prêt à être uploadé`);
  };


    return(
    <Box sx={{ flexGrow: 1 }}>                         
    <AppBar position="static"
      sx={{
        bgcolor:"#EC9706",
      }}
      >
        <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>DEPOT DE FICHIER</Typography>
                <Button color="inherit" onClick={() => navigate('/ajout')}>Retour</Button>
            </Toolbar>
        </AppBar>
        <Container maxWidth = 'md' sx = {{mt:4}}>
            <Paper elevation = {3} sx={{p:4}}>
                <Typography variant ='h4' gutterBottom align ="center">AJOUT</Typography>

                <form onSubmit={handleSubmit}>

                <Stack spacing={3}>
                      <Button
                        type="button"
                        variant="contained"
                        onClick={handleFileUpload}
                        //disabled={!isFormComplete}
                        sx={{
                          bgcolor: '#EC9706',
                        //bgcolor: !isFormComplete ? '#CCCCCC' : '#EC9706',
                        //color: !isFormComplete ? '#666666' : '#FFFFFF',
                        '&:hover': {
                            bgcolor: !isFormComplete ? '#CCCCCC' : '#C78023',},
                        }}
                        >SELECTION DE FICHIER
                        </Button>
                        {selectedFile && (
                    <Typography variant="body2" sx={{ color: 'green', textAlign: 'center' }}>
                      Fichier sélectionné: {selectedFile.name}
                    </Typography>
                  )}



                {showAdditionalInputs && (
                <>
                <FormControl fullWidth required>
                        <InputLabel>Sélectionnez l-instrument pour lequel vous depossez un fichier</InputLabel>
                        <Select
                        value={selectedInstrument}
                        onChange={handleInstrumentChange}
                        label="Sélectionnez l'instrument pour lequel vous déposez un fichier">
                        
                        {/* Estos menu Items son temporales despues hay que load los de la BDD */}
                        <MenuItem value="instrument1">Instrument 1</MenuItem>
                        <MenuItem value="instrument2">Instrument 2</MenuItem>
                        <MenuItem value="instrument3">Instrument 3</MenuItem>
                        </Select>
                        </FormControl>



                        <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le capteur pour lequel vous déposez un fichier</InputLabel>
                        <Select
                          value={selectedCapteur}
                          onChange={handleCapteurChange}
                          label="Sélectionnez le capteur pour lequel vous déposez un fichier"
                        >
                          <MenuItem value="capteur1">KUNAK</MenuItem>
                          <MenuItem value="capteur2">HOBO</MenuItem>
                          <MenuItem value="capteur3">Station Meteo</MenuItem>
                          <MenuItem value="capteur4">TSM4</MenuItem> {/* Fixed duplicate value */}
                        </Select>
                      </FormControl>
                        
                  <TextField
                    label="Nom"
                    variant="outlined"
                    fullWidth
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Entrez votre nom"
                  />
                  <TextField
                    label="Numero de serie"
                    variant="outlined"
                    fullWidth
                    required
                    value={numSerie}
                    onChange={(e) => setnumSerie(e.target.value)}
                    placeholder="Entrez le numero de serie"
                  />
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Format(extension)"
                      variant="outlined"
                      fullWidth
                      required
                      value={extension}
                      onChange={(e) => setExtension(e.target.value)}
                      placeholder="Extension du fichier"
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleAutofillExtension}
                      sx={{
                        minWidth: '100px',
                        height: '56px'
                      }}
                    >
                      Autofill
                    </Button>
                  </Stack>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Date import"
                      type="date"
                      variant="outlined"
                      fullWidth
                      required
                      value={dateImport}
                      onChange={(e) => setDateImport(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleAutofillDate}
                      sx={{
                        minWidth: '100px',
                        height: '56px'
                      }}
                    >
                      Autofill
                    </Button>
                  </Stack>
                  
                  <FormControl fullWidth required>
                    <InputLabel>Type source</InputLabel>
                    <Select
                      value={typeSource}
                      onChange={(e) => setTypeSource(e.target.value)}
                      label="Type source"
                    >
                      <MenuItem value="fichier">Fichier</MenuItem>
                      <MenuItem value="audio">Audio</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
              
              <Button
                type="submit"
                variant="contained"
                disabled={!isFormComplete || !selectedFile || !areAdditionalInputsComplete}
                sx={{
                  bgcolor: (isFormComplete && selectedFile && areAdditionalInputsComplete) ? '#EC9706' : '#CCCCCC',
                  '&:hover': {
                    bgcolor: (isFormComplete && selectedFile && areAdditionalInputsComplete) ? '#C78023' : '#CCCCCC',
                  },
                }}
              >
                Déposer
              </Button>

                    </Stack>
                </form>
            </Paper>
        </Container>

        
        </Box>

        
    );
}

export default DepotFichier;