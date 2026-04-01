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
    database: "testEcoforum_db"
    //database: "Ecoforum"

});

client.connect();

// Route pour récupérer tous les capteurs
app.get('/api/capteurs', async (req, res) => {
    try {
        const result = await client.query(`SELECT * FROM public."Capteur" ORDER BY "Id" ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Route pour rechercher des capteurs
app.post('/api/recherche', async (req, res) => {
    const { nbCapteurs, typeCapteur, nomsCapteurs } = req.body;
    try {
        let query = `SELECT * FROM public."Capteur" WHERE 1=1`;
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
        const result = await client.query(`SELECT * FROM public.instrument ORDER BY id_instrument ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});