const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "post",
    //database: "testEcoforum_db"
    database: "postgres"

});

client.connect();


// Route pour récupérer tous les instruments
app.get('/api/instruments', async (req, res) => {
    try {
        //const result = await client.query(`SELECT * FROM public.instrument ORDER BY id_instrument ASC`);//bdd fictive
        const result = await client.query(`SELECT * FROM instrument_mesure ORDER BY id_instrument ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } //afficher numéro instrument en plus du nom !!
});



//route pour récupérer toutes les catégories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await client.query(`SELECT * FROM public.categorie_variable ORDER BY id_categorie ASC `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



//route pour récupérer les instruments par catégories
app.post('/api/instruments/by-categories', async (req, res) => {
    const { categories } = req.body;
    console.log(`Recherche des instruments pour les catégories: ${categories}`);
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
            WHERE cv.nom = $1 
               OR cv.id_parent IN (SELECT id_categorie FROM categorie_variable WHERE nom = $1)
            ORDER BY i.id_instrument ASC
        `, [categories]);
        console.log(`${result.rows.length} instrument(s) trouvé(s) pour cette catégorie`);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});