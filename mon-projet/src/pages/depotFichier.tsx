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
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des etats
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  const [selectedInstrument, setSelectedInstrument] = useState<string>('');//Instrument selectione
  const [numInstrument, setNumInstrument] = useState<string>('');
  const [instruments, setInstrumentsDisponibles] = useState([]);
  const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
  const [utilisateur, setUtilisateur] = useState<string>('');
  const [selectedResponsable,setSelectedResponsable] = useState<string>('');
  const [responsables, setResponsablesDisponibles] = useState([]);
  const [isNewResponsable, setIsNewResponsable] = useState<boolean>(false);//Check si le repssable fichier fut cree pour cet ajout
  const [showCreationRespInputs, setShowCreationRespInputs] = useState<boolean>(false);
  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [numSerie, setNumSerie] = useState<string>('');
  const [extension, setExtension] = useState<string>('');
  const [dateCueilli, setDateCueilli] = useState<string>('');
  const [dateImport, setDateImport] = useState<string>('');
  const [typeSource, setTypeSource] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const FirstFormComplete = selectedInstrument !== '' && numInstrument !== '';
  const areAdditionalInputsComplete = utilisateur !== '';
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
FetchData
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
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
            }
        }
        //Effectue le call a fetch data une seule fois en page load
useEffect(() => {
        fetchData();
    }, [])

/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des fonctions
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  //Gestion du changement d instrument
  const InstrumentChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    setSelectedInstrument(selectedValue);

    //Detection du numeroInstrument
    const instrument = instruments.find(i => i.nom_outil === selectedInstrument);
      if (instrument) {
        setNumInstrument(instrument.num_instrument?.toString() || '');   
      }
  };

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
      }else{
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
  //Gerer le changement de responsable
  const ResponsableChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    setSelectedResponsable(selectedValue);
    setIsNewResponsable(false);//Remet le flag a false quand on prend un responsable autre que celui nouvellement cree
};

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
    console.log("Responsable fichier créé avec succès");
                  
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

  //Evenement de Submit
  const Submit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      console.log('Instrument:', selectedInstrument);
      console.log('Uploading file:', selectedFile.name);
  }
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
REACT
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
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

              <TextField
                label="Numero de l-instrument"
                variant="outlined"
                fullWidth
                required
                value={numInstrument}
                onChange={(e) => setNumInstrument(e.target.value)}
                placeholder="Entrez le numero de l-instrument"
              />

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
                      
                    <TextField
                      label="Utilisateur"
                      variant="outlined"
                      fullWidth
                      required
                      value={utilisateur}
                      onChange={(e) => setUtilisateur(e.target.value)}
                      placeholder="Qui veut deposer le fichier"
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
                    Creer nouveau responsable fichier  
                    </Button>
                    
                   {showCreationRespInputs &&(
                    <>
                   <TextField
                      label="nom"
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
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Format(extension)"
                        variant="outlined"
                        fullWidth
                        required
                        value={extension}
                        onChange={(e) => setExtension(e.target.value)}
                        placeholder="E  u fichier"
                      />
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
                  disabled={!FirstFormComplete || !selectedFile || !areAdditionalInputsComplete}
                  sx={{
                    bgcolor: (FirstFormComplete && selectedFile && areAdditionalInputsComplete) ? '#EC9706' : '#CCCCCC',
                    '&:hover': {
                      bgcolor: (FirstFormComplete && selectedFile && areAdditionalInputsComplete) ? '#C78023' : '#CCCCCC',
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