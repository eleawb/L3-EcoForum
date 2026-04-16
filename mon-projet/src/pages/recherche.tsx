import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon  } from '@mui/icons-material'

import {
  Radio,
  Autocomplete,
  TextField,
  Select,
  Switch,
  FormGroup,
  RadioGroup,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Stack,
  Divider,
  FormControl,
  FormLabel,
  InputLabel,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material'

function Recherche() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<any[]>([])
    const [instrumentsSelectionnes, setInstrumentsSelectionnes] = useState<string[]>([])
    const [ddate, setDate] = useState('')


    const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([])
    const [chargement, setChargement] = useState(true)
    const [selectTout, setSelectTout] = useState(false)

    const [filtreActif, setFiltreActif] = useState(false) //faire apparaitre ou pas le filtre catégorie
    const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]) 
    const [instrumentsFiltres, setInstrumentsFiltres] = useState<any[]>([])
    const [messageErreur, setMessageErreur] = useState('') //pr recup le nom des catégories choisies


    // Méthode de datation
    //si choix dates précises
    const [datesPrecises, setDatesPrecises] = useState(false)
  //si choix périodes 
  const [periodesTemp, setPeriodesTemp] = useState(false)
// alors, états pour les jours de la semaine
const [joursSemaine, setJoursSemaine] = useState<string[]>([]);
const [periodesAjoutees, setPeriodesAjoutees] = useState<Array<{id: string, type: string, valeur: string}>>([]);

    const [choixDate, setChoixDate] = useState('')
    const [jourdeb, setJourDeb] = useState('')
    const [jourfin, setJourFin] = useState('')
    const [heuredeb, setHeureDeb] = useState('')
    const [heurefin, setHeureFin] = useState('')
    const [semainedeb, setSemaineDeb] = useState('')
    const [semainefin, setSemaineFin] = useState('')
    const [moisdeb, setMoisDeb] = useState('')
    const [moisfin, setMoisFin] = useState('')
    const [anneedeb, setAnneeDeb] = useState('')
    const [anneefin, setAnneeFin] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await fetch('http://localhost:3000/api/instruments')
                const instrumentsData = await instrumentsRes.json()
                setInstrumentsDisponibles(instrumentsData || [])
                
                const categoriesRes = await fetch('http://localhost:3000/api/categories')
                const categoriesData = await categoriesRes.json()
                console.log("Catégories reçues du backend:", categoriesData)
                //setCategories(categoriesData || [])
                setCategories([...categoriesData])

                console.log("Catégories chargées")
                
                setChargement(false)
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
                setChargement(false)
            }
        }
        fetchData()
    }, [])

    //debug cat
    useEffect(() => {
      console.log("🟢 categories a changé !", categories.length)
    }, [categories])

    //recup les ss catégories d'une catégorie
    const getToutesSScat = (categorieNom: string): string[] => {
      if (!categorieNom|| categorieNom === 'null' || categorieNom === 'undefined') return []
      const result: string[] = [categorieNom]
      const categorie = categories.find(c => c.nom === categorieNom)
      if (!categorie) return result
      
      const enfants = categories.filter(c => c.id_parent === categorie.id_categorie)
      for (const enfant of enfants) {
        if (enfant && enfant.nom && enfant.nom!=='null') {
          result.push(...getToutesSScat(enfant.nom))
      }
    }
      return result.filter(c => c && c.trim() !== '') //pas reucp les erreurs
  }

    // Changement de catégorie pour les instruments
    const CategorieChangePourInstrument = async (values: string[]) => {
      console.log("ids des catégories sélectionnées:", values)
      
      setCategoriesSelectionnees(values)
      setInstrumentsSelectionnes([])
      setSelectTout(false)
  
      if (values.length === 0) {
          setInstrumentsFiltres(instrumentsDisponibles)
          setMessageErreur('')

          return
      }

      // Convertir en nombres pour l'API
      const idsNumbers = values.map(v => parseInt(v, 10))
      
      // Récupérer les noms des catégories pour l'API
      const nomsCategories = idsNumbers.map(id => {
          const cat = categories.find(c => c.id_categorie === id)
          return cat?.nom
      }).filter(Boolean)

      console.log("noms des catégories envoyés à l'API:", nomsCategories)

      
      try {
          const response = await fetch('http://localhost:3000/api/instruments/by-categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ categories: nomsCategories })
          })
          
          if (response.ok) {
              const data = await response.json()
              setInstrumentsFiltres(data)
              if (data.length === 0) {
                // Construire le message d'erreur avec les noms des catégories
                const message = nomsCategories.length > 1 
                    ? `Aucun instrument ne correspond aux catégories "${nomsCategories.join(', ')}"`
                    : `Aucun instrument ne correspond à la catégorie "${nomsCategories[0]}"`
                setMessageErreur(message)
            } else {
                setMessageErreur('')
            }
          } else {
              setInstrumentsFiltres([])
              const message = nomsCategories.length > 1 
                ? `Aucun instrument ne correspond aux catégories "${nomsCategories.join(', ')}"`
                : `Aucun instrument ne correspond à la catégorie "${nomsCategories[0]}"`
            setMessageErreur(message)
        }
          
      } catch (error) {
          console.error('Erreur:', error)
          setInstrumentsFiltres([])
          const message = nomsCategories.length > 1 
          ? `Aucun instrument ne correspond aux catégories "${nomsCategories.join(', ')}"`
          : `Aucun instrument ne correspond à la catégorie "${nomsCategories[0]}"`
      setMessageErreur(message)
  }
}
    

 // Gestion de la sélection d'un instrument
 // Au lieu de stocker les noms, stocke les IDs
const InstrumentSelection = (valeurId: number) => {
  setInstrumentsSelectionnes(prev => {
      if (prev.includes(valeurId.toString())) {
          return prev.filter(v => v !== valeurId.toString())
      } else {
          return [...prev, valeurId.toString()]
      }
  })
  setSelectTout(false)
}

  

// afficher les catégories avec indentation selon le niveau
const affichageCategoriesNiveaux = (categorie: any, profondeur: number) => {
  if (!categorie || !categorie.id_categorie || !categorie.nom) return null
  
  const enfants = categories.filter(c => c.id_parent === categorie.id_categorie)
  const estSelectionne = categoriesSelectionnees.includes(categorie.id_categorie.toString())
  console.log("MenuItem value:", categorie.id_categorie, categorie.id_categorie.toString())
  return (
      <Box key={categorie.id_categorie}>
          <MenuItem 
              value={categorie.id_categorie.toString()}
              sx={{
                  pl: profondeur * 4,
                  bgcolor: profondeur === 0 ? '#f8f9fa' : 'transparent',
                  borderBottom: profondeur === 0 ? '1px solid #eee' : 'none',
                  '&:hover': { bgcolor: '#e3f2fd' }
              }}
          >
              <Checkbox 
                  checked={estSelectionne} 
                  size="small"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
              />
              <Typography 
                  variant="body2" 
                  sx={{ 
                      fontWeight: profondeur === 0 ? 600 : 400,
                      color: profondeur === 0 ? '#0370B2' : 'inherit'
                  }}
              >
                  {profondeur > 0 && '↳ '}{categorie.nom} {/*affichage hiérarchique*/}
              </Typography>
              {enfants.length > 0 && (
                  <Typography variant="caption" sx={{ ml: 1, color: '#aaa' }}>
                      ({enfants.length})
                  </Typography>
              )}
          </MenuItem>
          {enfants.map(enfant => affichageCategoriesNiveaux(enfant, profondeur + 1))}
      </Box>
  )
}


//gestion du tt sélectionner
const CocheTTselectionner = () => {
  if (!selectTout) {
    const ttesValeurs = listeInstruments.map(item => item.nom_outil || item.modele)
    setInstrumentsSelectionnes(ttesValeurs)
    setSelectTout(true)
      
  } else {
    setInstrumentsSelectionnes([])
    setSelectTout(false)
  }
  
}

// Récupère tous les IDs des enfants d'une catégorie
const getAllChildrenIds = (parentId: number): string[] => {
  const enfants = categories.filter(c => c.id_parent === parentId)
  let ids: string[] = []
  for (const enfant of enfants) {
      ids.push(enfant.id_categorie.toString())
      ids.push(...getAllChildrenIds(enfant.id_categorie))
  }
  return ids
}


//rendu visuel categories
const renderCategoryTree = (categorie: any, depth: number) => {
  const enfants = categories.filter(c => c.id_parent === categorie.id_categorie)
  const isChecked = categoriesSelectionnees.includes(categorie.id_categorie.toString())
  
  return (
      <Box key={categorie.id_categorie} sx={{ ml: depth * 2, mb: 0.5 }}>
          <FormControlLabel
              control={
                  <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                          let newValues: string[]
                          if (e.target.checked) {
                              // Ajouter la catégorie et toutes ses sous-catégories
                              const allChildren = getAllChildrenIds(categorie.id_categorie)
                              const tempValues = [...categoriesSelectionnees, categorie.id_categorie.toString(), ...allChildren]
                              // Supprimer les doublons
                              newValues = tempValues.filter((v, i, a) => a.indexOf(v) === i)
                          } else {
                              // Retirer la catégorie et toutes ses sous-catégories
                              const allChildren = getAllChildrenIds(categorie.id_categorie)
                              newValues = categoriesSelectionnees.filter(id => 
                                  id !== categorie.id_categorie.toString() && !allChildren.includes(id)
                              )
                          }
                          CategorieChangePourInstrument(newValues)
                          setCategoriesSelectionnees(newValues)
                      }}
                      size="small"
                  />
              }
              label={
                  <Typography variant="body2" sx={{ fontWeight: depth === 0 ? 600 : 400 }}>
                      {depth > 0 && '↳ '}{categorie.nom}
                      {enfants.length > 0 && (
                          <Typography component="span" variant="caption" sx={{ ml: 1, color: '#aaa' }}>
                              ({enfants.length})
                          </Typography>
                      )}
                  </Typography>
              }
          />
          {enfants.map(enfant => renderCategoryTree(enfant, depth + 1))}
      </Box>
  )
}


    const boutonSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (instrumentsSelectionnes.length===0) {
            alert('Veuillez sélectionner au moins un instrument')
            return
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/recherche`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instrumentIds: instrumentsSelectionnes,
                    choixDate: choixDate,
                    dateDebut: jourdeb || heuredeb || semainedeb || moisdeb || anneedeb,
                    dateFin: jourfin || heurefin || semainefin || moisfin || anneefin
                })
            })
            if (response.ok){
            const resultats = await response.json()
            console.log('Résultats de la recherche:', resultats)
            //on va sur la page d'affichage des données
            navigate('/resultatsRecherche', { state: { resultats: resultats } })

            }else {
              alert('Erreur lors de la recherche')
            } 

          } catch (error) {
            console.error('Erreur lors de la recherche:', error)
            alert('Erreur lors de la recherche')
        }
    }

    const listeInstruments = categoriesSelectionnees.length>0 ? instrumentsFiltres : instrumentsDisponibles


//datation
// gérer la sélection des jours
const handleJourChange = (jour : string) => {
  if (joursSemaine.includes(jour)) {
    setJoursSemaine(joursSemaine.filter(j => j !== jour))
} else {
    setJoursSemaine([...joursSemaine, jour])
}
}

// Fonction pour EnvoiPeriodes
const EnvoiPeriodes = () => {
    if (!periodesTemp) {
        setPeriodesTemp(true)
        setDatesPrecises(false) // Désactiver dates précises si période est cochée
    } else {
        setPeriodesTemp(false)
    }
}

// Fonction pour EnvoiDatesPrecises
const EnvoiDatesPrecises = () => {
    if (!datesPrecises) {
        setDatesPrecises(true)
        setPeriodesTemp(false) // Désactiver période si dates précises est cochée
    } else {
        setDatesPrecises(false)
    }
}

//si bouton Tout sélectionner (jours) coché
const handleSelectAll = () => {
  if (joursSemaine.length === 7) {
      // Si tous les jours sont sélectionnés, on désélectionne tout
      setJoursSemaine([])
  } else {
      // Sinon, on sélectionne tous les jours
      setJoursSemaine(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']);
  }
}

//verification si tous les jours sont cochés quand Tout sélectionner
const isAllSelected = joursSemaine.length === 7;


// Fonction pour ajouter une période
const ajouterPeriode = (type: string) => {
    const nouvellePeriode = {
        id: `${Date.now()}-${Math.random()}`,
        type: type,
        valeur: ''
    };
    setPeriodesAjoutees([...periodesAjoutees, nouvellePeriode]);
};

// Fonction pour supprimer une période
const supprimerPeriode = (id: string) => {
    setPeriodesAjoutees(periodesAjoutees.filter(periode => periode.id !== id));
};

// Fonction pour mettre à jour la valeur d'une période
const updatePeriodeValeur = (id: string, valeur: string) => {
    setPeriodesAjoutees(periodesAjoutees.map(periode => 
        periode.id === id ? {...periode, valeur: valeur} : periode
    ));
};

// Rendu conditionnel pour chaque type de période
const renderPeriodeInput = (periode: {id: string, type: string, valeur: string}) => {
    switch(periode.type) {
        case 'Heure':
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <input 
                        type="time" 
                        
                        value={periode.valeur.split('-')[0] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${e.target.value}-${periode.valeur.split('-')[1] || ''}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Heure début"
                    /> 
                    <input 
                        type="time" 
                        
                        value={periode.valeur.split('-')[1] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${periode.valeur.split('-')[0] || ''}-${e.target.value}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Heure fin"
                    />
                </Stack>
            );
        case 'Jour':
            // Récupérer les jours actuels depuis periode.valeur
            const joursActuels = periode.valeur ? periode.valeur.split(',').filter(j => j !== '') : []
            const tousJoursSelectionnes = joursActuels.length === 7
            // Fonction pour sélectionner tous les jours
            const selectTousJours = () => {
              if (tousJoursSelectionnes) {
                updatePeriodeValeur(periode.id, '')
            } else {
                const tousLesJours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
                updatePeriodeValeur(periode.id, tousLesJours.join(','))
            }
        }
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel control={
                    <Checkbox checked={tousJoursSelectionnes} onChange={selectTousJours}/>}
                    label={
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                        Tout sélectionner
                      </Typography>
                      }
                      />
                    <FormGroup row>
                        {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(jour => (
                            <FormControlLabel
                                key={jour}
                                control={
                                    <Checkbox
                                        checked={periode.valeur.split(',').includes(jour)}
                                        onChange={(e) => {
                                            const joursActuels = periode.valeur ? periode.valeur.split(',') : [];
                                            let nouveauxJours;
                                            if (e.target.checked) {
                                                nouveauxJours = [...joursActuels, jour];
                                            } else {
                                                nouveauxJours = joursActuels.filter(j => j !== jour);
                                            }
                                            updatePeriodeValeur(periode.id, nouveauxJours.join(','));
                                        }}
                                        size="small"
                                    />
                                }
                                label={jour.charAt(0).toUpperCase() + jour.slice(1)}
                            />
                        ))}
                    </FormGroup>
                </Stack>
            );
        case 'Semaine':
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <input 
                        type="week" 
                        value={periode.valeur.split('-')[0] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${e.target.value}-${periode.valeur.split('-')[1] || ''}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Semaine début"
                    />
                    <input 
                        type="week" 
                        value={periode.valeur.split('-')[1] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${periode.valeur.split('-')[0] || ''}-${e.target.value}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Semaine fin"
                    />
                </Stack>
            );
        case 'Mois':
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <input 
                        type="month" 
                        value={periode.valeur.split('-')[0] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${e.target.value}-${periode.valeur.split('-')[1] || ''}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Mois début"
                    />
                    <input 
                        type="month" 
                        value={periode.valeur.split('-')[1] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${periode.valeur.split('-')[0] || ''}-${e.target.value}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Mois fin"
                    />
                </Stack>
            );
        case 'Année':
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <input 
                        type="number" 
                        value={periode.valeur.split('-')[0] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${e.target.value}-${periode.valeur.split('-')[1] || ''}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Année début"
                        min="1900"
                        max="2100"
                    />
                    <input 
                        type="number" 
                        value={periode.valeur.split('-')[1] || ''} 
                        onChange={(e) => updatePeriodeValeur(periode.id, `${periode.valeur.split('-')[0] || ''}-${e.target.value}`)} 
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                        placeholder="Année fin"
                        min="1900"
                        max="2100"
                    />
                </Stack>
            );
        default:
            return null;
    }
};

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
                <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>FORMULAIRE DE RECHERCHE</b></center>
                <br></br>
                </Typography>
                    <form onSubmit={boutonSubmit}>
                        <Stack spacing={3}>

                            {chargement ? (
                                <CircularProgress />
                            ) : categories.length === 0 ? (
                              <Typography color="error">Erreur de chargement des catégories</Typography>
                            ) : (
                              <>
                              {/* Filtre par catégorie */}
                              <Box sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: -1.5 }}>
                                      <Typography variant="subtitle1" sx={{ color: '#666', mb: 1, display: 'block' }}>
                                          Filtrer par catégorie
                                      </Typography>
                                      <FormControlLabel
                                          control={
                                              <Switch
                                                  checked={filtreActif}
                                                  onChange={(e) => {
                                                      setFiltreActif(e.target.checked)
                                                      if (e.target.checked && categoriesSelectionnees.length > 0) {
                                                          CategorieChangePourInstrument(categoriesSelectionnees)
                                                      } else {
                                                          setInstrumentsFiltres(instrumentsDisponibles)
                                                      }
                                                  }}
                                                  color="primary"
                                                  sx={{
                                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                                          color: '#0370B2',
                                                      },
                                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                          backgroundColor: '#0370B2',
                                                      },
                                                  }}
                                              />
                                          }
                                          label={filtreActif ? "Actif" : "Inactif"}
                                          labelPlacement="start"
                                          sx={{ 
                                              '& .MuiFormControlLabel-label': { 
                                                  fontSize: '0.875rem',
                                                  color: filtreActif ? '#0370B2' : '#666'
                                              }
                                          }}
                                      />
                                  </Box>

                                        {filtreActif && (
                                            <>
                                                <Divider sx={{ my: 1 }} />
                                                <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
                                                    Sélectionnez les catégories souhaitées :
                                                </Typography>
                                                <Box sx={{ 
                                                    maxHeight: 250, 
                                                    overflow: 'auto', 
                                                    border: '1px solid #e0e0e0', 
                                                    borderRadius: 1, 
                                                    p: 1.5,
                                                    bgcolor: '#fafafa'
                                                }}>
                                                    {categories
                                                        .filter(cat => !cat.id_parent)
                                                        .map((rootCat) => renderCategoryTree(rootCat, 0))}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                    
                                    {listeInstruments.length === 0 ? (
                                      messageErreur ? (
                                        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                            {messageErreur}
                                        </Typography>
                                    ) : categoriesSelectionnees.length === 0 ? (
                                        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                            Aucun instrument trouvé
                                        </Typography>
                                    ) : null
                                    
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
                                        checked={selectTout}
                                        onChange={CocheTTselectionner}
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
                                
                                  )}
                              </>
                            )}
                            
                            
                            


                            {/* Méthode de datation */}
                            <Box key="date-box" sx={{ mb: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                                <InputLabel>Veuillez choisir une méthode de datation :</InputLabel>
                                
                                <FormControlLabel
                                    control={
                                    <Checkbox 
                                        checked={datesPrecises}
                                        onChange={EnvoiDatesPrecises}
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
                                      Je recherche des données sur des dates précises
                                    </Typography>
                                    }
                                    />
                                    <FormControlLabel
                                    control={ 
                                      <Checkbox
                                        checked={periodesTemp}
                                        onChange={EnvoiPeriodes}
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
                                      Je recherche des données sur des périodes générales
                                    </Typography>
                                    }
                                  />
                
                                

                                 {/* choix des jours de la semaine pour les périodes */}
                                  {periodesTemp && (
                                    <>
                                      <Divider sx={{ my: 2 }} />

                            <InputLabel>Ajouter les informations utiles à la période que vous recherchez :</InputLabel>
                                          {/* Boutons pour ajouter des périodes */}
                                          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>

                              <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => ajouterPeriode('Jour')}
                                  sx={{
                                      bgcolor: '#0370B2',
                                      '&:hover': { bgcolor: '#00517C' },
                                      fontSize: '0.75rem',
                                      py: 0.5
                                  }}
                              >
                                  Jour
                              </Button>

                              <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => ajouterPeriode('Heure')}
                                  sx={{
                                      bgcolor: '#0370B2',
                                      '&:hover': { bgcolor: '#00517C' },
                                      fontSize: '0.75rem',
                                      py: 0.5
                                  }}
                              >
                                  Heure
                              </Button>

                              <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => ajouterPeriode('Semaine')}
                                  sx={{
                                      bgcolor: '#0370B2',
                                      '&:hover': { bgcolor: '#00517C' },
                                      fontSize: '0.75rem',
                                      py: 0.5
                                  }}
                              >
                                  Semaine
                              </Button>
                              <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => ajouterPeriode('Mois')}
                                  sx={{
                                      bgcolor: '#0370B2',
                                      '&:hover': { bgcolor: '#00517C' },
                                      fontSize: '0.75rem',
                                      py: 0.5
                                  }}
                              >
                                  Mois
                              </Button>
                              <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => ajouterPeriode('Année')}
                                  sx={{
                                      bgcolor: '#0370B2',
                                      '&:hover': { bgcolor: '#00517C' },
                                      fontSize: '0.75rem',
                                      py: 0.5
                                  }}
                              >
                                  Année
                              </Button>
                          </Stack>

                          {/* Liste des périodes ajoutées */}
                          {periodesAjoutees.length > 0 && (
                              <Stack spacing={2}>
                                  <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                      Périodes sélectionnées :
                                  </Typography>
                                  {periodesAjoutees.map((periode) => (
                                      <Paper key={periode.id} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                          <Stack spacing={2}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <Typography variant="subtitle2" sx={{ color: '#0370B2' }}>
                                                      {periode.type}
                                                  </Typography>
                                                  <Button
                                                      size="small"
                                                      color="error"
                                                      startIcon={<DeleteIcon />}
                                                      onClick={() => supprimerPeriode(periode.id)}
                                                  >
                                                      Supprimer
                                                  </Button>
                                              </Box>
                                              {renderPeriodeInput(periode)}
                                          </Stack>
                                      </Paper>
                                  ))}
                              </Stack>
                          )}
                      </>
                  )}
                  </Box>

                               
                                {datesPrecises && (
                                  <>
                                <FormControl component="fieldset">
                                    <RadioGroup row value={choixDate} onChange={(e) => setChoixDate(e.target.value)}>
                                        <FormControlLabel value="Heure" control={<Radio />} label="Heure" />
                                        <FormControlLabel value="Jour" control={<Radio />} label="Jour" />
                                        <FormControlLabel value="Semaine" control={<Radio />} label="Semaine" />
                                        <FormControlLabel value="Mois" control={<Radio />} label="Mois" />
                                        <FormControlLabel value="Année" control={<Radio />} label="Année" />
                                    </RadioGroup>
                                </FormControl>
                            

                            {/* Heure */}
                            {choixDate === 'Heure' && (
                                <Stack direction="row" spacing={2}>
                                    <input type="time" value={heuredeb} onChange={(e) => setHeureDeb(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}>From : </input>
                                    <input type="time" value={heurefin} onChange={(e) => setHeureFin(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} >To : </input>
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
                                </>
                                )}
                                        <Stack direction="row" spacing={2} justifyContent="center">

        
                            <Button
                              type="submit"
                              variant="contained"
                              startIcon={<SearchIcon />}
                              sx={{
                                  bgcolor: '#0370B2',
                                  '&:hover': { bgcolor: '#00517C' },
                                  //fontSize: '0.75rem',
                                  //py: 0.5
                              }}
                              >
                              Rechercher
                            </Button>   
                          </Stack>
                        </Stack>
                    </form>
                </Paper>
            </Container>
            
        </Box>
    )
}

export default Recherche