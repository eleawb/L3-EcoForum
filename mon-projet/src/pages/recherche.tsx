import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon } from '@mui/icons-material'

import {
  Radio,
  Autocomplete,
  TextField,
  Select,
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

    const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]) 
    const [instrumentsFiltres, setInstrumentsFiltres] = useState<any[]>([])

    // Méthode de datation
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
          } else {
              setInstrumentsFiltres([])
          }
      } catch (error) {
          console.error('Erreur:', error)
          setInstrumentsFiltres([])
      }
  }
    

 // Gestion de la sélection d'un instrument
 const InstrumentSelection = (valeurInstrument: string) => {
  setInstrumentsSelectionnes(prev => {
    let nvSelection:string[]
      if (prev.includes(valeurInstrument)) {
          nvSelection = prev.filter(v => v !== valeurInstrument)
      } else {
          nvSelection= [...prev, valeurInstrument]
      }
     
    // verif si tous les instruments sont sélectionnés
    const ToutesLesValeurs = listeInstruments.map(item => item.nom_outil || item.modele)
    const estTTselectionne = ToutesLesValeurs.length === nvSelection.length && ToutesLesValeurs.length>0 && ToutesLesValeurs.every(v=>nvSelection.includes(v))
  
    setSelectTout(estTTselectionne)
    return nvSelection
  })

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
                    instrument: instrumentsSelectionnes,
                    choixDate: choixDate,
                    dateDebut: jourdeb || heuredeb || semainedeb || moisdeb || anneedeb,
                    dateFin: jourfin || heurefin || semainefin || moisfin || anneefin
                })
            })
            const resultats = await response.json()
            console.log('Résultats de la recherche:', resultats)
        } catch (error) {
            console.error('Erreur lors de la recherche:', error)
            alert('Erreur lors de la recherche')
        }
    }

    const listeInstruments = categoriesSelectionnees.length>0 ? instrumentsFiltres : instrumentsDisponibles

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

                    <form onSubmit={boutonSubmit}>
                        <Stack spacing={3}>

                            {chargement ? (
                                <CircularProgress />
                            ) : categories.length === 0 ? (
                              <Typography color="error">Erreur de chargement des catégories</Typography>
                            ) : (
                              <>
                                    {/* Filtre par catégorie avec arborescence et checkboxes */}
                                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                                        <FormLabel component="legend">Filtrer par catégorie</FormLabel>
                                        <Box sx={{ 
                                            maxHeight: 300, 
                                            overflow: 'auto', 
                                            border: '1px solid #ccc', 
                                            borderRadius: 1, 
                                            p: 1,
                                            bgcolor: '#fafafa'
                                        }}>
                                            {categories
                                                .filter(cat => !cat.id_parent) // Catégories racines
                                                .map((rootCat) => renderCategoryTree(rootCat, 0))}
                                        </Box>
                                    </FormControl>

                                    {listeInstruments.length === 0 ? (
                                      categoriesSelectionnees.length === 0 ? (
                                        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                        Aucun instrument trouvé
                                        </Typography>
                                      ) : (
                                        (() => {
                                            // Convertir les IDs en noms pour l'affichage
                                            const nomsCategories = categoriesSelectionnees.map(id => {
                                                const cat = categories.find(c => c.id_categorie === id)
                                                return cat?.nom
                                            }).filter(Boolean)
                                            
                                            return nomsCategories.length > 1 ? (
                                                <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                                    Aucun instrument ne correspond aux catégories "{nomsCategories.join(', ')}"
                                                </Typography>
                                            ) : (
                                                <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
                                                    Aucun instrument ne correspond à la catégorie "{nomsCategories[0]}"
                                                </Typography>
                                            )
                                        })()
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
                                                            checked={instrumentsSelectionnes.includes(item.nom_outil || item.modele)}
                                                            onChange={() => InstrumentSelection(item.nom_outil || item.modele)}
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
    )
}

export default Recherche