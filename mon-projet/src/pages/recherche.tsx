import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  Radio,
  RadioGroup,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Stack,
  FormControl,
  FormLabel,
  InputLabel,
  RadioGroup as MuiRadioGroup,
  Select,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';

function Recherche() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [ddate, setDate] = useState('');


    const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectEverything, setSelectedEverything] = useState(false);

    const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]); //plusieurs catégories
    const [instrumentsFiltres, setInstrumentsFiltres] = useState<any[]>([]);

    // Méthode de datation
    const [choixDate, setChoixDate] = useState('');
    const [jourdeb, setJourDeb] = useState('');
    const [jourfin, setJourFin] = useState('');
    const [heuredeb, setHeureDeb] = useState('');
    const [heurefin, setHeureFin] = useState('');
    const [semainedeb, setSemaineDeb] = useState('');
    const [semainefin, setSemaineFin] = useState('');
    const [moisdeb, setMoisDeb] = useState('');
    const [moisfin, setMoisFin] = useState('');
    const [anneedeb, setAnneeDeb] = useState('');
    const [anneefin, setAnneeFin] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            console.log("début du fetch data");
            try {
                const instrumentsRes = await fetch('http://localhost:3000/api/instruments');
                const instrumentsData = await instrumentsRes.json();
                setInstrumentsDisponibles(instrumentsData || []);
                
                const categoriesRes = await fetch('http://localhost:3000/api/categories');
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData || []);
                
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Changement catégorie pour instruments
    const handleCategorieChangeInstrument = async (values: string[]) => {
        setCategoriesSelectionnees(values);
        setSelectedInstruments([]);
        setSelectedEverything(false);

        if (values.length===0) {
            setInstrumentsFiltres(instrumentsDisponibles);
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/instruments/by-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: values })
            });
            
            if (response.ok) {
                const data = await response.json();
                setInstrumentsFiltres(data);
            } else {
                setInstrumentsFiltres([]);
            }
        } catch (error) {
            console.error('Erreur:', error);
            setInstrumentsFiltres([]);
        }
    };

 // Gestion de la sélection d'un instrument
 const handleInstrumentChange = (instrumentValue: string) => {
  setSelectedInstruments(prev => {
    let newSelection:string[];
      if (prev.includes(instrumentValue)) {
          newSelection = prev.filter(v => v !== instrumentValue);
      } else {
          newSelection= [...prev, instrumentValue];
      }
     
    // verif si tous les instruments sont sélectionnés
    const allValues = listeInstruments.map(item => item.nom_outil || item.modele);
    const isAllSelected = allValues.length === newSelection.length && allValues.length>0 && allValues.every(v=>newSelection.includes(v));
  
    setSelectedEverything(isAllSelected);
    return newSelection;
  })

  }


//gestion du tt sélectionner
const handleSelectEverything = () => {
  if (!selectEverything) {
    const allValues = listeInstruments.map(item => item.nom_outil || item.modele);
      setSelectedInstruments(allValues);
      setSelectedEverything(true);
      
  } else {
    setSelectedInstruments([]);
    setSelectedEverything(false);
  }
  
};



    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (selectedInstruments.length===0) {
            alert('Veuillez sélectionner au moins un instrument');
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/recherche`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instrument: selectedInstruments,
                    choixDate: choixDate,
                    dateDebut: jourdeb || heuredeb || semainedeb || moisdeb || anneedeb,
                    dateFin: jourfin || heurefin || semainefin || moisfin || anneefin
                })
            });
            const resultats = await response.json();
            console.log('Résultats de la recherche:', resultats);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            alert('Erreur lors de la recherche');
        }
    };

    const listeInstruments = categoriesSelectionnees ? instrumentsFiltres : instrumentsDisponibles;

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ bgcolor: "#0370B2" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        RECHERCHER DES DONNÉES
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/')}>Retour</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom align="center">Formulaire de recherche</Typography>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>

                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    {/* Filtre par catégorie */}
                                    <FormControl fullWidth>
                                        <InputLabel>Filtrer par catégorie</InputLabel>
                                        <Select
                                            multiple //pouvoir sélectionner plusieurs catégories 
                                            value={categoriesSelectionnees}
                                            label="Filtrer par catégorie"
                                            onChange={(e) => handleCategorieChangeInstrument(e.target.value as string[])} //as string[] sinon ne reconnait ps
                                            renderValue={(selected) => {
                                              if (selected.length === 0) return <em>Toutes les catégories</em>;
                                              return selected.join(', ');
                                          }}
                                      >
                                            {categories.map((item) => (
                                                <MenuItem key={item.id_categorie} value={item.nom}>
                                                    {item.nom}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>


                                    {listeInstruments.length === 0 ? (
                                      categoriesSelectionnees.length >1 ? (
                                        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucun instrument ne correspond aux catégories "{categoriesSelectionnees.join(', ')}"
                                        </Typography>
                                    ) : (
                                      <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucun instrument ne correspond à la catégorie "{categoriesSelectionnees}"
                                        </Typography>
                                    )
                                    ) : (
                                   /* Sélection de l'instrument */
                                  <FormControl component="fieldset" required sx={{ mb: 2 }}>
                                  <FormLabel component="legend">Sélectionnez un ou plusieurs instruments</FormLabel>
    
                                  {/* Bouton Tout sélectionner */}
                                  {listeInstruments.length>=2 && (
                                  <Box sx={{ mb: 1, ml: -0.5 }}>
                                  <FormControlLabel
                                    control={
                                    <Checkbox 
                                        checked={selectEverything}
                                        onChange={handleSelectEverything}
                                        size="small"
                                        sx={{
                                          color: '#666',
                                          '&.Mui-checked': { color: '#666' },
                                          transform: 'scale(0.8)'
                                        }}
                                    />
                                    }
                                    label={
                                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                      Tout sélectionner
                                    </Typography>
                                    }
                                    />
                                  </Box>
                                  )}
    
                                  {/* Liste des instruments */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {listeInstruments.map((item) => (
                                                <FormControlLabel
                                                    key={item.id_instrument}
                                                    control={
                                                        <Checkbox
                                                            checked={selectedInstruments.includes(item.nom_outil || item.modele)}
                                                            onChange={() => handleInstrumentChange(item.nom_outil || item.modele)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={`${item.nom_outil || item.modele} - ${item.num_instrument || ''}`}
                                                />
                                            ))}
                                        </Box>
                                    </FormControl>
                                
                            )}
                            </>
                            )}
                            {/* Méthode de datation */}
                            <Box key="date-box" sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                                <InputLabel>Veuillez choisir une méthode de datation :</InputLabel>
                                <FormControl component="fieldset">
                                    <RadioGroup row value={choixDate} onChange={(e) => setChoixDate(e.target.value)}>
                                        <FormControlLabel value="Heure" control={<Radio />} label="Heure" />
                                        <FormControlLabel value="Jour" control={<Radio />} label="Jour" />
                                        <FormControlLabel value="Semaine" control={<Radio />} label="Semaine" />
                                        <FormControlLabel value="Mois" control={<Radio />} label="Mois" />
                                        <FormControlLabel value="Année" control={<Radio />} label="Année" />
                                    </RadioGroup>
                                </FormControl>
                            </Box>

                            {/* Heure */}
                            {choixDate === 'Heure' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="time" value={heuredeb} onChange={(e) => setHeureDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                    <input type="time" value={heurefin} onChange={(e) => setHeureFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                </Stack>
                            )}

                            {/* Jour */}
                            {choixDate === 'Jour' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="date" value={jourdeb} onChange={(e) => setJourDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                    <input type="date" value={jourfin} onChange={(e) => setJourFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                </Stack>
                            )}

                            {/* Semaine */}
                            {choixDate === 'Semaine' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="date" value={semainedeb} onChange={(e) => setSemaineDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                    <input type="date" value={semainefin} onChange={(e) => setSemaineFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                </Stack>
                            )}

                            {/* Mois */}
                            {choixDate === 'Mois' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="date" value={moisdeb} onChange={(e) => setMoisDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                    <input type="date" value={moisfin} onChange={(e) => setMoisFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                </Stack>
                            )}

                            {/* Année */}
                            {choixDate === 'Année' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="date" value={anneedeb} onChange={(e) => setAnneeDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                    <input type="date" value={anneefin} onChange={(e) => setAnneeFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                                </Stack>
                            )}

                            <Button type="submit" variant="contained" startIcon={<SearchIcon />} sx={{ bgcolor: '#0370B2', '&:hover': { bgcolor: '#00517C' } }}>
                                Rechercher
                            </Button>
                          
                        </Stack>
                    </form>
                </Paper>
            </Container>
            
        </Box>
    );
}

export default Recherche;