import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download as DownloadIcon } from '@mui/icons-material' //icône téléchargement MUI
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material'

function ResultatsRecherche() {
    const navigate = useNavigate()
    const location = useLocation()
    const [previewResultats, setPreviewResultats] = useState<any[]>([]) //récupérer les 20 résultats de preview
    const [entetes, setEntetes] = useState<any[]>([]) //récupérer les entêtes colonnes du fichier
    const [resultats, setResultats] = useState<any[]>([]) //récupérer tous les résultats
    const [loading, setLoading] = useState(true) //boucle chargement le temps de l'affichage

    useEffect(() => {
        // récupérer les résultats passés par la navigation
        if (location.state) {
            setPreviewResultats(location.state.previewResultats || [])
            setResultats(location.state.resultats||[])
            setEntetes(location.state.entetes||[])
            console.log("Résultats reçus:", location.state.previewResultats?.length||0, "affichés en preview sur les", location.state.resultats?.length||0, "totaux") //si résultats undefined, ça bug donc mettre à 0
            console.log("Entêtes des colonnes :", location.state.entetes)
        }
        else {
            console.log("Aucun résultat récupéré dans location.state")
            setResultats([])
            setPreviewResultats([])
            setEntetes([])
        }
        setLoading(false)
    }, [location])

    // fonction pour exporter en CSV
    const telechargerCSV = () => {
        if (resultats.length === 0) return
        const colonnes = Object.keys(resultats[0])
        const csvRows = [entetes]

        // ajouter les données
        for (const row of resultats) { //ou previewResultats ?
            const ligne = entetes.map(col => row[col] || '')
            csvRows.push(ligne)
        }
        
        // Télécharger le fichier
        const csvContent = csvRows.map(row => row.join(';')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.setAttribute('download', 'resultats_recherche.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Récupérer les colonnes depuis le premier résultat
    const colonnes = previewResultats.length > 0 ? Object.keys(previewResultats[0]) : []

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ bgcolor: "#0370B2" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        RÉSULTATS DE LA RECHERCHE
                    </Typography>

                    <Button color="inherit" onClick={() => navigate('/')}>
                         MENU
                    </Button>

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
                    
                    {loading ? (
                        <CircularProgress />
                    ) : resultats.length === 0 ? (
                        <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>
                            Aucun résultat trouvé pour votre recherche
                        </Typography>
                    ) : resultats.length === 1 ? (
                            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                                {resultats.length} résultat trouvé
                            </Typography>
                    ) : (
                        <>
                        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                        {resultats.length} résultats trouvés
                        </Typography>
                        
                           
                            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                                <Table stickyHeader size="small">
                                    {/*<TableHead>
                                        <TableRow>
                                            {entetes.map((col, index)=>(
                                                <TableCell key={index}><b>{col}</b></TableCell>
                                            ))}
                                        </TableRow>
                                            </TableHead>*/}
                                    <TableBody>
                                        {previewResultats.map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                {colonnes.map((col,colIdx)=>(
                                                    <TableCell key={`${idx}-${colIdx}`}>
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                                                </TableCell>
                                                ))}

                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={telechargerCSV}
                                    sx={{
                                        bgcolor: '#0370B2',
                                        '&:hover': { bgcolor: '#00517C' },
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