require('dotenv').config({path: '../Base_de_donnees/.env'})

const express = require('express')
const cors = require('cors')
const { Client } = require('pg')
//importation de PythonShell pour traiter les appels de fonctions Verif et Inte - partie francisco
const { PythonShell } = require('python-shell')
//import de FileSystem - partie francisco
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const { spawn } = require('child_process')
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

})
*/

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
//test serveur pour tout le monde
const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  }) //tout le monde a son fichier .env avec son user+mdp au lieu de chacun envoyer sur sa bdd

client.connect()
    //debugs
    .then(() => console.log('Connecté à PostgreSQL')) 
    .catch(err => console.error('Erreur de connexion:', err))

/////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////R O U T E S/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////


///////PARTIE RECHERCHE DE DONNÉES/////////////////////////////////////////////////////////////////////


//route pour récupérer tous les instruments
app.get('/api/instruments', async (req, res) => {
    try {
        const result = await client.query(`SELECT * FROM instrument_mesure ORDER BY id_instrument ASC`)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    } 
})


//route pour récupérer toutes les catégories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await  client.query(`SELECT * FROM public.categorie_variable ORDER BY id_categorie ASC `)
        console.log("Nb de catégories trouvées:", result.rows.length) //debug
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

//route pour récupérer les instruments par catégories
app.post('/api/instruments/by-categories', async (req, res) => {
    const { categories } = req.body
    //debugs
    console.log(`Nb de catégories sélectionnées: ${categories.length}`)
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
        `, [categories]) //$1 = premier paramètre 
        //debug encore
        console.log(`${result.rows.length} instrument(s) trouvé(s) pour la catégorie `, categories)
        res.json(result.rows)
    } catch (err) {
        console.error('Erreur:', err.message)
        res.status(500).json({ error: err.message })
    }
})

//route pour chercher les résultats
app.post('/api/recherche', async (req, res) => {
    const { instrumentIds, dateDebut, dateFin, heuresPrecisesPlages, periodes } = req.body
    //debugs
    console.log("Recherche pour ids instrument:", instrumentIds)
    console.log("date début : ", dateDebut, ", date fin : ", dateFin)
    console.log("plages horaires :", heuresPrecisesPlages)
    console.log("périodes : ", periodes)
    try {
        const idsNumbers = instrumentIds.map(id => parseInt(id, 10))
        
        //avant d'afficher, on récupére tous les coefficients correcteurs
        const coeffsQuery = `
            SELECT 
                cc.valeur,
                cc.date_calibration,
                cg.description as description_capteur,
                c.id_instrument,
                c.id_capteur
            FROM coefficient_correcteur cc
            JOIN capteur c ON c.id_capteur = cc.id_capteur
            JOIN capteur_generique cg ON cg.id_capteur_generique = c.id_capteur
        `

        //on récupère les dates de maintenance
        const maintenanceQuery = `
            SELECT mc.date_debut,
            mc.date_fin,
            mc.description,
            c.id_capteur,
            c.id_instrument
            FROM maintenance_capteur mc
            JOIN capteur c ON c.id_capteur = mc.id_capteur
            WHERE mc.date_fin IS NOT NULL
        `
        const coeffsResult = await client.query(coeffsQuery)
        const maintenanceResult = await client.query(maintenanceQuery)

        //organiser les coeffs par capteur + par date
        const coefficientsMap = new Map() // clé: "id_instrument|description_capteur"
        for (const coeff of coeffsResult.rows) {
            const key = `${coeff.id_instrument}|${coeff.id_capteur}`
            if (!coefficientsMap.has(key)) {
                coefficientsMap.set(key, [])
            }
            coefficientsMap.get(key).push({
                valeur: parseFloat(coeff.valeur), //convertit string en float
                date_calibration: new Date(coeff.date_calibration),
                description_capteur: coeff.description_capteur
            })
        }
        
        //les trier par date pour chaque capteur
        for (const [key, coeffs] of coefficientsMap) {
            coeffs.sort((a, b) => a.date_calibration - b.date_calibration)
        }

        //organiser les maintenances par capteur
        const maintenancesMap = new Map() // clé: "id_instrument|id_capteur"
        for (const maint of maintenanceResult.rows) {
            const key = `${maint.id_instrument}|${maint.id_capteur}`
            if (!maintenancesMap.has(key)) {
                maintenancesMap.set(key, [])
            }
            maintenancesMap.get(key).push({
                date_debut: new Date(maint.date_debut),
                date_fin: new Date(maint.date_fin),
                description: maint.description
            })
        }
        
        //fonction pr vérifier si une mesure est faite sous période de maintenance
        function estEnMaintenance(capteurKey, dateMesure) {
            const maintenances = maintenancesMap.get(capteurKey) //recup la liste de maintenance pour un capteur specifiqiue
            if (!maintenances || maintenances.length === 0) return false //si aucune maintenance pr le capteur, false
            
            const dateMesureObj = new Date(dateMesure) //conversion de la date de mesure
            
            //verification si la mesure tombe dans au moins une periode maintenance
            return maintenances.some(maint => { //vrai si qq mesures prises sous maintenance trouvées
                return dateMesureObj >= maint.date_debut && dateMesureObj <= maint.date_fin //dateMesure comprise entre date_debut et date_fin
            })
        }

        //ensuite on récupère les structures de chaque instrument pour avoir nb_colonnes pour l'affichage
        const structureQuery = `
            SELECT DISTINCT
                i.id_instrument,
                i.nom_outil,
                sf.nb_colonnes,
                sf.nom_colonnes,
                sf.colonnes_a_traiter,
                sf.nom_instrument as structure_nom
            FROM instrument_mesure i
            JOIN structure_fichier sf ON sf.id_structure = i.id_structure
            WHERE i.id_instrument = ANY($1::int[])
        ` //$1 : 1er paramètre (instrumentsIds)
        const structures = await client.query(structureQuery, [idsNumbers])
        
        //ensuite on récupère toutes les mesures + filtre de dates
        let query = `
            SELECT 
                m.id_mesure,
                m.description_mesure,
                i.id_instrument,
                m.valeur_mesure,
                i.nom_outil as instrument,
                i.modele,
                i.num_instrument,
                cg.description as capteur,
                c.id_capteur,
                m.date_heure
            FROM mesure m
            JOIN serie_temporelle st ON st.id_st = m.id_st
            JOIN capteur_localise cl ON cl.id_capteur_gen = st.id_capteur_gen            
            JOIN capteur c ON c.id_capteur = cl.id_capteur_gen
            JOIN capteur_generique cg ON cg.id_capteur_generique = c.id_capteur
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
                query += ` AND m.date_heure >= $2 AND m.date_heure < ($3::date+interval '1 day')` //$2 = dateDebut, $3 = dateFin : on ajoute un jour pr que le jourFin soit inclus à n'importe quelle heure
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
        
        query += ` ORDER BY i.id_instrument, m.date_heure ASC`
        
        console.log("requete sql : ", query) 
        console.log("params : ", params)
        
        const result = await client.query(query, params)

        //fonction pour trouver le coefficient applicable à une date
        function trouverCoefficient(capteurKey, dateMesure) {
            const coeffs = coefficientsMap.get(capteurKey)
            if (!coeffs || coeffs.length === 0) return 0
            
            const dateMesureObj = new Date(dateMesure)
            //parcours inverse pr trouver le plus récent applicable plus vite
            for (let i = coeffs.length - 1; i >= 0; i--) {
                if (coeffs[i].date_calibration <= dateMesureObj) {
                    return coeffs[i].valeur
                }
            }
            return 0
        }
        
        //avant, appliquer la correction aux mesures
        for (const row of result.rows) {
            const capteurKey = `${row.id_instrument}|${row.id_capteur}`
            const coeff = trouverCoefficient(capteurKey, row.date_heure)

            //verifier si la mesure est en periode de maintenance
            row.est_en_maintenance = estEnMaintenance(capteurKey, row.date_heure)
            
            if (coeff !== 0 && row.valeur_mesure !== null) {
                //correction : valeur_corrigee = valeur_mesure + coefficient
                const valeurOriginale = parseFloat(row.valeur_mesure)
                if (!isNaN(valeurOriginale) && coeff !==0) {
                    row.valeur_mesure_corrigee = valeurOriginale + coeff
                    row.coefficient_applique = coeff
                    //remplir la date de calibration appliquée
                    const coeffObj = coefficientsMap.get(capteurKey).find(c => c.valeur === coeff)
                    row.date_calibration_appliquee = coeffObj ? coeffObj.date_calibration : null
                } else {
                    row.valeur_mesure_corrigee = row.valeur_mesure
                    row.coefficient_applique = 0
                }
            } else {
                row.valeur_mesure_corrigee = row.valeur_mesure
                row.coefficient_applique = 0
            }
        }

        //filtre par heures (périodes ou dates précises)
        let heuresAFiltrer = [...(heuresPrecisesPlages || [])]
        
        //ajouter les heures récurrentes de la période
        if (periodes && periodes.heures && periodes.heures.length > 0) {
            heuresAFiltrer.push(...periodes.heures)
        }

        let mesuresFiltrees = result.rows

        // Ajoute ceci juste avant le filtrage horaire, après avoir récupéré result.rows
        console.log("=== APERÇU DES MESURES BRUTES ===")
        const mesures26mars = result.rows.filter(row => {
            const dateStr = new Date(row.date_heure).toISOString().split('T')[0]
            return dateStr === '2024-03-26'
        })
        console.log(`Nombre de mesures du 26 mars dans result.rows: ${mesures26mars.length}`)
        if (mesures26mars.length > 0) {
            console.log("Premières mesures du 26 mars:", mesures26mars.slice(0, 5).map(r => ({
                date: r.date_heure,
                heure: new Date(r.date_heure).getHours(),
                valeur: r.valeur_mesure
            })))
}
        
        if (heuresAFiltrer.length > 0) {
            console.log("dateDebut:", dateDebut, "dateFin:", dateFin) 
            mesuresFiltrees = result.rows.filter(row => {
                if (!row.date_heure) return false
                
                const dateHeure = new Date(row.date_heure)
                const heure = dateHeure.getHours()
                const minute = dateHeure.getMinutes()
                const heureMinute = `${heure.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` //convertit en char fomat "HH:mm" avec 2 chiffres HH et mm (si 9 > 09)
                const dateStr = `${dateHeure.getFullYear()}-${String(dateHeure.getMonth() + 1).padStart(2, '0')}-${String(dateHeure.getDate()).padStart(2, '0')}`

                //verif si l'heure correspond à au moins une des plages
                return heuresAFiltrer.some(plage => {
                    if (!plage.debut || !plage.fin) return false
                    const debut = plage.debut
                    const fin = plage.fin
                    
                    //cas où la plage chevauche minuit (20h -> 3h)
                        if (debut > fin) {
                            //recherche sur plusieurs jours seulement
                            if (dateDebut === dateFin) return false

                            //si c'est la date de début : on garde les heures >= debut
                            if (dateStr === dateDebut) {
                                const match = heureMinute >= debut
                                console.log(`Date début: ${dateStr} === ${dateDebut}, heure ${heureMinute} >= ${debut} = ${match}`)
                                return match
                            }
                            //si c'est la date de fin : on garde les heures <= fin
                            else if (dateStr === dateFin) {
                                const match = heureMinute <= fin
                                console.log(`Date fin: ${dateStr} === ${dateFin}, heure ${heureMinute} <= ${fin} = ${match}`)
                                return match
                            } else {
                                console.log(`Date intermédiaire: ${dateStr}, gardée`)
                                return true //dates intermédiaires
                            }
                        
                        } else {
                            //plage normale
                            return heureMinute >= debut && heureMinute <= fin
                        }
                    })
            })
            
            console.log(`Filtrage par heure:  ${result.rows.length} > ${mesuresFiltrees.length} résultats`) //debug comparaison avec resultat initial
        }
        
        //s'il y a des entêtes, on récupère les noms
        const instrumentColonnes = new Map()
        for (const struct of structures.rows) {
            let nomsColonnes = []
            if (struct.nom_colonnes) {
                const toutesLesColonnes = struct.nom_colonnes.split(';').map(col => col.trim())
                const colonnesATraiter = struct.colonnes_a_traiter ? struct.colonnes_a_traiter.split(';').map(c => c.trim()) : []
                
                
                for (let i = 0; i < toutesLesColonnes.length; i++) {
                    let colName = toutesLesColonnes[i]
                    
                    //nettoyer les ||, on garde que la première partie
                    if (colName.includes('||')) {
                        colName = colName.split('||')[0].trim()
                    }
                    
                    const estATraiter = colonnesATraiter[i] && colonnesATraiter[i].trim() === '1'
                    const estDateOuHeure = colName.toLowerCase().includes('date') || colName.toLowerCase().includes('heure')
                    
                    if (estATraiter) {
                        nomsColonnes.push(colName)
                    }
                    if (estDateOuHeure) {
                        nomsColonnes.push(colName)
                    }
                }
            } else {
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

        //on regroupe les résultats par instrument
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


       //aficher la colonne "Coefficient correcteur" que si au moins 1 mesure corrigée
       const afficherColonneCoeff = mesuresFiltrees.some(row => 
        row.valeur_mesure_corrigee !== undefined &&
        row.valeur_mesure !== row.valeur_mesure_corrigee //vrai si qq mesures corrigées présentes (cas avec filtres)
     ) || result.rows.some(row => 
        row.valeur_mesure_corrigee !== undefined && 
        row.valeur_mesure !== row.valeur_mesure_corrigee //vrai si qq mesures corrigées présentes (recherche générale sans filtres)
    )
    
        //afficher la colonne "maintenance" que données prises sous maintenance > 0  
        const afficherColonneMaintenance = mesuresFiltrees.some(row=>
            row.est_en_maintenance === true) || result.rows.some(row => row.est_en_maintenance === true)
            //true si qq mesures prises sous maintenance (cas avec ou sans filtres dates)

       //détermination de ttes les colonnes uniques à afficher (fusionner tous les noms de colonnes)
       const uniqueColonnes = new Map() // Map pour garder l'ordre d'affichage si on recoche une colonne 
       uniqueColonnes.set('Instrument', true)
       uniqueColonnes.set('Capteur', true)

       for (const [id, instrument] of instrumentsMap) {
           for (const colName of instrument.nomsColonnes) {
               if (!uniqueColonnes.has(colName)) {
                   uniqueColonnes.set(colName, true)
               }
           }
       }

       //afficher après colonne mesures que si minimum une valeur corrigée
       if (afficherColonneCoeff) {
            uniqueColonnes.set('Coefficient correcteur', true)
        } //si coeff correcteur

            //afficher colonne maintenance que si minimum une mesure prise sous maintenance 
        if (afficherColonneMaintenance) {
            uniqueColonnes.set('Mesure prise sous maintenance ?', true)
        } 

       
       const entetesGlobales = Array.from(uniqueColonnes.keys())
       

       // construction des résultats
       const idsMesureVus = new Set() //Set pr éviter les doublons
        let tousLesResultats = []

        for (const [id, instrument] of instrumentsMap) {
            if (instrument.mesures.length === 0) continue
            
            for (const row of instrument.mesures) {
                //ignorer les doublons d'id_mesure
                if (idsMesureVus.has(row.id_mesure)) continue
                idsMesureVus.add(row.id_mesure)
                
                const nouvelleLigne = {}
                nouvelleLigne["Instrument"] = row.instrument
                nouvelleLigne["Capteur"] = row.capteur
           
               //remplissage des colonnes avec les vrais noms
                for (let i = 0; i < instrument.nomsColonnes.length; i++) {
                    const colName = instrument.nomsColonnes[i]
                    
                    //si c'est la colonne de donnée (la seule qui n'est pas Instrument, Capteur, Date)
                    if (colName !== "Instrument" && colName !== "Capteur" && 
                        !colName.toLowerCase().includes('date') && !colName.toLowerCase().includes('heure')) {
                        //valeur mesurée
                        if (row.valeur_mesure_corrigee !== null && row.valeur_mesure_corrigee !== undefined) {
                            nouvelleLigne[colName] = row.valeur_mesure_corrigee
                            //ajouter une indication que la valeur est corrigée
                            nouvelleLigne[`${colName}_corrige`] = true
                        } else if (row.valeur_mesure !== null && row.valeur_mesure !== undefined) {
                            nouvelleLigne[colName] = row.valeur_mesure
                        } else {
                            nouvelleLigne[colName] = '-'
                        }
                    }
                    //si c'est la colonne date/heure
                    else if (colName.toLowerCase().includes('date') || colName.toLowerCase().includes('heure')) {
                        nouvelleLigne[colName] = row.date_heure 
                            ? new Date(row.date_heure).toLocaleString('fr-FR')
                            : '-'
                    }
                    else {
                        nouvelleLigne[colName] = '-'
                    }

                }

                //affichage colonne coeffs correcteurs que si présence de valeurs corrigées
                if (afficherColonneCoeff) {
                    if (row.coefficient_applique !== 0 && row.coefficient_applique !== undefined) {
                        nouvelleLigne["Coefficient correcteur"] = `${row.coefficient_applique}`
                    } else {
                        nouvelleLigne["Coefficient correcteur"] = "-"
                    }
                }


                //afficher colonne maintenance 
                if (afficherColonneMaintenance){
                    nouvelleLigne["Mesure prise sous maintenance ?"] = row.est_en_maintenance ? "Oui" : "Non" //oui si sous maintenance, non sinon
                }
                
               tousLesResultats.push(nouvelleLigne)
           }
       }
       
       const previewResultats = tousLesResultats.slice(0, 20)
       
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

///////PARTIE AJOUT DE DONNÉES//////////////////////////////////////////////////////

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




//Route pour la creation de nouveau responsable fichiers
//Envoi des information du form pour la creation d-un nouveau responable_fichier
app.post('/api/responsable_fichier', async (req, res) => {
  const { nom, prenom, email, fonction } = req.body
  
  try {
    // Insertion de la nouvelle personne cree
    const result = await client.query(
      `INSERT INTO personne (nom, prenom, adresse_mail, fonction)
       VALUES ($1, $2, $3, $4)
       RETURNING id_personne`,
      [nom, prenom, email, fonction]
    )
    const id_personne = result.rows[0].id_personne
    // Insertion de la personne cree a la table de responsable_fichier
    await client.query(
      `INSERT INTO responsable_fichier (id_responsable)
       VALUES ($1)`,
      [id_personne]
    )
    res.status(201).json({ 
      message: "Créé avec succès", 
      id_personne, 
      email 
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
////////////Stockage du fichier televerse

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads')
    //Cree un dossier sil nexiste pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    //let utf8Filename = file.originalname
    //Verifier si le file nest pas null
    if (!file || !file.originalname) {
      cb(null, `file-${Date.now()}`)
      return
    }


       // Fix UTF-8 encoding
    let utf8Filename = file.originalname
    try {
      const latin1Buffer = Buffer.from(file.originalname, 'latin1')
      utf8Filename = latin1Buffer.toString('utf8')
    } catch (e) {
      utf8Filename = file.originalname
    }
    utf8Filename = utf8Filename.replace(/[/\\:*?"<>|]/g, '_')


    cb(null,utf8Filename)
  }
})

const upload = multer({ storage: storage })

//Stockage Fichier
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
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
    })
  } catch (error) {
    res.status(500).json({ error: 'Erreure Sauvegarde' })
  }
})

/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
VERIFICATION
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/
app.post('/api/scriptVerif', async (req, res) => {
    let { nom_outil, num_instrument, chemin_source } = req.body
    
    console.log('Received verification request:', { chemin_source, nom_outil, num_instrument })
    // Build the JSON structure expected by controleur.py
    const jsonInput = {
        script: "verification",
        chemin_source: chemin_source,
        nom_outil: nom_outil,
        num_instrument: num_instrument
    }
    
    // Create temp JSON file
    const tempJsonPath = path.join(__dirname, 'temp_verif_' + Date.now() + '.json')
    
    try {
        fs.writeFileSync(tempJsonPath, JSON.stringify(jsonInput, null, 2), 'utf-8')
        
        // CALL CONTROLEUR.PY (not the specific script directly)
        const options = {
            mode: 'text',
            pythonPath: 'python',
            pythonOptions: ['-u'],
            scriptPath: path.join('../Base_de_donnees'), // Point to mon-projet folder where controleur.py is
            args: [tempJsonPath]
        }
        
        PythonShell.run('controleur.py', options)
            .then(messages => {
                fs.unlinkSync(tempJsonPath)
                const lastMessage = messages[messages.length - 1]
                try {
                    const result = JSON.parse(lastMessage)
                    res.json(result)
                } catch (parseError) {
                    res.status(500).json({
                        reussite: false,
                        commentaire: `Failed to parse output: ${lastMessage}`
                    })
                }
            })
            .catch(err => {
                if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath)
                console.error('PythonShell error:', err)
                res.status(500).json({
                    reussite: false,
                    commentaire: `Script error: ${err.message}`
                })
            })
    } catch (err) {
        if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath)
        res.status(500).json({
            reussite: false,
            commentaire: `Server error: ${err.message}`
        })
    }
})
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
VERIFICATION
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`)
})

