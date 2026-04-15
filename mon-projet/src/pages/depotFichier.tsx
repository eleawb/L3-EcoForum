import { useState } from 'react'; 
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
    const [selectedCapteur, setSelectedCapteur] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
    const [nom, setNom] = useState<string>('');
    const [numSerie, setnumSerie] = useState<string>('');
    const [extension, setExtension] = useState<string>('');
    const [dateImport, setDateImport] = useState<string>('');
    const [typeSource, setTypeSource] = useState<string>('');

    const isFormComplete = selectedInstrument !== '' && selectedCapteur !== '';
    const areAdditionalInputsComplete = 
    nom !== '' && 
    numSerie !== '' && 
    extension !== '' && 
    dateImport !== '' && 
    typeSource !== '';

    const handleInstrumentChange = (event: SelectChangeEvent) => {
      setSelectedInstrument(event.target.value);
    };
    
    const handleCapteurChange = (event: SelectChangeEvent) => {
      setSelectedCapteur(event.target.value);
    };

    // Function to extract and format date from filename based on capteur type
    const extractDateFromFilename = (fileName: string, capteurType: string): string | null => {
      try {
        if (capteurType === 'capteur2') { // HOBO
          // Format: (n°02)211500372025-07-0314_20_43CEST.xlsx
          // Date at position 15, format: YYYY-MM-DD
          if (fileName.length >= 23) {
            const dateStr = fileName.substring(14, 24); // Extract "2025-07-03"
            const [year, month, day] = dateStr.split('-');
            if (year && month && day) {
              return `${year}-${month}-${day}`; // Already in correct format
            }
          }
        } 
        else if (capteurType === 'capteur1') { // KUNAK
          // Format: K-A3 CLEAN AIR EUR 12 reads 2025-12-01 00_00_00 to 2025-12-31 23_59_59 (2).csv
          // Look for pattern YYYY-MM-DD
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
        else if (capteurType === 'capteur3') { // Station Meteo
          // Format: te-2024-04-2025-03-17.xls
          // Extract last date pattern YYYY-MM-DD
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
        else if (capteurType === 'capteur4') { // TSM4
          // Format: data_95224601_2024_11_19_0
          // Pattern: YYYY_MM_DD
          const pattern = /(\d{4})_(\d{2})_(\d{2})/;
          const match = fileName.match(pattern);
          if (match) {
            const year = match[1];
            const month = match[2];
            const day = match[3];
            return `${year}-${month}-${day}`;
          }
        }
        return null;
      } catch (error) {
        console.error('Error extracting date:', error);
        return null;
      }
    };

    const autoFillCapteurFromFile = (fileName: string) => {
      if (fileName.includes('K-')) {
        setSelectedCapteur('capteur1'); // KUNAK
        // Extract and set date for KUNAK
        const extractedDate = extractDateFromFilename(fileName, 'capteur1');
        if (extractedDate) {
          setDateImport(extractedDate);
        }
      } else if (fileName.includes('(n°')) {
        setSelectedCapteur('capteur2'); // HOBO
        // Extract and set date for HOBO
        const extractedDate = extractDateFromFilename(fileName, 'capteur2');
        if (extractedDate) {
          setDateImport(extractedDate);
        }
      } else if (fileName.includes('te-')) {
        setSelectedCapteur('capteur3'); // Station Meteo
        // Extract and set date for Station Meteo
        const extractedDate = extractDateFromFilename(fileName, 'capteur3');
        if (extractedDate) {
          setDateImport(extractedDate);
        }
      } else if (fileName.includes('data_')) {
        setSelectedCapteur('capteur4'); // TSM4
        // Extract and set date for TSM4
        const extractedDate = extractDateFromFilename(fileName, 'capteur4');
        if (extractedDate) {
          setDateImport(extractedDate);
        }
      }
    };

    const handleFileUpload = () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv, .txt, .json, .xlsx, .xls';
      
      fileInput.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          setSelectedFile(file);
          setShowAdditionalInputs(true);
          autoFillCapteurFromFile(file.name);
        }
      };  
      fileInput.click();
    };

    const handleAutofillExtension = () => {
      if (selectedFile && selectedFile.name.includes('.')) {
        const extensionPart = selectedFile.name.split('.').pop() || '';
        setExtension(extensionPart);
      } else if (selectedFile) {
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
      console.log('Capteur:', selectedCapteur);
      console.log('Nom:', nom);
      console.log('Numéro de série:', numSerie);
      console.log('Extension:', extension);
      console.log('Date import:', dateImport);
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
            <Typography variant='h4' gutterBottom align="center">AJOUT</Typography>

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
                      <InputLabel>Sélectionnez le capteur pour lequel vous souhaitez déposer un fichier</InputLabel>
                      <Select
                        value={selectedInstrument}
                        onChange={handleInstrumentChange}
                        label="Sélectionnez le capteur pour lequel vous souhaitez déposer un fichier"
                      >
                        <MenuItem value="instrument1">Capteur 1</MenuItem>
                        <MenuItem value="instrument2">Capteur 2</MenuItem>
                        <MenuItem value="instrument3">Capteur 3</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required>
                      <InputLabel>Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier</InputLabel>
                      <Select
                        value={selectedCapteur}
                        onChange={handleCapteurChange}
                        label="Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier"
                      >
                        <MenuItem value="capteur1">KUNAK</MenuItem>
                        <MenuItem value="capteur2">HOBO</MenuItem>
                        <MenuItem value="capteur3">Station Meteo</MenuItem>
                        <MenuItem value="capteur4">TSM4</MenuItem>
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
                        sx={{ minWidth: '100px', height: '56px' }}
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