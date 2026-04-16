import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Download as DownloadIcon } from '@mui/icons-material'
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
    const [resultats, setResultats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Récupérer les résultats passés par la navigation
        if (location.state && location.state.resultats) {
            setResultats(location.state.resultats)
            console.log("Résultats reçus:", location.state.resultats)
        }
        setLoading(false)
    }, [location])

    // Fonction pour exporter en CSV
    const telechargerCSV = () => {
        if (resultats.length === 0) return
        
        // Créer l'en-tête CSV
        const headers = ['ID', 'Date/Heure', 'Instrument', 'Modèle', 'Capteur', 'Type mesure', 'Valeur', 'Unité']
        const csvRows = [headers]
        
        // Ajouter les données
        for (const row of resultats) {
            csvRows.push([
                row.id_mesure,
                new Date(row.date_heure).toLocaleString(),
                row.instrument,
                row.modele,
                row.capteur,
                row.type_mesure,
                row.valeur_mesure,
                row.unite_mesure
            ])
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

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ bgcolor: "#0370B2" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        RÉSULTATS DE LA RECHERCHE
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/recherche')}>
                        Nouvelle recherche
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
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><b>Date/Heure</b></TableCell>
                                            <TableCell><b>Instrument</b></TableCell>
                                            <TableCell><b>Capteur</b></TableCell>
                                            <TableCell><b>Type mesure</b></TableCell>
                                            <TableCell align="right"><b>Valeur</b></TableCell>
                                            <TableCell><b>Unité</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {resultats.map((row, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>{new Date(row.date_heure).toLocaleString()}</TableCell>
                                                <TableCell>{row.instrument}</TableCell>
                                                <TableCell>{row.capteur}</TableCell>
                                                <TableCell>{row.type_mesure}</TableCell>
                                                <TableCell align="right">{row.valeur_mesure}</TableCell>
                                                <TableCell>{row.unite_mesure}</TableCell>
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