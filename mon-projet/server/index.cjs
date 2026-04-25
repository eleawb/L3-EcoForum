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




app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})