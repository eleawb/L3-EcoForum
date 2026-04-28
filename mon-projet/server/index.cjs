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
    //database : "EcoForumV2" //bdd mise à jour 24/04
    database : "EcoForumV3" //bdd maj 27/04

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

// Route pour récupérer tous les responsables_fichiers
app.get('/api/responsables', async (req, res) => {
    try {
        const result = await client.query(`SELECT 
                p.id_personne,
                p.nom,
                p.prenom,
                p.adresse_mail
            FROM responsable_fichier rf
            JOIN personne p ON rf.id_responsable = p.id_personne
            ORDER BY p.nom ASC`)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
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
        
        // Récupérer les structures de chaque instrument pour avoir nb_colonnes 
        const structureQuery = `
            SELECT DISTINCT
                i.id_instrument,
                i.nom_outil,
                sf.nb_colonnes,
                sf.nom_colonnes,
                sf.nom_instrument as structure_nom
            FROM instrument_mesure i
            JOIN structure_fichier sf ON sf.id_structure = i.id_structure
            WHERE i.id_instrument = ANY($1::int[])
        `
        const structures = await client.query(structureQuery, [idsNumbers])
        
        // Récupérer toutes les mesures
        let query = `
            SELECT 
                m.id_mesure,
                m.description_mesure,
                i.id_instrument,
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
        
        let params = [idsNumbers]
        
        if (dateDebut && dateFin) {
            query += ` AND m.date_heure BETWEEN $2 AND $3`
            params.push(dateDebut, dateFin)
        }
        
        query += ` ORDER BY i.id_instrument, m.date_heure ASC LIMIT 100`
        
        const result = await client.query(query, params)
        
        // si entêtes, on récupère les noms
        const instrumentColonnes = new Map()
        for (const struct of structures.rows) {
            let nomsColonnes = []
            if (struct.nom_colonnes) {
                nomsColonnes = struct.nom_colonnes.split(';').map(col => col.trim())
                // Nettoyer les noms (enlever les ||)
                nomsColonnes = nomsColonnes.map(col => {
                    if (col.includes('||')) {
                        return col.split('||')[0].trim()
                    }
                    return col
                })
            } else {
                 // Noms par défaut
                 for (let i = 1; i <= struct.nb_colonnes; i++) {
                    nomsColonnes.push(`colonne_${i}`)
                }
            }
            instrumentColonnes.set(struct.id_instrument, {
                nom: struct.nom_outil,
                nb_colonnes: struct.nb_colonnes,
                nomsColonnes: nomsColonnes
            })
        }

        // Regrouper les résultats par instrument
        const instrumentsMap = new Map()
        for (const [id, info] of instrumentColonnes) {
            instrumentsMap.set(id, {
                id: id,
                nom: info.nom,
                nb_colonnes: info.nb_colonnes,
                nomsColonnes:info.nomsColonnes,
                mesures: []
            })
        }
        
        for (const row of result.rows) {
            const instrument = instrumentsMap.get(row.id_instrument)
            if (instrument) {
                instrument.mesures.push(row)
            }
        }
        

       // Déterminer toutes les colonnes uniques à afficher (fusionner tous les noms de colonnes)
       const uniqueColonnes = new Map() // Map pour garder l'ordre
       uniqueColonnes.set('Instrument', true)
       uniqueColonnes.set('Capteur', true)
       
       for (const [id, instrument] of instrumentsMap) {
           for (const colName of instrument.nomsColonnes) {
               if (!uniqueColonnes.has(colName)) {
                   uniqueColonnes.set(colName, true)
               }
           }
       }
       
       const entetesGlobales = Array.from(uniqueColonnes.keys())
       
       // Construire les résultats
       let tousLesResultats = []
       
       for (const [id, instrument] of instrumentsMap) {
           if (instrument.mesures.length === 0) continue
           
           for (const row of instrument.mesures) {
               const nouvelleLigne = {}
               
               nouvelleLigne["Instrument"] = row.instrument
               nouvelleLigne["Capteur"] = row.capteur
               
               // Remplir les colonnes avec les vrais noms
               for (let i = 0; i < instrument.nomsColonnes.length; i++) {
                   const colName = instrument.nomsColonnes[i]
                   if (row.description_mesure) {
                       const valeurs = row.description_mesure.split(';')
                       nouvelleLigne[colName] = valeurs[i] || '-'
                   } else {
                       nouvelleLigne[colName] = '-'
                   }
               }
               
               // Pour les colonnes qui existent dans d'autres instruments mais pas dans celui-ci
               for (const entete of entetesGlobales) {
                   if (nouvelleLigne[entete] === undefined && entete !== 'Instrument' && entete !== 'Capteur') {
                       nouvelleLigne[entete] = '-'
                   }
               }
               
               tousLesResultats.push(nouvelleLigne)
           }
       }
       
       const previewResultats = tousLesResultats.slice(0, 40)
       
       res.json({
           resultats: tousLesResultats,
           previewResultats: previewResultats,
           entetes: entetesGlobales
       })
       
   } catch (err) {
       console.error('Erreur:', err.message)
       res.status(500).json({ error: err.message })
   }
})

//Envoi des information du form pour la creation d-un nouveau responable_fichier
app.post('/api/responsable_fichier', async (req, res) => {
  const { nom, prenom, email, fonction } = req.body;
  
  try {
    // Insertion de la nouvelle personne cree
    const result = await client.query(
      `INSERT INTO personne (nom, prenom, adresse_mail, fonction)
       VALUES ($1, $2, $3, $4)
       RETURNING id_personne`,
      [nom, prenom, email, fonction]
    );
    const id_personne = result.rows[0].id_personne;
    // Insertion de la personne cree a la table de responsable_fichier
    await client.query(
      `INSERT INTO responsable_fichier (id_responsable)
       VALUES ($1)`,
      [id_personne]
    );
    res.status(201).json({ 
      message: "Créé avec succès", 
      id_personne, 
      email 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})




app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})