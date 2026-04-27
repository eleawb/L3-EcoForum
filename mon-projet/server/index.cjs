const express = require('express')
const cors = require('cors')
const { Client } = require('pg')

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

/* bdd fictive francisco
const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "post",
    database: "postgres"

});*/


//bdd fictive elea
const client = new Client({
    host: "localhost",
    user: "eleaweber",
    port: 5432,
    password: "post",
    //database: "testEcoforum_db" (bdd 1er test)
    //database: "EcoForum" (bdd initiale)
    database : "EcoForumV2" //bdd mise à jour 24/04

})

client.connect()


// Route pour récupérer tous les instruments
app.get('/api/instruments', async (req, res) => {
    try {
        //const result = await client.query(`SELECT * FROM public.instrument ORDER BY id_instrument ASC`);//bdd fictive
        const result = await client.query(`SELECT * FROM instrument_mesure ORDER BY id_instrument ASC`)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    } //afficher numéro instrument en plus du nom !!
})



//route pour récupérer toutes les catégories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await  client.query(`SELECT * FROM public.categorie_variable ORDER BY id_categorie ASC `);
        console.log("Nombre de catégories trouvées:", result.rows.length)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

//route pour récupérer les instruments par catégories
app.post('/api/instruments/by-categories', async (req, res) => {
    const { categories } = req.body
    console.log(`Nombre de catégories sélectionnées: ${categories.length}`)
    console.log(`Recherche des instruments pour les catégories:`, categories)
    try {
        const result = await client.query(`
            SELECT DISTINCT 
                i.id_instrument,
                i.nom_outil,
                i.modele,
                i.num_instrument
            FROM instrument_mesure i
            JOIN capteur c ON c.id_instrument = i.id_instrument
            JOIN capteur_generique cg ON cg.id_capteur_generique = c.id_capteur
            JOIN serie_temporelle st ON st.id_capteur_gen = cg.id_capteur_generique
            JOIN variable_mesuree vm ON vm.id_variable_mesuree = st.id_variable_mesuree
            JOIN possede_categorie pc ON pc.id_variable = vm.id_variable_mesuree
            JOIN categorie_variable cv ON cv.id_categorie = pc.id_categorie
            WHERE cv.nom = ANY($1) 
               OR cv.id_parent IN (SELECT id_categorie FROM categorie_variable WHERE nom = ANY($1))
            ORDER BY i.id_instrument ASC
        `, [categories]);
        console.log(`${result.rows.length} instrument(s) trouvé(s) pour la catégorie `, categories);
        res.json(result.rows)
    } catch (err) {
        console.error('Erreur:', err.message)
        res.status(500).json({ error: err.message })
    }
})

/*
// Route pour chercher les résultats
app.post('/api/recherche', async (req, res) => {
    const { instrumentIds, choixDate, dateDebut, dateFin } = req.body
    console.log("Recherche pour ids instrument:", instrumentIds)

    try {
        //recherche à partir des instruments sélectionnés (+récup de nom_colonnes pour les résultats)
        let query = `
            SELECT 
                m.id_mesure,
                m.valeur_mesure,
                m.date_heure,
                m.description_mesure,
                i.nom_outil as instrument,
                i.modele,
                i.num_instrument,
                cg.description as capteur,
                vm.type_mesure,
                vm.unite_mesure
               
             
            FROM mesure m
            JOIN serie_temporelle st ON st.id_st = m.id_st
            JOIN capteur_generique cg ON cg.id_capteur_generique = st.id_capteur_gen
            JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
            JOIN instrument_mesure i ON i.id_instrument = c.id_instrument
            JOIN variable_mesuree vm ON vm.id_variable_mesuree = st.id_variable_mesuree

            WHERE i.id_instrument = ANY($1::int[])
        ` 
        
        let params = [instrumentIds.map(id => parseInt(id, 10))]
        // Ajouter filtre de date si présent
        if (dateDebut && dateFin) {
            query += ` AND m.date_heure BETWEEN $2 AND $3`
            params.push(dateDebut, dateFin)
        }
        
        query += ` ORDER BY m.date_heure ASC`
        
        const result = await client.query(query, params) //recup tous les resultats

        const resultats = result.rows //total
        const previewResultats = resultats.slice(0, 20) //les 20 premiers pr la preview
        
        if (resultats.length > 1){
            console.log(`${resultats.length} résultats trouvés, affichage des ${previewResultats.length} premiers`)

        } else if (resultats.length === 1){
            console.log(`${resultats.length} résultat trouvé`)

        } else {
            console.log(`Aucun élément trouvé`)
        }
        //on envoie les deux 
        res.json({
            resultats: resultats,
            previewResultats: previewResultats,
        })
    } catch (err) {
        console.error('Erreur:', err.message)
        res.status(500).json({ error: err.message })
    }
})
*/

// Route pour chercher les résultats
app.post('/api/recherche', async (req, res) => {
    const { instrumentIds, choixDate, dateDebut, dateFin } = req.body
    console.log("Recherche pour ids instrument:", instrumentIds)

    try {
        const idsNumbers = instrumentIds.map(id => parseInt(id, 10))
        
        //on recupere la structure du fichier (nom_colonnes et colonnes_a_traiter) pour le premier instrument
        const structureQuery = `
            SELECT sf.nom_colonnes, sf.colonnes_a_traiter
            FROM instrument_mesure i
            JOIN structure_fichier sf ON sf.id_structure = i.id_structure
            WHERE i.id_instrument = ANY($1::int[])
            LIMIT 1
        `
        const structureResult = await client.query(structureQuery, [idsNumbers]) //stocker les donnéesde structure
        
        let entetes = []
        if (structureResult.rows.length > 0 && structureResult.rows[0].nom_colonnes) {
            // on separe par ';' pour avoir chaque colonne
            let nomColonnes = structureResult.rows[0].nom_colonnes.split(';')
            
            // pour chaque colonne, on prend le premier nom (avant '||') si plusieurs possibilités
            nomColonnes = nomColonnes.map(col => {
                if (col.includes('||')) {
                    return col.split('||')[0] // ou une logique pour choisir selon la langue
                }
                return col
            })
            
            // on filtre selon colonnes_a_traiter (1 = à prendre, 0 = à ignorer)
            if (structureResult.rows[0].colonnes_a_traiter) {
                const aTraiter = structureResult.rows[0].colonnes_a_traiter.split(';').map(c => parseInt(c))
                entetes = nomColonnes.filter((_, index) => aTraiter[index] === 1)
                
            } else {
                entetes = nomColonnes
            }
        } /*else {
            // si pas de structure, on met des noms par défaut
            entetes = ['date_heure', 'valeur_mesure', 'instrument']
        }*/
        
        console.log("Entêtes calculées:", entetes)
        
        // recuperer les mesures
        let query = `
            SELECT 
                m.id_mesure,
                m.valeur_mesure,
                m.date_heure,
                m.description_mesure,
                i.nom_outil as instrument,
                i.modele,
                i.num_instrument,
                cg.description as capteur,
                vm.type_mesure,
                vm.unite_mesure
            FROM mesure m
            JOIN serie_temporelle st ON st.id_st = m.id_st
            JOIN capteur_generique cg ON cg.id_capteur_generique = st.id_capteur_gen
            JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
            JOIN instrument_mesure i ON i.id_instrument = c.id_instrument
            JOIN variable_mesuree vm ON vm.id_variable_mesuree = st.id_variable_mesuree
            WHERE i.id_instrument = ANY($1::int[])
        `
        
        let params = [idsNumbers]
        
        if (dateDebut && dateFin) {
            query += ` AND m.date_heure BETWEEN $2 AND $3`
            params.push(dateDebut, dateFin)
        }
        
        query += ` ORDER BY m.date_heure ASC LIMIT 100`
        
        const result = await client.query(query, params)
        if (entetes.length === 0) {
            // Pas d'entêtes : on envoie les données brutes telles quelles
            resultats = result.rows.map(row => ({
                date_heure: row.date_heure ? new Date(row.date_heure).toLocaleString() : '-',
                valeur_mesure: row.valeur_mesure,
                instrument: row.instrument,
                capteur: row.capteur,
                type_mesure: row.type_mesure,
                unite_mesure: row.unite_mesure
            }))
        } else {
            // Avec entêtes : on transforme selon le mapping
            resultats = result.rows.map(row => {
                const nouvelleLigne = {}
                entetes.forEach(col => {
                    if (col.toLowerCase().includes('date')) {
                        nouvelleLigne[col] = row.date_heure ? new Date(row.date_heure).toLocaleString() : '-'
                    } 
                    else if (col.toLowerCase().includes('temp') || col.toLowerCase().includes('valeur')) {
                        nouvelleLigne[col] = row.valeur_mesure
                    }
                    else if (col.toLowerCase().includes('instrument')) {
                        nouvelleLigne[col] = row.instrument
                    }
                    else if (col.toLowerCase().includes('capteur')) {
                        nouvelleLigne[col] = row.capteur
                    }
                    else {
                        nouvelleLigne[col] = row[col] || '-'
                    }
                })
                return nouvelleLigne
            })
        }
        
        const previewResultats = resultats.slice(0, 20)
        
        console.log(`${resultats.length} résultats trouvés`)
        
        res.json({
            resultats: resultats,
            previewResultats: previewResultats,
            entetes: entetes
        })
        
    } catch (err) {
        console.error('Erreur:', err.message)
        res.status(500).json({ error: err.message })
    }
})




app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})