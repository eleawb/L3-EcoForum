import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

function DepotFichier(){
    const navigate = useNavigate();

    const [selectedInstrument, setSelectedInstrument] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
    const [nom, setNom] = useState<string>('');
    const [prenom, setPrenom] = useState<string>('');
    const [mail, setMail] = useState<string>('');
    const [numSerie, setNumSerie] = useState<string>('');
    const [extension, setExtension] = useState<string>('');
    const [dateImport, setDateImport] = useState<string>('');
    const [dateCueilli, setDateCueilli] = useState<string>('');
    const [typeSource, setTypeSource] = useState<string>('');
    const [instruments, setInstrumentsDisponibles] = useState([]);
    const [numInstrument, setNumInstrument] = useState(''); 
    const [modele, setModele] = useState('');

    const isFormComplete = selectedInstrument !== '' && selectedInstrument !== '';
    const areAdditionalInputsComplete = 
    nom !== '' && 
    prenom !== '' && 
    mail !== '' && 
    numSerie !== '' && 
    extension !== '' && 
    dateImport !== '' && 
    dateCueilli !== '' && 
    typeSource !== '';
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Empiezo a querer implementar la BDD
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/
useEffect(() => {
        const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await fetch('http://localhost:3000/api/instruments')
                const instrumentsData = await instrumentsRes.json()
                console.log("Catégories reçues du backend:", instrumentsData) 
                setInstrumentsDisponibles(instrumentsData || [])
                
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
                //setChargement(false)
            }
        }
        fetchData()
    }, [])

/* 
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/

    const autoFillSerialNumber = (selectedInstrumentName: string) => {
    // Find the instrument in your fetched data
    const selectedInstrument = instruments.find(
        instrument => instrument.nom_outil === selectedInstrumentName
    );
    
    // If instrument found and has a serial number, set it
    if (selectedInstrument && selectedInstrument.num_serie) {
        setNumSerie(selectedInstrument.num_serie);
        
    } else {
        // Clear the field if no instrument selected or no serial number
        setNumSerie('');
    }
};

    const handleInstrumentChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    setSelectedInstrument(selectedValue);
    
    // Auto-fill serial number when instrument changes
    autoFillSerialNumber(selectedValue);
};

    // Function to extract and format date from filename based on capteur type
const extractDateFromFilename = (fileName: string, instrumentType: string): string | null => {
    try {
        // HOBO
        if (instrumentType === 'HOBO') {
            if (fileName.length >= 23) {
                const dateStr = fileName.substring(14, 24); // Extract "2025-07-03"
                const [year, month, day] = dateStr.split('-');
                if (year && month && day) {
                    return `${year}-${month}-${day}`; // Already in correct format
                }
            }
        } 
        // KUNAK
        else if (instrumentType === 'KUNAK') {
            const datePattern = /(\d{4}-\d{2}-\d{2})/g;
            const matches = fileName.match(datePattern);
            if (matches && matches.length >= 2) {
                // Take the second date (end date)
                const endDate = matches[1];
                const [year, month, day] = endDate.split('-');
                if (year && month && day) {
                    return `${year}-${month}-${day}`;
                }
            }
        } 
        // STATIONMETEO (Station Meteo)
        else if (instrumentType === 'STATIONMETEO') {
            const datePattern = /(\d{4}-\d{2}-\d{2})/g;
            const matches = fileName.match(datePattern);
            if (matches && matches.length > 0) {
                // Take the last date in the filename
                const lastDate = matches[matches.length - 1];
                const [year, month, day] = lastDate.split('-');
                if (year && month && day) {
                    return `${year}-${month}-${day}`;
                }
            }
        } 
        // TSM4
        else if (instrumentType === 'TSM4') {
            const pattern = /(\d{4})_(\d{2})_(\d{2})/;
            const match = fileName.match(pattern);
            if (match) {
                const year = match[1];
                const month = match[2];
                const day = match[3];
                return `${year}-${month}-${day}`;
            }
        }
        const genericPattern = /(\d{4}-\d{2}-\d{2})/;
        const genericMatch = fileName.match(genericPattern);
        if (genericMatch) {
            return genericMatch[1];
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting date:', error);
        return null;
    }
};



      const autoFillInstrumentFromFile = (fileName: string) => {
    // Detection logic
    let detectedInstrument = null;
    
    if (fileName.includes('K-') || fileName.includes('K-A3')) {
        detectedInstrument = 'KUNAK';
    } else if (fileName.includes('(n°')) {
        detectedInstrument = 'HOBO';
    } else if (fileName.includes('te-')) {
        detectedInstrument = 'STATIONMETEO';
    } else if (fileName.includes('data_')) {
        detectedInstrument = 'TSM4';
    }
    
    if (detectedInstrument) {
        setSelectedInstrument(detectedInstrument);
        
        // Auto-fill serial number and other details
        const instrument = instruments.find(i => i.nom_outil === detectedInstrument);
        if (instrument) {
            setNumSerie(instrument.num_serie || '');
            setNumInstrument(instrument.num_instrument?.toString() || '');
            setModele(instrument.modele || '');
            
        }
        
        // Extract date as before
        const extractedDate = extractDateFromFilename(fileName, detectedInstrument);
        if (extractedDate) {
            setDateCueilli(extractedDate);
        }
    }
};




    const handleFileUpload = () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          setSelectedFile(file);
          setShowAdditionalInputs(true);
          autoFillInstrumentFromFile(file.name);
          handleAutofillExtension(file);
        }
      };  
      fileInput.click();
  };

    const handleAutofillExtension = (file: File) => {
    if (file && file.name.includes('.')) {
      const extensionPart = file.name.split('.').pop() || '';
      setExtension(extensionPart);
    } else if (file) {
      setExtension('');
      alert('Le fichier sélectionné n\'a pas d\'extension');
    }
};
    
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
      
      console.log('Uploading file:', selectedFile.name);
      console.log('Instrument:', selectedInstrument);
      console.log('Nom:', nom);
      console.log('Prenom:', prenom);
      console.log('Mail:', mail);
      console.log('Numéro de série:', numSerie);
      console.log('Extension:', extension);
      console.log('Date Import:',dateImport);
      console.log('Date Cueilli:', dateCueilli);
      console.log('Type source:', typeSource);
      
      alert(`Fichier "${selectedFile.name}" prêt à être uploadé`);
    };

    return(
      <Box sx={{ flexGrow: 1 }}>                         
        <AppBar position="static" sx={{ bgcolor: "#EC9706" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>DEPOT DE FICHIER</Typography>
            <Button color="inherit" onClick={() => navigate('/ajout')}>Retour</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth='md' sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>DÉPÔT DE FICHIER</b></center>
                <br></br>
                </Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleFileUpload}
                  sx={{
                    bgcolor: '#EC9706',
                    '&:hover': { bgcolor: '#C78023' },
                  }}
                >
                  SÉLECTION DE FICHIER
                </Button>
                
                {selectedFile && (
                  <Typography variant="body2" sx={{ color: 'green', textAlign: 'center' }}>
                    Fichier sélectionné: {selectedFile.name}
                  </Typography>
                )}

                {showAdditionalInputs && (
                  <>

                    <FormControl fullWidth required>
                        <InputLabel>Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier</InputLabel>
                        <Select
                            value={selectedInstrument} 
                            onChange={handleInstrumentChange}
                            label="Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier"
                        >
                            {instruments.map((instrument) => (
                                <MenuItem 
                                    key={instrument.id_instrument} 
                                    value={instrument.nom_outil}
                                >
                                    {instrument.nom_outil}
                                </MenuItem>
                            ))}
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
                      label="Prenom"
                      variant="outlined"
                      fullWidth
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Entrez votre prenom"
                    />
                    <TextField
                      label="Mail"
                      variant="outlined"
                      fullWidth
                      required
                      value={mail}
                      onChange={(e) => setMail(e.target.value)}
                      placeholder="Entrez votre eMail"
                    />
                    
                    <TextField
                          label="Numero de serie"
                          variant="outlined"
                          fullWidth
                          required
                          value={numSerie}
                          onChange={(e) => setNumSerie(e.target.value)}
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
                    </Stack>
                    
                  <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Date Cuilli"
                        type="date"
                        variant="outlined"
                        fullWidth
                        required
                        value={dateCueilli}
                        onChange={(e) => setDateCueilli(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
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
                        sx={{ minWidth: '100px', height: '56px' }}
                      >
                        Aujourd'hui
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