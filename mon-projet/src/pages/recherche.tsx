import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon  } from '@mui/icons-material' //icônes prévues sur MaterialUI pour être user friendly
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs' //npm install @mui/x-date-pickers dayjs
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker' //visuel mui du choix de date
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker' //visuel mui du choix de l'heure 
import "react-time-picker-typescript/dist/style.css" //style choix heure
import dayjs, { Dayjs } from 'dayjs' //pr gérer la date (dayjs().add(1, 'year') par ex)
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

    const [instrumentsDisponibles, setInstrumentsDisponibles] = useState<any[]>([]) //instruments disponibles selon la catégorie / bdd en général
    const [chargement, setChargement] = useState(true) //boucle de chargement si la récupération initiale des instruments de la bdd est trop long ou pb infini
    const [categories, setCategories] = useState<any[]>([]) //récupérer les catégories de la bdd
    
    //choix instruments
    const [instrumentsSelectionnes, setInstrumentsSelectionnes] = useState<string[]>([]) //récupérer les instruments sélectionnés par l'user
    const [selectTout, setSelectTout] = useState(false) //booléen pour savoir quand le bouton "tt sélectionner" pour les instruments est coché

    //filtre catégorie
    const [filtreActif, setFiltreActif] = useState(false) //faire apparaitre ou pas le filtre catégorie
    const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>([]) //récupérer la ou les catégories sélectionnées par l'user
    const [instrumentsFiltres, setInstrumentsFiltres] = useState<any[]>([]) //récupérer les instruments filtrés
    const [messageErreur, setMessageErreur] = useState('') 

    // méthodes de datation
    //si choix dates précises
    const [datesPrecises, setDatesPrecises] = useState(false)
    const [datesPrecisesAjoutees, setDatesPrecisesAjoutees] = useState<Array<{id: string, type: string, valeur: string, plagesHoraires?: Array<{debut: string, fin: string}>}>>([]) //+plages horaire incluses
    const [heuresPrecisesPlages, setHeuresPrecisesPlages] = useState<Array<{id: string, debut: string, fin: string}>>([])
    const [jourDejaAjoute, setJourDejaAjoute] = useState(false) //on ne peut cliquer qu'une fois sur "jour(s)" car pas une plage journalière
   

    //si choix périodes temporelles
    const [periodesTemp, setPeriodesTemp] = useState(false) 
      const [joursSemaine, setJoursSemaine] = useState<string[]>([]) // alors, états pour les jours de la semaine
      const [periodesAjoutees, setPeriodesAjoutees] = useState<Array<{id: string, type: string, valeur: string}>>([]) //états pour gérer les sélections d'heure, jour, mois ou semaine
      const [heuresPlages, setHeuresPlages] = useState<Array<{id: string, debut: string, fin: string}>>([]) // etat pour stock les différentes plages horaires choisies
    const [heureDejaAjoutee, setHeureDejaAjoutee] = useState(false)
    const [moisDejaAjoute, setMoisDejaAjoute] = useState(false)
    const [anneeDejaAjoutee, setAnneeDejaAjoutee] = useState(false)


      // années sélectionnées
  const [anneesSelectionnees, setAnneesSelectionnees] = useState<string[]>([])
  // liste des années disponibles 
  const [anneesDisponibles, setAnneesDisponibles] = useState<string[]>([])

      
    const [choixDateD, setChoixDate] = useState('')
    const [jourdeb, setJourDeb] = useState('')
    const [jourfin, setJourFin] = useState('')
    const [heuredeb, setHeureDeb] = useState('')
    const [heurefin, setHeureFin] = useState('')
   
    const [moisdeb, setMoisDeb] = useState('')
    const [moisfin, setMoisFin] = useState('')
    const [anneedeb, setAnneeDeb] = useState('')
    const [anneefin, setAnneeFin] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await fetch('http://localhost:3000/api/instruments') //récupérer les instruments de la bdd
                const instrumentsData = await instrumentsRes.json() //conversion 
                setInstrumentsDisponibles(instrumentsData || []) //si pas de données, on laisse vide
                
                const categoriesRes = await fetch('http://localhost:3000/api/categories') //récupérer les catégories de la bdd
                const categoriesData = await categoriesRes.json() //conversion
                console.log("Catégories reçues du backend:", categoriesData) //debug
                setCategories([...categoriesData]) //

                console.log("Catégories chargées") //debug
                
                setChargement(false) //plus de boucle chargement
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
                setChargement(false)
            }
        }
        fetchData()
    }, [])


    //recup les ss catégories d'une catégorie
    const getToutesSScat = (categorieNom: string): string[] => {
      if (!categorieNom|| categorieNom === 'null' || categorieNom === 'undefined') return [] //si pas réussi à récupérer les noms des catégories
      const result: string[] = [categorieNom]
      const categorie = categories.find(c => c.nom === categorieNom)
      if (!categorie) return result
      
      const enfants = categories.filter(c => c.id_parent === categorie.id_categorie) //classer catégories parents et enfants
      for (const enfant of enfants) {
        if (enfant && enfant.nom && enfant.nom!=='null') {
          result.push(...getToutesSScat(enfant.nom))
      }
    }
      return result.filter(c => c && c.trim() !== '') //pour pas reucp les erreurs
  }

    // changement de catégorie pour les instruments
    const CategorieChangePourInstrument = async (values: string[]) => {
      console.log("ids des catégories sélectionnées:", values) //debug
      
      setCategoriesSelectionnees(values)
      setInstrumentsSelectionnes([]) //pas encore sélectionné les instruments
      setSelectTout(false) //pas encore coché "tout sélectionner"
  
      if (values.length === 0) { 
          setInstrumentsFiltres(instrumentsDisponibles)
          setMessageErreur('')

          return
      }

      // Convertir en nbs pour l'API
      const idsNumbers = values.map(v => parseInt(v, 10))
      
      // Récupérer les noms des catégories pour l'API
      const nomsCategories = idsNumbers.map(id => {
          const cat = categories.find(c => c.id_categorie === id)
          return cat?.nom //cat? = si cat null ou undefined, retourne undefined et pas erreur
      }).filter(Boolean)

      console.log("noms des catégories envoyés à l'API:", nomsCategories) //debug

      
      try {
          const response = await fetch('http://localhost:3000/api/instruments/by-categories', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ categories: nomsCategories })
          })
          
          if (response.ok) { //on a bien récupéré qq chose
              const data = await response.json()
              setInstrumentsFiltres(data)
              //tester quand même si rien trouvé :
              if (data.length === 0) {
                // Construire le message d'erreur avec les noms des catégories
                const message = nomsCategories.length > 1 
                    ? `Aucun instrument ne correspond aux catégories "${nomsCategories.join(', ')}"`
                    : `Aucun instrument ne correspond à la catégorie "${nomsCategories[0]}"`
                setMessageErreur(message)
            } else {
                setMessageErreur('')
            }
          } else { //si pb à la récupération
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
  setSelectTout(false) //"tout sélectionner" pas coché
}

  

// afficher les catégories avec indentation visuelle selon le niveau de profondeur (parents/enfants)
const affichageCategoriesNiveaux = (categorie: any, profondeur: number) => {
  if (!categorie || !categorie.id_categorie || !categorie.nom) return null //si pb récupération catégorie
  
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
    const ttesValeurs = listeInstruments.map(item => item.id_instrument.toString())
    setInstrumentsSelectionnes(ttesValeurs)
    setSelectTout(true)
    console.log("tous les instruments sont sélectionnés")
      
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

        //DATATION PRÉCISE
        //choix des dates
        let dateDebutQuery = null
        let dateFinQuery = null
        //stocker ttes les plages horaires 
        let heuresQuery = []

        //PÉRIODES TEMPORELLES
        let periodesData = {
            joursSemaine: [] as string[],
            mois: [] as string[],
            heures: [] as Array<{debut: string, fin: string}>,
            annees: [] as string[]
        }

        //gestion périodes temporelles
        if (periodesTemp && periodesAjoutees.length > 0) {
            for (const periode of periodesAjoutees) {
                switch (periode.type) {
                    case 'Jour(s)':
                        if (periode.valeur) {
                            periodesData.joursSemaine = periode.valeur.split(',')
                        }
                        break
                    case 'Mois':
                        if (periode.valeur) {
                            periodesData.mois = periode.valeur.split(',')
                        }
                        break
                    case 'Heure(s)':
                        if (periode.valeur) {
                            const [debut, fin] = periode.valeur.split('-')
                            if (debut && fin) {
                                periodesData.heures.push({ debut, fin })
                            }
                        }
                        break
                    case 'Année(s)':
                        periodesData.annees = anneesSelectionnees
                        break
                }
            }
            
            //heures supplémentaires
            if (heuresPlages.length > 0) {
                periodesData.heures.push(...heuresPlages.filter(h => h.debut && h.fin))
            }
        }

        //gestion dates précises
        if (datesPrecises && datesPrecisesAjoutees.length > 0) {
            const dateJour = datesPrecisesAjoutees.find(d => d.type === 'Jour(s)') //on prend la 1ère date précise
            const dateHeure = datesPrecisesAjoutees.find(d => d.type === 'Heure(s)') //on prend la 1ère date précise

            //gestion des dates
            if (dateJour && dateJour.valeur) {
                const [debut, fin] = dateJour.valeur.split('|');
                
                if (debut && fin) {
                    //verifier le format 
                    if (debut.includes('-')) {
                    //convertir du format DD-MM-YYYY vers YYYY-MM-DD pour PostgreSQL
                        const [debutJour, debutMois, debutAnnee] = debut.split('-')
                        const [finJour, finMois, finAnnee] = fin.split('-')
                        dateDebutQuery = `${debutAnnee}-${debutMois}-${debutJour}`
                        dateFinQuery = `${finAnnee}-${finMois}-${finJour}`
                    } else { // si déjà au bon format
                        dateDebutQuery = debut
                        dateFinQuery = fin
                    }
                    
                    //si date début = date fin, on envoie la même date pour les deux
                    if (debut === fin) {
                        console.log("Date unique recherchée:", dateDebutQuery);
                    } else {
                        console.log("Période recherchée:", dateDebutQuery, "à", dateFinQuery);
                    }
                }
            }
            //gestion des heures
            if (dateHeure) {
                //heure principale
                if (dateHeure.valeur) {
                    const [debut, fin] = dateHeure.valeur.split('-');
                    if (debut && fin) {
                        heuresQuery.push({ debut, fin });
                    }
                }
                //heures supplémentaires
                if (dateHeure.plagesHoraires && dateHeure.plagesHoraires.length > 0) {
                    heuresQuery.push(...dateHeure.plagesHoraires.filter(h => h.debut && h.fin));
                }
            }
    }
    
        
        try {
            const response = await fetch(`http://localhost:3000/api/recherche`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instrumentIds: instrumentsSelectionnes,
                    //dates précises
                    dateDebut: dateDebutQuery, //mtn au format YYYY-MM-DD
                    dateFin: dateFinQuery,
                    heuresPrecisesPlages: heuresQuery,
                    //périodes
                    periodes : periodesData,
                    //datesPrecises : datesPrecisesAjoutees 
                  })
                
            })

            if (response.ok){
            const data = await response.json()
            console.log('Résultats de la recherche:', data)
            //on va sur la page d'affichage des données
            navigate('/resultatsRecherche', { state: { previewResultats: data.previewResultats,
                resultats: data.resultats, entetes : data.entetes} }) //preview de 20 résultats mais téléchargement de tous

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

//CAS PÉRIODE
// Fonction pour ajouter une période
const ajouterPeriode = (type: string) => {
    if (type === 'Jour(s)' && jourDejaAjoute) {
        return // ne rien faire si le jour est déjà ajouté
    }
    if (type === 'Mois' && moisDejaAjoute){
        return
    }
    if (type === 'Heure(s)' && heureDejaAjoutee){
        return
    }
    if (type === 'Année(s)' && anneeDejaAjoutee){
        return
    }
    
    const nouvellePeriode = {
        id: `${Date.now()}-${Math.random()}`,
        type: type,
        valeur: ''
    }
    setPeriodesAjoutees([...periodesAjoutees, nouvellePeriode])
    
    if (type === 'Jour(s)') {
        setJourDejaAjoute(true)
    }
    if (type === 'Heure(s)'){
        setHeureDejaAjoutee(true)
    }
    if (type === 'Mois'){
        setMoisDejaAjoute(true)
    }
    if (type === 'Année(s)'){
        setAnneeDejaAjoutee(true)
    }
}

// Fonction pour supprimer une période
const supprimerPeriode = (id: string) => {
    const PeriodesASupprimer = periodesAjoutees.find(periode => periode.id === id)
    setPeriodesAjoutees(periodesAjoutees.filter(periode => periode.id !== id))

    if (PeriodesASupprimer?.type === 'Jour(s)') {
        setJourDejaAjoute(false)
    }
    if (PeriodesASupprimer?.type === 'Heure(s)') {
        setAnneeDejaAjoutee(false)
    }
    if (PeriodesASupprimer?.type === 'Mois') {
        setMoisDejaAjoute(false)
    }
    if (PeriodesASupprimer?.type === 'Année(s)') {
        setAnneeDejaAjoutee(false)
    }

};

// Fonction pour mettre à jour la valeur d'une période
const updatePeriodeValeur = (id: string, valeur: string) => {
    setPeriodesAjoutees(periodesAjoutees.map(periode => 
        periode.id === id ? {...periode, valeur: valeur} : periode
    ))
}

//ajouter de nouvelles heures dans la box Heure
const ajouterNvHeure = () => {
  const nouvelleHeure = {
  id: `${Date.now()}-${Math.random()}`,
        debut: '',
        fin: ''
    };
    setHeuresPlages([...heuresPlages, nouvelleHeure])
}

// Fonction pour supprimer une plage horaire
const supprimerHeure = (id: string) => {
  setHeuresPlages(heuresPlages.filter(heure => heure.id !== id))
}

// Fonction pour mettre à jour une plage horaire
const updateHeure = (id: string, champ: 'debut' | 'fin', valeur: string) => {
  setHeuresPlages(heuresPlages.map(heure =>
      heure.id === id ? { ...heure, [champ]: valeur } : heure
  ))
}

// Générer la liste des années de 2020 à année actuelle
useEffect(() => {
  const anneeActuelle = new Date().getFullYear()
  const annees = []
  for (let i = 2020; i <= anneeActuelle; i++) {
      annees.push(i.toString())
  }
  setAnneesDisponibles(annees)
}, [])

// Gestion de la sélection des années
const handleAnneeChange = (annee: string) => {
  setAnneesSelectionnees(prev => {
      if (prev.includes(annee)) {
          return prev.filter(a => a !== annee)
      } else {
          return [...prev, annee]
      }
  })
}

// tt sélectionner pour les années
const selectToutAnnees = () => {
  if (anneesSelectionnees.length === anneesDisponibles.length) {
      setAnneesSelectionnees([])
  } else {
      setAnneesSelectionnees([...anneesDisponibles])
  }
}

// Rendu conditionnel pour chaque type de période
const renderPeriodeInput = (periode: {id: string, type: string, valeur: string}) => {
    switch(periode.type) {
        case 'Heure(s)':
            return (
              
              <Box>
              
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}></Typography>
                            <DesktopTimePicker
                                label="Heure de début"
                                value={(() => {
                                    if (!periode.valeur || periode.valeur === '') return null
                                    const debut = periode.valeur.split('-')[0] //on récupère la 1ère heure
                                    if (!debut || debut === '') return null //vérification heure début
                                    const heureConv = dayjs(debut, 'HH:mm')
                                    return heureConv.isValid() ? heureConv : null
                                })()}
                                onChange={(newValue) => {
                                    if (newValue && newValue.isValid()) {
                                        const fin = periode.valeur.split('-')[1] || '' //split les 2 heures pr récupérer l'heure de fin et si pas d'heure de fin, ''
                                        const nouvelleValeur = `${newValue.format('HH:mm')}${fin ? `-${fin}` : ''}`
                                        updatePeriodeValeur(periode.id, nouvelleValeur)
                                    }
                                }}

                                format="HH:mm"
                                ampm={false}  // pour utiliser le format 24h
                            />
                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}></Typography>
                            <DesktopTimePicker
                                label="Heure de fin"
                                value={(() => {
                                    if (!periode.valeur) return null
                                    const fin = periode.valeur.split('-')[1]
                                    if (!fin || fin === '') return null
                                    const parsedHeure = dayjs(fin, 'HH:mm')
                                    return parsedHeure.isValid() ? parsedHeure : null
                                })()}
                                onChange={(newValue) => {
                                    if (newValue && newValue.isValid()) {
                                        const debut = periode.valeur.split('-')[0] || ''
                                        const nouvelleValeur = `${debut}${debut ? '-' : ''}${newValue.format('HH:mm')}`
                                        updatePeriodeValeur(periode.id, nouvelleValeur)
                                    }
                                }}

                                format="HH:mm"
                                ampm={false}
                            />
                        </Stack>
                        </LocalizationProvider>
              
              {/* Plages horaires multiples */}
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 2, mb: 1 }}>
                  Plages horaires supplémentaires :
              </Typography>
              
              {heuresPlages.map((heure) => (
                  <Stack key={heure.id} direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                      <input 
                          type="time" 
                          value={heure.debut} 
                          onChange={(e) => updateHeure(heure.id, 'debut', e.target.value)} 
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                          placeholder="Heure début"
                      />
                      <input 
                          type="time" 
                          value={heure.fin} 
                          onChange={(e) => updateHeure(heure.id, 'fin', e.target.value)} 
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                          placeholder="Heure fin"
                      />
                      <Button
                          size="small"
                          color="error"
                          onClick={() => supprimerHeure(heure.id)}
                          sx={{ minWidth: 'auto' }}
                      >
                          <DeleteIcon fontSize="small" />
                      </Button>
                  </Stack>
              ))}
              
              <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={ajouterNvHeure}
                  sx={{ mt: 1, fontSize: '0.7rem' }}
              >
                  Ajouter une plage horaire
              </Button>
          </Box>
      )
        case 'Jour(s)':
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
            )
        
        case 'Mois':
            // Récupérer les mois actuels depuis periode.valeur
            const moisActuels = periode.valeur ? periode.valeur.split(',').filter(j => j !== '') : []
            const tousMoisSelectionnes = moisActuels.length === 12
            // Fonction pour sélectionner tous les mois
            const selectTousMois = () => {
              if (tousMoisSelectionnes) {
                updatePeriodeValeur(periode.id, '')
            } else {
                const tousLesMois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
                updatePeriodeValeur(periode.id, tousLesMois.join(','))
            }
        }
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControlLabel control={
                    <Checkbox checked={tousMoisSelectionnes} onChange={selectTousMois}/>}
                    label={
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                        Tout sélectionner
                      </Typography>
                      }
                      />
                    <FormGroup row>
                        {['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'].map(mois => (
                            <FormControlLabel
                                key={mois}
                                control={
                                    <Checkbox
                                        checked={periode.valeur.split(',').includes(mois)}
                                        onChange={(e) => {
                                            const moisActuels = periode.valeur ? periode.valeur.split(',') : [];
                                            let nouveauxMois;
                                            if (e.target.checked) {
                                              nouveauxMois = [...moisActuels, mois];
                                            } else {
                                                nouveauxMois = moisActuels.filter(j => j !== mois);
                                            }
                                            updatePeriodeValeur(periode.id, nouveauxMois.join(','));
                                        }}
                                        size="small"
                                    />
                                }
                                label={mois.charAt(0).toUpperCase() + mois.slice(1)}
                            />
                        ))}
                    </FormGroup>
                </Stack>
            )
        case 'Année(s)':
          const toutesAnneesSelectionnees = anneesSelectionnees.length === anneesDisponibles.length && anneesDisponibles.length > 0 
          return (
          <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FormControlLabel
                  control={
                      <Checkbox
                          checked={toutesAnneesSelectionnees}
                          onChange={selectToutAnnees}
                          size="small"
                      />
                  }
                  label={
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                          Tout sélectionner
                      </Typography>
                  }
              />
              <Typography variant="caption" sx={{ color: '#666' }}>
                  ({anneesDisponibles.length} années disponibles)
              </Typography>
          </Stack>
          
          <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              maxHeight: 150,
              overflow: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 1
          }}>
              {anneesDisponibles.map((annee) => (
                  <FormControlLabel
                      key={annee}
                      control={
                          <Checkbox
                              checked={anneesSelectionnees.includes(annee)}
                              onChange={() => handleAnneeChange(annee)}
                              size="small"
                          />
                      }
                      label={annee}
                      sx={{ width: 'calc(25% - 8px)', m: 0 }}
                  />
              ))}
          </Box>
          

      </Box>
           
          )
          default : 
          return null
                    }
                }

    //CAS DATES PRÉCISES
    // ajouter une date précise (jour et/ou heure)
    const ajouterDatePrecise = (type: string) => {
        if (type === 'Jour(s)' && jourDejaAjoute) {
            return //ne rien faire si le jour est déjà ajouté
        }
        
        const nouvelleDate = {
            id: `${Date.now()}-${Math.random()}`,
            type: type,
            valeur: '',
            plagesHoraires: type==='Heure(s)' ? [] : undefined 
        }
        setDatesPrecisesAjoutees([...datesPrecisesAjoutees, nouvelleDate])
        if (type === 'Jour(s)') {
            setJourDejaAjoute(true)
        }
    }

    // Supprimer une date précise
    const supprimerDatePrecise = (id: string) => {
        const dateASupprimer = datesPrecisesAjoutees.find(date => date.id === id)
        setDatesPrecisesAjoutees(datesPrecisesAjoutees.filter(date => date.id !== id))
        if (dateASupprimer?.type === 'Jour(s)') {
            setJourDejaAjoute(false)
        }
    }

    // Mettre à jour la valeur d'une date précise
    const updateDatePrecise = (id: string, valeur: string, plagesHoraires?: Array<{debut: string, fin: string}>) => {
        setDatesPrecisesAjoutees(prev => 
            prev.map(date =>
                date.id === id ? { ...date, valeur: valeur, plagesHoraires : plagesHoraires||date.plagesHoraires } : date
            
        ))
        console.log("datesPrecisesAjoutees :", datesPrecisesAjoutees)
    }

    // Ajouter une plage horaire pour dates précises
    const ajouterNvHeurePrecise = (dateID : string) => {
        setDatesPrecisesAjoutees(prev => 
            prev.map(date => {
                if (date.id === dateID && date.type === 'Heure(s)') {
                    const nouvellesPlages = [...(date.plagesHoraires || []), { debut: '', fin: '' }];
                    return { ...date, plagesHoraires: nouvellesPlages };
                }
                return date;
            })
        )
    }

    // Supprimer une plage horaire pour dates précises
    const supprimerHeurePrecise = (dateId: string, heureId: number) => {
        setDatesPrecisesAjoutees(prev => 
            prev.map(date => {
                if (date.id === dateId && date.type === 'Heure(s)') {
                    const nouvellesPlages = (date.plagesHoraires || []).filter((_, index) => index !== heureId);
                    return { ...date, plagesHoraires: nouvellesPlages };
                }
                return date;
            })
        )
    }

    // Mettre à jour une plage horaire pour dates précises
    const updateHeurePrecise = (dateId: string, heureIndex: number, champ: 'debut' | 'fin', valeur: string) => {
        setDatesPrecisesAjoutees(prev => 
            prev.map(date => {
                if (date.id === dateId && date.type === 'Heure(s)') {
                    const nouvellesPlages = [...(date.plagesHoraires || [])];
                    nouvellesPlages[heureIndex] = { ...nouvellesPlages[heureIndex], [champ]: valeur };
                    return { ...date, plagesHoraires: nouvellesPlages };
                }
                return date;
            })
        )
    }

    // Réinitialiser tous les choix de dates précises
    const resetDatesPrecises = () => {
        setDatesPrecisesAjoutees([])
        setHeuresPrecisesPlages([])
        setJourDejaAjoute(false)
        setHeureDeb('')
        setHeureFin('')
        setJourDeb('')
        setJourFin('')
    }


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
                                <InputLabel>Veuillez choisir une méthode de datation :</InputLabel><br></br>
                                
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
                                      Je recherche des données sur une ou des dates précises
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
                                      Je recherche des données sur une période récurrente
                                    </Typography>
                                    }
                                  />
                
                                

                                        {/* choix des jours de la semaine pour les périodes */}
                                        {periodesTemp && (
                                            <>
                                            <Divider sx={{ my: 2 }} />

                                    <InputLabel>Ajoutez les informations utiles à la période que vous recherchez :</InputLabel><br></br>
                                                {/* Boutons pour ajouter des périodes */}
                                    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>

                                    <Button
                                        variant="contained"
                                        id="BoutonJourP"
                                        startIcon={<AddIcon />}
                                        onClick={() => ajouterPeriode('Jour(s)')}
                                        disabled={jourDejaAjoute}
                                            sx={{
                                                bgcolor: jourDejaAjoute ? '#CCCCCC' : '#0370B2',
                                                '&:hover': { bgcolor: jourDejaAjoute ? '#CCCCCC' : '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                    >
                                        Jour(s)
                                    </Button>

                                    <Button
                                        variant="contained"
                                        id="BoutonHeure"
                                        startIcon={<AddIcon />}
                                        onClick={() => ajouterPeriode('Heure(s)')}
                                        disabled={heureDejaAjoutee}
                                            sx={{
                                                bgcolor: heureDejaAjoutee ? '#CCCCCC' : '#0370B2',
                                                '&:hover': { bgcolor: heureDejaAjoutee ? '#CCCCCC' : '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                    >
                                        Heure(s)
                                    </Button>

                                    
                                    <Button
                                        variant="contained"
                                        id="BoutonMois"
                                        startIcon={<AddIcon />}
                                        onClick={() => ajouterPeriode('Mois')}
                                        disabled={moisDejaAjoute}
                                            sx={{
                                                bgcolor: moisDejaAjoute ? '#CCCCCC' : '#0370B2',
                                                '&:hover': { bgcolor: moisDejaAjoute ? '#CCCCCC' : '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                    >
                                        Mois
                                    </Button>
                                    <Button
                                        variant="contained"
                                        id="BoutonAnnee"
                                        startIcon={<AddIcon />}
                                        onClick={() => ajouterPeriode('Année(s)')}
                                        disabled={anneeDejaAjoutee}
                                            sx={{
                                                bgcolor: anneeDejaAjoutee ? '#CCCCCC' : '#0370B2',
                                                '&:hover': { bgcolor: anneeDejaAjoutee ? '#CCCCCC' : '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                        
                                    >
                                        Année(s)
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
                                                                {/*pas de bouton supprimer pour Jour(s), Mois et Année(s) car strict minimum pr recuperer les données*/}
                                                                {periode.type !=='Jour(s)' && periode.type !== 'Mois' && periode.type !== 'Année(s)' && (
                                                                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => supprimerPeriode(periode.id)}>
                                                                    Supprimer
                                                                </Button>
                                                                )}
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

                               {/*choix de datation par dates précises*/}
                                {datesPrecises && (
                                  <>
                                  <Divider sx={{ my: 2 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <InputLabel>Ajoutez les informations utiles à la date/aux dates que vous recherchez :</InputLabel><br></br>
                                        <Button 
                                        size="small" 
                                        color="error" 
                                        startIcon={<DeleteIcon />}
                                        onClick={resetDatesPrecises}
                                        sx={{ fontSize: '0.7rem' }}
                                    >
                                        Tout supprimer
                                    </Button>
                                </Box>
                                        
                                        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                                        
                                        <Button
                                            variant="contained"
                                            id="BoutonJourD"
                                            startIcon={<AddIcon />}
                                            onClick={() => ajouterDatePrecise('Jour(s)')}
                                            disabled={jourDejaAjoute}
                                            sx={{
                                                bgcolor: jourDejaAjoute ? '#CCCCCC' : '#0370B2',
                                                '&:hover': { bgcolor: jourDejaAjoute ? '#CCCCCC' : '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                        >
                                            Jour(s)
                                        </Button> 
                                        
                                        <Button
                                            variant="contained"
                                            id="BoutonHeureD"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                ajouterDatePrecise('Heure(s)') 
                                                
                                            }}
                                            sx={{
                                                bgcolor: '#0370B2',
                                                '&:hover': { bgcolor: '#00517C' },
                                                fontSize: '0.75rem',
                                                py: 0.5
                                            }}
                                        >
                                            Heure(s)
                                        </Button>

                                        </Stack>
                                        {/* Liste des dates précises ajoutées */}
                                        {datesPrecisesAjoutees.length > 0 && (
                                            <Stack spacing={2}>
                                                <Typography variant="subtitle2" sx={{ color: '#666' }}>
                                                    Date(s) sélectionnée(s) :
                                                </Typography>
                                                {datesPrecisesAjoutees.map((date) => (
                                                    <Paper key={date.id} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                                        <Stack spacing={2}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle2" sx={{ color: '#0370B2' }}>
                                                                    {date.type}
                                                                </Typography>
                                                                {/*pas de bouton supprimer pour Jour(s)*/}
                                                                {date.type !=='Jour(s)' && (
                                                                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => supprimerDatePrecise(date.id)}>
                                                                    Supprimer
                                                                </Button>
                                                                )}
                                                                
                                                            </Box>
                                                            {date.type === 'Heure(s)' && (

                                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                    <Box>
                                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                                        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}></Typography>
                                                                            <DesktopTimePicker
                                                                            label="Heure de début"
                                                                                value={(() => {
                                                                                    if (!date.valeur || date.valeur==='') return null
                                                                                    const debut = date.valeur.split('-')[0] //on récupère la 1ère heure
                                                                                    if (!debut || debut === '') return null //vérification heure début
                                                                                    const dateConv = dayjs(debut, 'HH:mm')
                                                                                    return dateConv.isValid() ? dateConv : null
                                                                                })()}
                                                                                onChange={(newValue) => {
                                                                                    if (newValue && newValue.isValid()) { 
                                                                                        const fin = date.valeur.split('-')[1] || '' //split les 2 heures pr récupérer l'heure de fin et si pas d'heure de fin, ''
                                                                                        const nouvelleValeur = `${newValue.format('HH:mm')}${fin ? `-${fin}` : ''}`
                                                                                        updateDatePrecise(date.id, nouvelleValeur)
                                                                                    }
                                                                                }}
                                                                                
                                                                                format="HH:mm"
                                                                                ampm={false}  // pour utiliser le format 24h
                                                                            />
                                                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}></Typography>
                                                                            <DesktopTimePicker
                                                                                label="Heure de fin"
                                                                                value={(() => {
                                                                                    if (!date.valeur) return null
                                                                                    const fin = date.valeur.split('-')[1]
                                                                                    if (!fin || fin === '') return null
                                                                                    const parsedDate = dayjs(fin, 'HH:mm')
                                                                                    return parsedDate.isValid() ? parsedDate : null
                                                                                })()}
                                                                                onChange={(newValue) => {
                                                                                    if (newValue && newValue.isValid()) {
                                                                                        const debut = date.valeur.split('-')[0] || ''
                                                                                        const nouvelleValeur = `${debut}${debut ? '-' : ''}${newValue.format('HH:mm')}`
                                                                                        updateDatePrecise(date.id, nouvelleValeur)
                                                                                    }
                                                                                }}
                                                                                
                                                                                format="HH:mm"
                                                                                ampm={false}
                                                                            />
                                                                        </Stack>

                                                                    {/* Plages horaires supplémentaires */}
                                                                    {(date.plagesHoraires && date.plagesHoraires.length > 0) && (
                                                                        <>
                                                                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 2, mb: 1 }}>
                                                                        Plages horaires supplémentaires :
                                                                    </Typography>

                                                                    {/* Affichage des plages horaires supplémentaires */}
                                                                    {date.plagesHoraires.map((heure, index) => (
                                                                        <Stack key={index} direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                                                            <DesktopTimePicker
                                                                                label="Heure début"
                                                                                value={heure.debut ? dayjs(heure.debut, 'HH:mm') : null}
                                                                                onChange={(newValue) => {
                                                                                    if (newValue && newValue.isValid()) {
                                                                                        updateHeurePrecise(date.id, index, 'debut', newValue.format('HH:mm'));
                                                                                    }
                                                                                }}
                                                                                
                                                                                format="HH:mm"
                                                                                ampm={false}
                                                                            />
                                                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>À</Typography>
                                                                            <DesktopTimePicker
                                                                                label="Heure fin"
                                                                                value={heure.fin ? dayjs(heure.fin, 'HH:mm') : null}
                                                                                onChange={(newValue) => {
                                                                                    if (newValue && newValue.isValid()) {
                                                                                        updateHeurePrecise(date.id, index, 'fin', newValue.format('HH:mm'));
                                                                                    }
                                                                                }}
                                                                                
                                                                                format="HH:mm"
                                                                                ampm={false}
                                                                            />
                                                                            <Button
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => supprimerHeurePrecise(date.id, index)}
                                                                                sx={{ minWidth: 'auto' }}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </Button>
                                                                        </Stack>
                                                                    ))}
                                                                    </>
                                                                    )}

                                                                    {/* Bouton pour ajouter une plage horaire */}
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<AddIcon />}
                                                                        onClick={()=> ajouterNvHeurePrecise(date.id)}
                                                                        sx={{ mt: 1, fontSize: '0.7rem' }}
                                                                    >
                                                                        Ajouter une plage horaire
                                                                    </Button>
                                                                </Box>
                                                            </LocalizationProvider>
                                                        )}

                                                            {date.type === 'Jour(s)' && (
                                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                    <Stack direction="row" spacing={2}>
                                                                        <DatePicker
                                                                            label="Date de début"
                                                                            value={(() => {
                                                                                if (!date.valeur) return null;
                                                                                const [debut] = date.valeur.split('|'); //choix de date récupéré ss forme DD-MM-YYYY|DD-MM-YYYY
                                                                                const datedebut = debut ? dayjs(debut, 'DD-MM-YYYY') : null;
                                                                                return datedebut && datedebut.isValid() ? datedebut : null; //si datedebut existe +valide on affiche sinon null

                                                                            })()}
                                                                            onChange={(newValue) => {
                                                                                if (newValue && newValue.isValid()) {
                                                                                    const fin = date.valeur?.split('|')[1] || ''; //split les 2 dates et extrait la date de fin : si pas de date de fin, ''
                                                                                    const nouvelleValeur = `${newValue.format('DD-MM-YYYY')}${fin ? `|${fin}` : ''}`; //formate la date choisie (deb|fin) et si pas de date de fin, rien
                                                                                    updateDatePrecise(date.id, nouvelleValeur);
                                                                                }
                                                                            }}
                                                                            slotProps={{ textField: { size: 'small', fullWidth: true } }} //affichage pas trop large
                                                                            format="DD/MM/YYYY"
                                                                            minDate= {dayjs('2020')} //test choix année commence à 2020 
                                                                            maxDate = {dayjs()} //bloque à date du jour
                                                                        />
                                                                        <DatePicker
                                                                            label="Date de fin"
                                                                            value={(() => {
                                                                                if (!date.valeur) return null;
                                                                                const [, fin] = date.valeur.split('|'); //choix de date récupéré ss forme DD-MM-YYYY|DD-MM-YYYY
                                                                                const datefin = fin ? dayjs(fin, 'DD-MM-YYYY') : null;
                                                                                return datefin && datefin.isValid() ? datefin : null; //si datefin existe +valide on affiche sinon null

                                                                            })()}
                                                                            onChange={(newValue) => {
                                                                                if (newValue && newValue.isValid()) {
                                                                                    const debut = date.valeur?.split('|')[0] || '';
                                                                                    const nouvelleValeur = `${debut}${debut ? '|' : ''}${newValue.format('DD-MM-YYYY')}`;
                                                                                    updateDatePrecise(date.id, nouvelleValeur);
                                                                                }
                                                                            }}
                                                                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                                            format="DD/MM/YYYY"
                                                                            minDate= {dayjs('2020')}
                                                                            maxDate = {dayjs()}
                                                                        />
                                                                    </Stack>
                                                                </LocalizationProvider>
                                                            )}
                                                            </Stack>
                                                            
                                                    </Paper>
                                                ))}
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