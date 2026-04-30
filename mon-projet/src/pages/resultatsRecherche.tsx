import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download as DownloadIcon } from '@mui/icons-material' //icône téléchargement MUI
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Checkbox,
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  FormControlLabel
} from '@mui/material'

function ResultatsRecherche() {

    const navigate = useNavigate()

    const location = useLocation()
    const [previewResultats, setPreviewResultats] = useState<any[]>([]) //récupérer les 20 résultats pour la preview
    const [resultats, setResultats] = useState<any[]>([]) //récupérer tous les résultats
    const [loading, setLoading] = useState(true) //boucle de chargement le temps de l'affichage
    
    const [colonnes, setColonnes] = useState<any[]>([]) //récupérer les colonnes
    const [colonnesSelectionnees, setColonnesSelectionnees] = useState<Set<string>>(new Set()) //récupérer le choix des colonnes que l'user souhaite garder

    useEffect(() => {
        //récupérer les résultats passés par la navigation
        if (location.state) {
            setPreviewResultats(location.state.previewResultats || []) //si pas de previewResultats, mise à []
            setResultats(location.state.resultats||[]) //idem pour resultats

            //debugs
            console.log("Résultats reçus:", location.state.previewResultats?.length||0, "affichés en preview sur les", location.state.resultats?.length||0, "totaux") //si résultats undefined, ça bug donc mettre à 0
            console.log("Entêtes des colonnes :", location.state.entetes)
        
            //récupérer les entêtes sans doublons depuis le backend
            if (location.state.entetes && location.state.entetes.length > 0) {
                const entetesSansDoublons = []
                for (let i = 0; i < location.state.entetes.length; i++) {
                    if (entetesSansDoublons.indexOf(location.state.entetes[i]) === -1) {
                        entetesSansDoublons.push(location.state.entetes[i])
                    }
                }
            
                setColonnes(entetesSansDoublons)
                setColonnesSelectionnees(new Set(entetesSansDoublons))
            } else if (location.state.previewResultats && location.state.previewResultats.length > 0) {
                //on récupere depuis les données (exclure les champs internes)
                const cols = Object.keys(location.state.previewResultats[0])
                setColonnes(cols)
                setColonnesSelectionnees(new Set(cols))
            }
        } 
        setLoading(false)
    }, [location])

        //pour gérer sélection/désélection d'une colonne et en gardant l'ordre
        const ColonneChange = (colonne: string) => {
            setColonnesSelectionnees(prev => {
                const newSelection = new Set(prev) //set pour garder l'ordre et pas de doublons
                if (newSelection.has(colonne)) {
                    newSelection.delete(colonne)
                } else {
                    newSelection.add(colonne)
                }
                return newSelection
            })
        }
        

    
        // sélection/désélection de toutes les colonnes
        const SelectTout = () => {
            if (colonnesSelectionnees.size === colonnes.length) {
                setColonnesSelectionnees(new Set())
            } else {
                setColonnesSelectionnees(new Set(colonnes))
            }
        }

    // fonction pour exporter en CSV
    const telechargerCSV = () => {
        if (resultats.length === 0) return


        const colonnesAAfficher = colonnes.filter(col => colonnesSelectionnees.has(col))
        const csvRows = [colonnesAAfficher]

        //ajouter les données
        for (const row of resultats) {
            const ligne = colonnesAAfficher.map(col => {
                let valeur = row[col] || ''
                //si la valeur contient des '' ou ; on l'encapsule
                if (typeof valeur === 'string' && (valeur.includes(';') || valeur.includes('"'))) {
                    valeur = `"${valeur.replace(/"/g, '""')}"`
                }
                return valeur
            })
            csvRows.push(ligne)
        }
        
        //télécharger le fichier 
        const csvContent = csvRows.map(row => row.join(';')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }) //blob = représente un objet, semblable à un fichier, qui est immuable et qui contient des données brutes
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.setAttribute('download', 'resultats_recherche.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }


    return (
        <Box sx={{ flexGrow: 1 }}>
            {/*barre navigation*/}
            <AppBar position="static" sx={{ bgcolor: "#0370B2" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        RÉSULTATS DE LA RECHERCHE
                    </Typography>

                    {/*redirection menu principal*/}
                    <Button color="inherit" onClick={() => navigate('/')}>
                         MENU
                    </Button>

                    {/*redirection recherche de données*/}
                    <Button color="inherit" onClick={() => navigate('/recherche')}> 
                        NOUVELLE RECHERCHE
                    </Button>


                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom align="center" sx={{ color: '#5d4037' }}>
                        <b>AFFICHAGE DES RÉSULTATS</b>
                        <br></br>
                    </Typography>
                    
                    {/*boucle d'affichage propre au nb de résultats*/}
                    {loading ? (
                        <CircularProgress />

                        //si aucun résultat:
                    ) : resultats.length === 0 ? ( 
                        <Typography color="error" sx={{ textAlign: 'center', py: 4 }}> 
                            Aucun résultat trouvé pour votre recherche
                        </Typography>

                        //si 1 seul résultat : 
                    ) : resultats.length === 1 ? (
                            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                                {resultats.length} résultat trouvé
                            </Typography>
                    ) : (
                        <>
                        {/*si plusieurs résultats*/}
                        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                        {resultats.length} résultats trouvés
                        </Typography>
                        
                           
                            {/* Checkbox pour choisir les colonnes à afficher dans le csv */}
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                //si toutes les colonnes sont sélectionnées
                                                checked={colonnesSelectionnees.size === colonnes.length && colonnes.length > 0} 
                                                onChange={SelectTout}
                                                size="small"
                                            />
                                        }
                                        label={
                                            //bouton tout sélectionner pr aller plus vite
                                            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                              Tout sélectionner
                                            </Typography>
                                            }
                                    />
                                    {/*choix des colonnes*/}
                                    {colonnes.map((col) => (
                                        <FormControlLabel
                                            key={col}
                                            control={
                                                <Checkbox
                                                    checked={colonnesSelectionnees.has(col)}
                                                    onChange={() => ColonneChange(col)}
                                                    size="small"
                                                />
                                            }
                                            label={col}
                                        />
                                    ))}
                                </Stack>
                            </Paper>
                            
                            <TableContainer component={Paper} sx={{ maxHeight: 500, overflowX: 'auto' }}>
                                {/*résultats affichés avec le nom des colonnes*/}
                                <Table stickyHeader size="small">

                                    {/*affichage des noms des colonnes*/}
                                    <TableHead>
                                        <TableRow>
                                        {colonnes.filter(col => colonnesSelectionnees.has(col)).map((col, index) => (
                                                <TableCell key={index}><b>{col}</b></TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    {/*affichage des données de preview (que 20)*/}
                                    <TableBody>
                                        {previewResultats.map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                {colonnes.filter(col => colonnesSelectionnees.has(col)).map((col, colIdx) => (                                                    <TableCell key={`${idx}-${colIdx}`}>
                                                        {row[col] || '-'} {/*si pas de données, on met -*/}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            {/*téléchargement des données*/}
                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />} //icône téléchargement
                                    onClick={telechargerCSV} //fonction de téléchargement
                                    sx={{
                                        bgcolor: '#0370B2',
                                        '&:hover': { bgcolor: '#00517C' }, //plus sombre quand on passe sur le bouton
                                    }}
                                >
                                    Télécharger les résultats (CSV)
                                </Button>
                            </Stack>
                        </>
                    )}
                </Paper>
            </Container>
        </Box>
    )
}

export default ResultatsRecherche