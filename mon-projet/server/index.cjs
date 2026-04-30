const express = require('express')
const cors = require('cors')
const { Client } = require('pg')
//Importation de PythonShell pour traiter les appels de fonctions Verif et Inte
const { PythonShell } = require('python-shell');
//Import de FileSystem
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

/* bdd fictive francisco*/
const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "post",
    database: "postgres"    

});


//bdd fictive elea
/*const client = new Client({
    host: "localhost",
    user: "eleaweber",
    port: 5432,
    password: "post",
    //database: "testEcoforum_db" (bdd 1er test)
    //database: "EcoForum" (bdd initiale)
    //database : "EcoForumV2" //bdd mise à jour 24/04
    database : "EcoForumV3" //bdd maj 27/04

})
*/
client.connect()

/////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////R O U T E S/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////


// Route pour récupérer tous les instruments
app.get('/api/instruments', async (req, res) => {
    try {
        const result = await client.query(`SELECT * FROM instrument_mesure ORDER BY id_instrument ASC`)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    } 
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


// Route pour chercher les résultats
app.post('/api/recherche', async (req, res) => {
    const { instrumentIds, dateDebut, dateFin, heuresPrecisesPlages, periodes } = req.body
    console.log("Recherche pour ids instrument:", instrumentIds)
    console.log("date début : ", dateDebut, ", date fin : ", dateFin)
    console.log("plages horaires :", heuresPrecisesPlages)
    console.log("périodes : ", periodes)
    try {
        const idsNumbers = instrumentIds.map(id => parseInt(id, 10))
        
        // on récupère les structures de chaque instrument pour avoir nb_colonnes pour l'affichage
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
        ` //$1 : 1er paramètre (instrumentsIds)
        const structures = await client.query(structureQuery, [idsNumbers])
        
        // ensuite on récupère toutes les mesures + filtre de dates
        let query = `
            SELECT 
                m.id_mesure,
                m.description_mesure,
                i.id_instrument,
                i.nom_outil as instrument,
                i.modele,
                i.num_instrument,
                cg.description as capteur,
                m.date_heure
            FROM mesure m
            JOIN serie_temporelle st ON st.id_st = m.id_st
            JOIN capteur_generique cg ON cg.id_capteur_generique = st.id_capteur_gen
            JOIN capteur c ON c.id_capteur = cg.id_capteur_generique
            JOIN instrument_mesure i ON i.id_instrument = c.id_instrument
            WHERE i.id_instrument = ANY($1::int[])
        `
        
        let params = [idsNumbers]
        let conditions = []
        
        //filtre par dates précises
        if (dateDebut && dateFin) {
            if (dateDebut === dateFin){ //une seule date
                query += ` AND DATE(m.date_heure) >= $2::date AND m.date_heure < ($2::date + interval '1 day')` //$2 = dateDebut
                params.push(dateDebut)
                console.log("recherche sur une date unique : ", dateDebut)
            } else { //sinon une période précise
                query += ` AND m.date_heure BETWEEN $2 AND $3` //$2 = dateDebut, $3 = dateFin
                params.push(dateDebut, dateFin)
                console.log("recherche sur une période précise : ", dateDebut, " et ", dateFin)
            }
        } else if (dateDebut && !dateFin) {
            // seulement date début sélectionnée
            query += ` AND DATE(m.date_heure) >= $2`
            params.push(dateDebut)
        } else if (!dateDebut && dateFin) {
        // seulement date fin sélectionnée
            query += ` AND DATE(m.date_heure) <= $2`
            params.push(dateFin)
    }
        //filtre par période : jours
        if (periodes && periodes.joursSemaine && periodes.joursSemaine.length > 0){
            const joursMap = {
                'lundi':1, 'mardi':2, 'mercredi':3, 'jeudi':4, 'vendredi':5, 'samedi':6, 'dimanche':0
            }
            const joursNum = periodes.joursSemaine.map(j=> joursMap[j.toLowerCase()]).filter(j=>j!== undefined) //met les jours en minuscules (car majuscule au début)
            if (joursNum.length>0){
                conditions.push(` EXTRACT(DOW FROM m.date_heure) IN (${joursNum.join(',')})`)
            }
        }
        //mois
        if (periodes && periodes.mois && periodes.mois.length > 0){
            const moisMap = {
                'janvier':1, 'février':2, 'mars':3, 'avril':4, 'mai':5, 'juin':6, 'juillet':7, 'août':8, 'septembre':9, 'octobre':10, 'novembre':11, 'décembre':12
            }
            const moisNum = periodes.mois.map(j=> moisMap[j.toLowerCase()]).filter(j=>j!== undefined) 
            if (moisNum.length>0){
                conditions.push(` EXTRACT(MONTH FROM m.date_heure) IN (${moisNum.join(',')})`)
            }
        }
        //années
        if (periodes && periodes.annees && periodes.annees.length > 0){
            
                conditions.push(` EXTRACT(YEAR FROM m.date_heure) IN (${periodes.annees.join(',')})`)
        }
        //conditions ajoutées à la requête
        if (conditions.length > 0){
            query += ` AND ${conditions.join(' AND ')}`
        }
        
        query += ` ORDER BY i.id_instrument, m.date_heure ASC LIMIT 100`
        
        console.log("requete sql : ", query) 
        console.log("params : ", params)
        
        const result = await client.query(query, params)

        //filtre par heures (périodes ou dates précises)
        let heuresAFiltrer = [...(heuresPrecisesPlages || [])]
        
        //ajouter les heures récurrentes de la période
        if (periodes && periodes.heures && periodes.heures.length > 0) {
            heuresAFiltrer.push(...periodes.heures)
        }

        let mesuresFiltrees = result.rows
        
        if (heuresAFiltrer.length > 0) { 
            mesuresFiltrees = result.rows.filter(row => {
                if (!row.date_heure) return false
                
                const dateHeure = new Date(row.date_heure)
                const heure = dateHeure.getHours()
                const minute = dateHeure.getMinutes()
                const heureMinute = `${heure.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` //convertit en char fomat "HH:mm" avec 2 chiffres HH et mm (si 9 > 09)
                
                // verif si l'heure correspond à au moins une des plages
                return heuresAFiltrer.some(plage => {
                    if (!plage.debut || !plage.fin) return false
                    return heureMinute >= plage.debut && heureMinute <= plage.fin
                })
            })
            
            console.log(`Filtrage par heure:  ${result.rows.length} > ${mesuresFiltrees.length} résultats`)
        }
        
        // s'il y a des entêtes, on récupère les noms
        const instrumentColonnes = new Map()
        for (const struct of structures.rows) {
            let nomsColonnes = []
            if (struct.nom_colonnes) {
                nomsColonnes = struct.nom_colonnes.split(';').map(col => col.trim()) //elles sont récupérées ss format col1;col2;col3 donc on split
                // nettoyage des noms (|| à enlever)
                nomsColonnes = nomsColonnes.map(col => {
                    if (col.includes('||')) {
                        return col.split('||')[0].trim() //on récupère le premier nom
                    }
                    return col
                })
            } else { //si pas d'entêtes, on met des noms par défaut pour pouvoir les cocher ou décocher
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

        // on regroupe les résultats par instrument
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
        
        for (const row of mesuresFiltrees) {
            const instrument = instrumentsMap.get(row.id_instrument)
            if (instrument) {
                instrument.mesures.push(row)
            }
        }
        

       // détermination de ttes les colonnes uniques à afficher (fusionner tous les noms de colonnes)
       const uniqueColonnes = new Map() // Map pour garder l'ordre d'affichage si on recoche une colonne 
       uniqueColonnes.set('Instrument', true)
       uniqueColonnes.set('Capteur', true)
       //uniqueColonnes.set('Date', true)
       //uniqueColonnes.set('Heure', true)

       
       for (const [id, instrument] of instrumentsMap) {
           for (const colName of instrument.nomsColonnes) {
               if (!uniqueColonnes.has(colName)) {
                   uniqueColonnes.set(colName, true)
               }
           }
       }
       
       const entetesGlobales = Array.from(uniqueColonnes.keys())
       
       // construction des résultats
       let tousLesResultats = []
       
       for (const [id, instrument] of instrumentsMap) {
           if (instrument.mesures.length === 0) continue
           
           for (const row of instrument.mesures) {
               const nouvelleLigne = {}
               
               nouvelleLigne["Instrument"] = row.instrument //colonnes de base pour rappel de l'instrument choisi
               nouvelleLigne["Capteur"] = row.capteur

               /* formater la date et l'heure
               if (row.date_heure) {
                const dateObj = new Date(row.date_heure)
                nouvelleLigne["Date"] = dateObj.toLocaleDateString('fr-FR') //conversion en date française DD-MM-YYYY
                nouvelleLigne["Heure"] = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) //conversion en char à 2 chiffres (9 > 09 )
            } else {
                nouvelleLigne["Date"] = '-' //sinon vide
                nouvelleLigne["Heure"] = '-'
            }*/
               // remplissage des colonnes avec les vrais noms
               for (let i = 0; i < instrument.nomsColonnes.length; i++) {
                   const colName = instrument.nomsColonnes[i]
                   if (row.description_mesure) {
                       const valeurs = row.description_mesure.split(';')
                       nouvelleLigne[colName] = valeurs[i] || '-' //si pas de valeurs, -
                   } else {
                       nouvelleLigne[colName] = '-'
                   }
               }
               
               // pour les colonnes qui existent dans d'autres instruments mais pas dans celui-ci
               for (const entete of entetesGlobales) {
                   if (nouvelleLigne[entete] === undefined && entete !== 'Instrument' && entete !== 'Capteur' && entete !== 'Date' && entete !== 'Heure') {
                       nouvelleLigne[entete] = '-'
                   }
               }
               
               tousLesResultats.push(nouvelleLigne)
           }
       }
       
       const previewResultats = tousLesResultats.slice(0, 40)
       
       //envoi des résultats 
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
//Route pour la creation de nouveau responsable fichiers
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
////////////Stockage du fichier televerse
// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    //Cree un dossier sil nexiste pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
   
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

//Stockage Fichier
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    //Recuperer l information du fichier
    res.status(200).json({
      message: 'fichier sauvegarde',
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreure Sauvegarde' });
  }
});
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Python-Shell VERIFICATION
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


// cet middleware permet de parser linformation du FOMR encode dans lURL pour le rendre utilisable
app.use(express.urlencoded({ extended: true }));


//Route Script de validation de HOBO
app.post('/api/validate-hobo-file', async (req, res) => {

    //Extraction des informations de la requete POST 
    const { fichier_mesure, nom_outil, num_instrument } = req.body;
    
    //Verification que tout les champs soit completes
    if (!fichier_mesure || !nom_outil || !num_instrument) {
        return res.status(400).json({
            success: false,
            error: 'champs non completes: fichier_mesure, nom_outil, num_instrument'
        });
    }
    //Creation du file path temporel
    let tempFilePath = null;
    //Creation du JSON quon va feed le code de verif
    try {
        const jsonInput = {
            script: "verification",           // la validation a tourner
            fichier_mesure: fichier_mesure,   // chemin
            nom_outil: nom_outil,             // nom de linstrument
            num_instrument: num_instrument    // numero de linstrument
        };
    //ON convertis le JS en un object JSON string
    const jsonString = JSON.stringify(jsonInput, null, 2);
        
    //Creation d un file path unique utilisant le dossier temporaire du systeme
    const os = require('os');
    tempFilePath = path.join(os.tmpdir(), `hobo_validation_${Date.now()}.json`);

    //On ecrit le JSON dans le fichier temporel
    fs.writeFileSync(tempFilePath, jsonString, 'utf8');
    console.log(`Created temporary JSON file: ${tempFilePath}`);//verification

    //Configuration du Python-Shell
    const scriptPath = path.join(__dirname, 'C:\\Users\\DELL\\Desktop\\CMI\\L3\\yetagain\\projet-l3-ecoforum\\Base_de_donnees', 'verification_hobo.py');//le path doit etre adapte la ou le script de validation seras sur le serveur
    
    //Configuration des options pour run le script 
    const options = {
        mode: 'text',
        pythonOptions: ['-u'],//cette option permet de recevoir des resultats en temps reel
        scriptPath: path.dirname(scriptPath),//Permet de trouver le script python
        args: ['--json', tempFilePath]


    //Execution du script et recollection le output
    PythonShell.run(path.basename(scriptPath), options, (err, results) => {
                if (err) {
                console.error('PythonShell error:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to execute Python validation script',
                    details: err.message
                });
            }
            //Recuperation de la derniere valeur qui devrait etre True ou False
            const lastOutput = results[results.length - 1].trim();
             
            const isValid = lastOutput === 'True';
            console.log(`Validation result for ${fichier_mesure}: ${isValid}`);//Visualisation en console
            
            return res.json({
                success: true,
                isValid: isValid,       // Boolean: true = si le fichier est valide
                message: isValid 
                    ? 'File validation passed' 
                    : 'File validation failed - check filename, column count, or headers',
                rawOutput: results 
            });
    });
    
        }catch (error) {
        // Catch any unexpected errors (file writing issues, etc.)
        console.error('Server error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Erreur interne de validation',
            details: error.message
        });


});
    

$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Python-Shell VERIFICATION
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})
