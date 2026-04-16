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

});
*/

//bdd fictive elea
const client = new Client({
    host: "localhost",
    user: "eleaweber",
    port: 5432,
    password: "post",
    //database: "testEcoforum_db" (bdd test)
    database: "EcoForum"

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
        console.log("Première catégorie:", result.rows[0])
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
            JOIN variable_associee_a_st vas ON vas.id_st = st.id_st
            JOIN variable_mesuree vm ON vm.id_variable_mesuree = vas.id_variable
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
        // Construire la requête SQL
        let query = `
            SELECT 
                m.id_mesure,
                m.valeur_mesure,
                m.date_heure,
                m.description_mesure,
                i.nom_outil as instrument,
                i.modele,
                i.num_instrument,
                cg.description as capteur
             
            FROM mesure m
            JOIN serie_temporelle st ON st.id_st = m.id_st
            JOIN capteur_generique cg ON cg.id_capteur_generique = st.id_capteur_gen
            JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
            JOIN instrument_mesure i ON i.id_instrument = c.id_instrument
            WHERE i.id_instrument = ANY($1::int[])
        ` 
        
        let params = [instrumentIds.map(id => parseInt(id, 10))]
        // Ajouter filtre de date si présent
        if (dateDebut && dateFin) {
            query += ` AND m.date_heure BETWEEN $2 AND $3`
            params.push(dateDebut, dateFin)
        }
        
        query += ` ORDER BY m.date_heure ASC`
        
        const result = await client.query(query, params)

        if (result.rows.length > 1){
            console.log(`${result.rows.length} résultats trouvés`)
        } else if (result.rows.length === 1){
            console.log(`${result.rows.length} résultat trouvé`)
        } else {
            console.log(`Aucun élément trouvé`)
        }
        res.json(result.rows)
    } catch (err) {
        console.error('Erreur:', err.message)
        res.status(500).json({ error: err.message })
    }
})




app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})