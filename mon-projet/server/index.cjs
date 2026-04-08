const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new Client({
    host: "localhost",
    user: "eleaweber",
    port: 5432,
    password: "post",
    //database: "testEcoforum_db"
    database: "EcoForum"

});

client.connect();

// Route pour récupérer tous les capteurs
app.get('/api/capteurs', async (req, res) => {
    try {
        //const result = await client.query(`SELECT * FROM public."Capteur" ORDER BY "Id" ASC`); //bdd fictive
        const result = await client.query(`SELECT id_capteur_generique as id, description as nom FROM capteur_generique ORDER BY id_capteur_generique ASC`);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Route pour rechercher des capteurs
app.post('/api/recherche', async (req, res) => {
    const { nbCapteurs, typeCapteur, nomsCapteurs } = req.body;
    try {
        //let query = `SELECT * FROM public."Capteur" WHERE 1=1`; //bdd fictive
        let query = `SELECT * FROM capteur_generique WHERE 1=1`;
        const params = [];
        
        if (typeCapteur) {
            params.push(typeCapteur);
            query += ` AND type = $${params.length}`;
        }
        
        const result = await client.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route pour récupérer tous les instruments
app.get('/api/instruments', async (req, res) => {
    try {
        //const result = await client.query(`SELECT * FROM public.instrument ORDER BY id_instrument ASC`);//bdd fictive
        const result = await client.query(`SELECT * FROM instrument_mesure ORDER BY id_instrument ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route pour récupérer les capteurs liés à un instrument
app.get('/api/capteurs/by-instrument/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Recherche des capteurs pour l'instrument ID: ${id}`);
    try {
        //const result = await client.query(`SELECT * FROM public."Capteur" WHERE "Id_instrument" = $1 ORDER BY "Id" ASC`,[id]);//bdd fictive
        const result = await client.query(`
        SELECT c.id_capteur as id, cg.description as nom 
        FROM capteur c 
        JOIN capteur_generique cg ON c.id_capteur = cg.id_capteur_generique 
        WHERE c.id_instrument = $1 
        ORDER BY c.id_capteur ASC
    `, [id])
        console.log(`${result.rows.length} capteurs trouvés pour cet instrument`);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur:', err.message);
        res.status(500).json({ error: err.message });
    }
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


//route pour récupérer les capteurs/variables par catégories
app.post('/api/capteurs/by-categorie', async (req, res) => {
    const { categorie } = req.body;
    console.log(`Recherche des capteurs pour la catégorie: ${categorie}`);
    try {
        const result = await client.query(`
        SELECT DISTINCT 
            cg.id_capteur_generique as id, 
            cg.description as nom
        FROM capteur_generique cg
        JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
        JOIN serie_temporelle st ON st.id_capteur_gen = cg.id_capteur_generique
        JOIN variable_associee_a_st vas ON vas.id_st = st.id_st
        JOIN variable_mesuree vm ON vm.id_variable_mesuree = vas.id_variable
        JOIN possede_categorie pc ON pc.id_variable = vm.id_variable_mesuree
        JOIN categorie_variable cv ON cv.id_categorie = pc.id_categorie
        WHERE cv.nom = $1 
           OR cv.id_parent IN (SELECT id_categorie FROM categorie_variable WHERE nom = $1)
        ORDER BY cg.id_capteur_generique ASC
    `, [categorie]);
    console.log(`${result.rows.length} capteur(s) trouvé(s) pour cette catégorie`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});