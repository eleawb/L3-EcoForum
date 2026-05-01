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
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

function DepotFichier(){
    const navigate = useNavigate();

    const [selectedInstrument, setSelectedInstrument] = useState<string>('');
    const [selectedResponsable,setSelectedResponsable] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
    const [showCreationRespInputs, setShowCreationRespInputs] = useState<boolean>(false);
    const [utilisateur, setUtilisateur] = useState<string>('');
    const [nom, setNom] = useState<string>('');
    const [prenom, setPrenom] = useState<string>('');
    const [mail, setMail] = useState<string>('');
    const [numSerie, setNumSerie] = useState<string>('');
    const [extension, setExtension] = useState<string>('');
    const [dateImport, setDateImport] = useState<string>('');
    const [dateCueilli, setDateCueilli] = useState<string>('');
    const [typeSource, setTypeSource] = useState<string>('');
    const [instruments, setInstrumentsDisponibles] = useState<any[]>([]);
    const [numInstrument, setNumInstrument] = useState<string>('');
    const [modele, setModele] = useState<string>('');
    const [responsables, setResponsablesDisponibles] = useState<any[]>([]);
    const [isNewResponsable, setIsNewResponsable] = useState<boolean>(false);//Check si le repssable fichier fut cree pour cet ajout

    const isFormComplete = selectedInstrument !== '';
    const areAdditionalInputsComplete = 
    utilisateur !== '' &&
    numSerie !== '' && 
    extension !== '' && 
    dateImport !== '' && 
    dateCueilli !== '' && 
    typeSource !== '';
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/
const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await fetch('http://localhost:3000/api/instruments')
                const instrumentsData = await instrumentsRes.json()
                console.log("instruments reçues du backend:", instrumentsData) 
                setInstrumentsDisponibles(instrumentsData || [])

                const respononsablesRes = await fetch('http://localhost:3000/api/responsables')
                const respononsablesData = await respononsablesRes.json()
                console.log("Respononsables reçues du backend:", respononsablesData)
                setResponsablesDisponibles(respononsablesData || [])

            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
                //setChargement(false)
            }
        }
        //Effectue le call a fetch data une seule fois en page load
useEffect(() => {
        fetchData();
    }, [])

    const handleCreateResponsable = async () => {
              //Verifie si les entrees sont remplies
              if (!nom || !prenom || !mail) {
                alert("Veuillez remplir tous les champs (nom, prénom, email)");
                return;
              }

              try {
                const response = await fetch('http://localhost:3000/api/responsable_fichier', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    nom: nom,
                    prenom: prenom,
                    email: mail,
                    fonction: "responsable_fichier" // toujours un responsable_fichier
                  }),
                });

                if (response.ok) {
                  const data = await response.json();
                  //alert("Responsable fichier créé avec succès!");
                  
                  // recharger la liste des responsables fichiers disponibles dans la BDD
                  fetchData();
                  
                   // Remettre le form de creation en blanc
                  setNom('');
                  setPrenom('');
                  setMail('');
                  setShowCreationRespInputs(false);
                  //Selection automatique du responsable cree
                  setSelectedResponsable(data.email);
                  setIsNewResponsable(true);//sets la valeur de NewResponsable a true

                } else {
                  const error = await response.json();
                  alert(`Erreur: ${error.message}`);
                }
              } catch (error) {
                console.error('Error:', error);
                alert("Erreur lors de la création du responsable");
              }
        };

/* 
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//Generation du JSONfile a envoyer*/
const generateJSONFile = () => {
  //format de la date demande pour le JSON  =  YYYY-MM-DD HH:MM:SS 
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  //Ajout de les heures et minutes mis a 0 pour match le format demande
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes(' ')) return dateStr;
    return `${dateStr} 00:00:00`;
  };

  //Prends les instruments pour obtenier num_instrument
  const selectedInstrumentObj = instruments.find(
    instrument => instrument.nom_outil === selectedInstrument
  );

  //Trouver le responsable fichier pour obtenir le nom, prenom et mail
  const selectedResponsableObj = responsables.find(
    responsable => responsable.adresse_mail === selectedResponsable
  );

  const formData = {
    chemin_source: selectedFile ? selectedFile.name : "",
    type_source: typeSource,
    script: "integration",
    est_responsable_fichier: !isNewResponsable, // on determine si le responsable a ete cree recement
    mail_responsable: selectedResponsable,
    nom: selectedResponsableObj?.nom || "",
    prenom: selectedResponsableObj?.prenom || "",
    fonction: "Respons  able Fichier",
    encadre_par: [], // vide, pas implemente
    nom_outil: selectedInstrument,
    num_instrument: selectedInstrumentObj?.num_instrument || numInstrument,
    num_serie: numSerie,
    extension: extension,
    date_recueil: formatDateTime(dateCueilli),
    date_import: formatDateTime(dateImport || getCurrentDateTime()),
    commentaire: ""
  };

  //Convertir au format JSON
  const jsonString = JSON.stringify(formData, null, 2);
  
  //Creer le fichier //telecharger le fichier, actuellement para probar
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `depot_fichier_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  //alert("Fichier JSON généré avec succès!");
};


    const autoFillSerialNumber = (selectedInstrumentName: string) => {
    // Trouver les instruments dans le data on a recupere
    const selectedInstrument = instruments.find(
        instrument => instrument.nom_outil === selectedInstrumentName
    );
    
    //Si l-instrument possede un numero de serie, on le met
    if (selectedInstrument && selectedInstrument.num_serie) {
        setNumSerie(selectedInstrument.num_serie);
        
    } else {
       
        //Si l-instrument selectionne n-as pas de numero de serie, laisser l-input libre
        setNumSerie('');
    }
};

    const InstrumentChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setSelectedInstrument(selectedValue);
    
    //Auto completion du numero de serie quand l-instrument changes
    autoFillSerialNumber(selectedValue);
};
  const ResponsableChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setSelectedResponsable(selectedValue);
    setIsNewResponsable(false);//Remet le flag a false quand on prend un responsable autre que celui nouvellement cree
};

    //fonction pour extraire et formater la date a partir du nom du fichier base sur le type de linstrument
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
    let detectedInstrument : string | null = null;
    
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
        
        //AUto completion du numero de serie
        const instrument = instruments.find(i => i.nom_outil === detectedInstrument);
        if (instrument) {
            setNumSerie(instrument.num_serie || '');
            setNumInstrument(instrument.num_instrument?.toString() || '');
            setModele(instrument.modele || '');
            
        }
        
        //Extractuion de la date
        const extractedDate = extractDateFromFilename(fileName, detectedInstrument);
        if (extractedDate) {
            setDateCueilli(extractedDate);
        }
    }
};

///////////////////////////////////
    const FileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xlsx, .xls, .png, .wav';
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        
        // envoyer le file au back end
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Upload success:', result);
            setSelectedFile(file);
            setShowAdditionalInputs(true);
            autoFillInstrumentFromFile(file.name);
            AutofillExtension(file);
            AutofillTypeSource(file);
          } else {
            alert('Erreur sauvagarde');
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Error uploading file');
        }
      }
    };  
    fileInput.click();
};
///////////////////////////
  const AutofillTypeSource = (file: File) => {
    if (file && file.name.includes('.')) {
    const extension = file.name.split('.').pop() || '';
    console.log(extension);
    
    //Verifier si l-extension est d-un fichier_mesure
      if(extension.includes('xls')||
      extension.includes('xlsx')||
      extension.includes('csv'))
      {setTypeSource('fichier_mesure')}

      //Verifier si l-extension est d-un dosier_audio
      if(extension.includes('mp3')){setTypeSource('dossier_audio')}

      //Verifier si l-extension est d-un dossier_image
      if(extension.includes('png')||
      extension.includes('jpg')||
      extension.includes('jpeg')||
      extension.includes('svg'))
      {setTypeSource('dossier_image')}
    }
    else{setTypeSource('')}
    
  };

    const AutofillExtension = (file: File) => {
    if (file && file.name.includes('.')) {
      const extensionPart = file.name.split('.').pop() || '';
      setExtension(extensionPart);
    } else if (file) {
      setExtension('');
      alert('Le fichier sélectionné n\'a pas d\'extension');
    }
  };
    
    const AutofillDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDateImport(`${year}-${month}-${day}`);
    };

    const Submit = (event: React.FormEvent<HTMLFormElement>) => {
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
      generateJSONFile();
      
      console.log('Uploading file:', selectedFile.name);
      console.log('Instrument:', selectedInstrument);
      console.log('User : utilistateur');
      console.log('Numéro de série:', numSerie);
      console.log('Extension:', extension);
      console.log('Date Import:',dateImport);
      console.log('Date de cueillie:', dateCueilli);
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
                <br/>
                </Typography>
            <form onSubmit={Submit}>
              <Stack spacing={3}>

<FormControl fullWidth required>
                        <InputLabel>Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier</InputLabel>
                        <Select
                            value={selectedInstrument} 
                            onChange={InstrumentChange}
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

                <Button
                  type="button"
                  variant="contained"
                  onClick={FileUpload}
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
                            value={selectedInstrument || ''} 
                            onChange={InstrumentChange}
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
                      label="Utilisateur"
                      variant="outlined"
                      fullWidth
                      required
                      value={utilisateur}
                      onChange={(e) => setUtilisateur(e.target.value)}
                      placeholder="Qui veut déposer le fichier"
                    />

                    <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le Responsable_fichier</InputLabel>
                        <Select
                            value={selectedResponsable} 
                            onChange={ResponsableChange}
                            label="Sélectionnez le Responsable_fichier"
                        >
                            {responsables.map((responsable) => (
                                <MenuItem 
                                    key={responsable.id_personne} 
                                    value={responsable.adresse_mail}
                                >
                                    {responsable.nom} {responsable.prenom}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                    type="button"
                    variant="outlined"
                    onClick={(e) => setShowCreationRespInputs(true)}
                    sx={{ minWidth: '100px', height: '56px' }}
                    >
                    Créer nouveau responsable fichier  
                    </Button>
                    
                   {showCreationRespInputs &&(
                    <>
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
                      label="Prénom"
                      variant="outlined"
                      fullWidth
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Entrez votre prénom"
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
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={handleCreateResponsable}
                        sx={{ minWidth: '100px', height: '56px' }}
                      >
                        Creer
                      </Button>

                    </>
                    )}
                    
                    <TextField
                          label="Numéro de série"
                          variant="outlined"
                          fullWidth
                          required
                          value={numSerie}
                          onChange={(e) => setNumSerie(e.target.value)}
                          placeholder="Entrez le numéro de série"
                      />
                  
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Format (extension)"
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
                        label="Date de cueillie"
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
                        label="Date d'import"
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
                        onClick={AutofillDate}
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
                        <MenuItem value="fichier_mesure">fichier_mesure</MenuItem>
                        <MenuItem value="dossier_audio">dossier_audio</MenuItem>
                        <MenuItem value="dossier_image">dossier_image</MenuItem>
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