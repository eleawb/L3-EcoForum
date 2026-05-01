import psycopg2
import pandas as pd
import os
import sys
import platform
import csv
import re
from pathlib import Path
import json
import argparse
from openpyxl import load_workbook
import shutil
from datetime import datetime
from dotenv import load_dotenv #ajout connexion générale

#pour que sur windows ou mac les chemins fichiers soient les mêmes
def normaliser_chemin(chemin):
    """Convertit un chemin Windows en chemin valide pour l'OS courant"""
    if not chemin:
        return chemin
    
    #remplacer les \ par des /
    chemin = chemin.replace('\\', '/')
    
    #enlever le './' ou '.\\' au début si présent
    if chemin.startswith('./') or chemin.startswith('.\\'):
        chemin = chemin[2:]
    elif chemin.startswith('.'):
        chemin = chemin[1:]
    
    #sur Mac/Linux, depuis Base_de_donnees, il faut remonter d'un dossier
    if sys.platform != "win32":
        #si le chemin ne commence pas déjà par ../
        if not chemin.startswith('/') and not chemin.startswith('../'):
            chemin = './' + chemin
    
    return chemin

def format_timestamp(date):
    if date == None :
        return None

    #pour vérifier si date est de type timestamp ou datetime :
    #demander si date a un attribut strftime, si oui, alors le format est toujours le format classique YYYY-MM-DD
    if hasattr(date, "strftime"): 
        return "YYYY-MM-DD HH24:MI:SS"

    elif date[0:4].isdigit() and len(date) >= 19:
        fmt = "YYYY" + date[4] + "MM" + date[7] + "DD" + " HH24:MI:SS"
        return fmt

    elif date[-4:].isdigit() and len(date) >= 10:
        fmt = "DD" + date[2] + "MM" + date[5]+ "YYYY" + " HH24:MISS"
        return fmt

    else :
        return None

def expand_item(item):
    """
    Fonction écrite par une IA car je n'arrivais pas à m'en sortir seule et que c'est une fonction utile, mais secondaire pour la vérification des fichiers
    Principe : passer de ["#", "date et heure (CET/CEST) || CET || CEST", "température , °C"] à ["#", ["date et heure (CET/CEST)", "date et heure CET", "date et heure CEST"], "température , °C"]
    La fonction prend en entrée une chaîne de caractères et teste si elle contient "||"
    Si elle contient "||", cela veut dire qu'il y a plusieurs noms possibles pour une même colonne dans plusieurs fichiers et qu'il faut donc tester toutes les possibilités avant de rejeter le fichier
    Si elle contient "||", il faut tout d'abord séparer la chaîne avec comme séparateur "||"
    Ensuite, il faut cherche la base, c'est-à-dire la string située avant la permière string qui était suivie par "||".
    Dans notre exemple, la base est "date et heure"
    Les variantes sont toutes les strings juste avant un "||" et/ou juste après un "||".
    La première string suivie par un "||" est la première variante.
    Il est possible que la dernière variante soit suivie d'une string que nous appelons la fin.
    Dans notre exemple, la fin est ""
    Une fois que la base et la fin sont séparées des variantes, il faut construire la liste de toutes les combinaisons de la forme "base variante fin"
    """
    if "||" not in item:
        return item

    # Étape 1 : découper en morceaux bruts
    parts = item.split("||")

    base = parts[0].strip()                     # avant le premier ||
    raw_variants = [p.strip() for p in parts[1:]]  # tout le reste

    # Étape 2 : la dernière partie contient la dernière variante + éventuellement la fin
    last = raw_variants[-1]

    # On sépare la dernière variante et la fin :
    # On cherche la première occurrence de la dernière variante dans 'last'
    # puis tout ce qui suit est la fin.
    last_variant = last.split()[0]  # première "mot" = variante brute
    idx = last.find(last_variant)

    # Variante finale
    final_variant = last_variant

    # Fin = tout ce qui suit la variante finale
    fin = last[idx + len(last_variant):].strip()

    # Variantes = toutes sauf la dernière, plus la variante finale propre
    variants = raw_variants[:-1] + [final_variant]

    # Étape 3 : zone à remplacer = dernier bloc de la base
    zone = base.split()[-1]

    # Étape 4 : construire les résultats
    results = []

    # Version originale
    results.append(base + " " + fin if fin else base)

    # Versions remplacées
    for v in variants:
        new = base.replace(zone, v)
        results.append(new + (" " + fin if fin else ""))

    return results

def integration_hobo(ficjson):

    dico = {
        "reussite" : False,
        "commentaire" : "",
    }

    with open(ficjson, "r", encoding="utf-8") as f:
        data = json.load(f)

    #normalisation du chemin continue ici
    data["chemin_source"] = normaliser_chemin(data["chemin_source"])
    fichier = data["chemin_source"]
    
    # Charger uniquement le premier onglet avec pandas
    df = pd.read_excel(fichier, sheet_name=0)

    fichiercsv = Path(fichier).with_suffix(".csv")

    # Sauvegarder en CSV car il est plus rapide et moins coûteux en RAM de lire un csv qu'un xlsx
    df.to_csv(fichiercsv, index=False, header=True, sep=";")
    #print(f"onglet contenant les données exporté vers {fichiercsv}")

    #Utilisation de csv pour parcourir le fichier
    with open(fichiercsv, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        entetes = next(reader) #si on veut les entêtes avec csv et pas pandas
        #next(reader)  # sauter les entêtes

        #ligne = next(reader)

        #Etape 0 : il n'y a pas de capteur localisé pour cet instrument : échec de l'intégration
        cur.execute("SELECT * FROM capteur_localise cl JOIN capteur c ON c.id_capteur = cl.id_capteur_gen JOIN instrument_mesure im ON im.id_instrument = c.id_instrument WHERE lower(im.num_instrument) = lower(%s);", (data["num_instrument"],))
        capt_loc = cur.fetchall()

        if capt_loc == []:
            dico["commentaire"] = "échec de l'intégration : il n'y a aucun capteur localisé pour cet intrument"
            print(json.dumps(dico))
            #return "échec de l'intégration : il n'y a aucun capteur localisé pour cet intrument"
        else:
            id_series_t = []

            #étape 1 : créer les variables mesurées si elles n'existent pas
            #il faudrait aussi rajouter unite_mesure, mais pour ça, il faut aller chercher dans le xlsx et j'ai pas l'envie actuellement
            cur.execute("SELECT nom_colonnes, colonnes_a_traiter FROM structure_fichier sf JOIN instrument_mesure im ON lower(im.nom_outil) = lower(sf.nom_instrument) WHERE lower(im.num_instrument) = lower(%s);", (data["num_instrument"],))
            row = list(cur.fetchone()) #censé renvoyer un tuple, que je transforme en liste
            noms_colonnes = []
            row[0] = row[0].split("; ")
            row[1] = row[1].split("; ")
            for i in range(len(row[0])):
                if int(row[1][i]) == 1:
                    noms_colonnes.append(expand_item(row[0][i]))
            #print(noms_colonnes)
            #donne un liste contenant normalement [["date et heure (CET/CEST)", "date et heure CET", "date et heure CEST"]]
            ids_var_mesurees = []
            for c in noms_colonnes:
                if isinstance(c, list):
                    cur.execute("INSERT INTO variable_mesuree (type_mesure) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM variable_mesuree WHERE TRIM(lower(type_mesure)) IS NOT DISTINCT FROM TRIM(lower(%s)));", (c[0], c[0]))
                    #print(f"insertion de la variable mesuree {c[0]} réussie ou déjà existante")
                    cur.execute("SELECT id_variable_mesuree FROM variable_mesuree WHERE TRIM(lower(type_mesure)) IS NOT DISTINCT FROM TRIM(lower(%s))", (c[0],))
                else:
                    cur.execute("INSERT INTO variable_mesuree (type_mesure) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM variable_mesuree WHERE TRIM(lower(type_mesure)) IS NOT DISTINCT FROM TRIM(lower(%s)));", (c, c))
                    #print(f"insertion de la variable mesuree {c} ou déjà existante")
                    cur.execute("SELECT id_variable_mesuree FROM variable_mesuree WHERE TRIM(lower(type_mesure)) IS NOT DISTINCT FROM TRIM(lower(%s))", (c,))
                
                ids_var_mesurees.append(cur.fetchone()[0])

            #print("ids variables mesurees : ", ids_var_mesurees)

                

            for ligne in reader:

                dateMesure = ligne[1] #finalement date dans le bon sens : YYYY-MM-DD HH24:MI:SS
            
                #étape 1.1 : recherche de tous les capteurs localisés liés à l'instrument qui ont une date_debut <= dateMesure et une date fin > dateMesure
                cur.execute("SELECT cl.id_capteur_gen, cl.id_loc, cl.date_debut, cl.date_fin FROM capteur_localise cl JOIN capteur c ON c.id_capteur = cl.id_capteur_gen JOIN instrument_mesure im ON im.id_instrument = c.id_instrument WHERE lower(im.num_instrument) = lower(%s) AND cl.date_debut <= to_timestamp(%s, %s) AND (cl.date_fin > to_timestamp(%s, %s) OR cl.date_fin IS NULL);", (data["num_instrument"], dateMesure, format_timestamp(dateMesure), dateMesure, format_timestamp(dateMesure)))
                capt_loc_time = cur.fetchall()
                capt_loc_time = list(capt_loc_time)
                cur.execute("SELECT cl.id_capteur_gen, cl.id_loc, cl.date_debut, cl.date_fin FROM capteur_localise cl JOIN capteur c ON c.id_capteur = cl.id_capteur_gen JOIN instrument_mesure im ON im.id_instrument = c.id_instrument WHERE lower(im.num_instrument) = lower(%s) AND (cl.date_fin > to_timestamp(%s, %s) OR cl.date_fin IS NULL);", (data["num_instrument"], dateMesure, format_timestamp(dateMesure)))
                capt_loc_passe = cur.fetchall()
                capt_loc_passe = list(capt_loc_passe)
                #print(capt_loc_time)

                #Cas 1 : dateMesure < cl.date_debut pour tous les capteurs localisés de l'instrument
                if capt_loc_time == []: #il n'y a aucun capteur localisé qui a une date_debut <= dateMesure et une date_fin > dateMesure
                    #étape 1.1.1 : création d'une localisation vide liée avec un milieu spécifique inconnu (sûrement un placard du bât 35...)
                    cur.execute("INSERT INTO milieu_specifique (categorie, description_milieu) VALUES ('Inconnue', 'Inconnue');")
                    cur.execute("INSERT INTO localisation (id_milieu) SELECT (SELECT id_milieu FROM milieu_specifique WHERE categorie = 'Inconnue' AND description_milieu = 'Inconnue' LIMIT 1) RETURNING id_localisation;")
                    id_loc_inconnue = cur.fetchone()[0]
                    #print(f"création d'une localisation initiale car données sans capteur localisé : {id_loc_inconnue}")

                    #étape 1.1.2 : recherche du capteur localisé le plus vieux (celui qui a la date_debut minimale) mais qui a une date début > dateMesure
                    cur.execute("""CREATE OR REPLACE VIEW capt_loc_dbmin AS
                        SELECT cl.*, c.*, im.id_instrument AS instrument_id_instrument, im.num_instrument
                        FROM capteur_localise cl
                        JOIN capteur c ON c.id_capteur = cl.id_capteur_gen
                        JOIN instrument_mesure im ON im.id_instrument = c.id_instrument
                        WHERE lower(im.num_instrument) = lower(%s) AND cl.date_debut > to_timestamp(%s, %s)
                        AND cl.date_debut = (SELECT MIN(cl2.date_debut) FROM capteur_localise cl2 JOIN capteur c2 ON c2.id_capteur = cl2.id_capteur_gen WHERE c2.id_instrument = im.id_instrument AND cl2.date_debut > to_timestamp(%s, %s))
                        ;
                    """, (data["num_instrument"], dateMesure, format_timestamp(dateMesure), dateMesure, format_timestamp(dateMesure)))

                    cur.execute("SELECT id_capteur_gen, date_debut FROM capt_loc_dbmin;")
                    capteur_loc_mindb = cur.fetchone()
                    id_capteur_loc_mindb = capteur_loc_mindb[0]
                    date_deb_capt_min = capteur_loc_mindb[1]
                    #print(capteur_loc_mindb)


                    #étape 1.2 : création d'un capteur localisé avec l'id_loc_inconnue, l'id du capteur localisé avec date_debut min > dateMesure et avec date_debut = dateMesure et date_fin = date_debut du capteur min
                    cur.execute("INSERT INTO capteur_localise (id_capteur_gen, id_loc, date_debut, date_fin) VALUES (%s, %s, to_timestamp(%s, %s), %s);", (id_capteur_loc_mindb, id_loc_inconnue, dateMesure, format_timestamp(dateMesure), date_deb_capt_min))
                    #print("capteur localisé créé")


                    #étape 1.3 : création d'autant de séries temporelles que de variables mesurées
                    id_serie_temp = 0
                    for idv in ids_var_mesurees:
                        cur.execute("""INSERT INTO serie_temporelle (date_debut, date_fin, id_capteur_gen, id_loc, date_capteur_loc, id_variable_mesuree, nb_mesures) 
                        VALUES (to_timestamp(%s, %s), to_timestamp(%s, %s), %s, %s, to_timestamp(%s, %s), %s, %s) ON CONFLICT (id_capteur_gen, id_loc, date_capteur_loc) DO UPDATE SET id_capteur_gen = EXCLUDED.id_capteur_gen RETURNING id_st;
                        """, (dateMesure, format_timestamp(dateMesure), dateMesure, format_timestamp(dateMesure), id_capteur_loc_mindb, id_loc_inconnue, dateMesure, format_timestamp(dateMesure), idv, 0))
                        #print(f"création de la ST pour la variable {idv} réussie !")
                        id_serie_temp = cur.fetchone()[0]
                        #print(id_serie_temp)
                        id_series_t.append(id_serie_temp)

                    #étape 1.4 : création des mesures
                    cur.execute("INSERT INTO mesure (valeur_mesure, date_heure, id_st) SELECT %s, to_timestamp(%s, %s), %s WHERE NOT EXISTS (SELECT 1 FROM mesure WHERE valeur_mesure = %s AND date_heure = to_timestamp(%s, %s) AND id_st = %s);", (ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp, ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp))
                    #print("insertion réussie de la mesure n°", ligne[0])
                    
                    cur.execute("SELECT id_mesure FROM mesure WHERE valeur_mesure = %s AND date_heure = to_timestamp(%s, %s) AND id_st = %s;", (ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp))
                    id_mesure_bdd = cur.fetchone()[0]

                    #étape 1.5 : liaison coefficient correcteur et mesure
                    cur.execute("INSERT INTO correction_mesure (id_mesure, id_coeff) SELECT %s, (SELECT id_coeff_correcteur FROM coefficient_correcteur WHERE id_capteur = %s) ON CONFLICT (id_mesure, id_coeff) DO NOTHING;", (id_mesure_bdd, id_capteur_loc_mindb))
                    #print("liaison coefficient-mesure réussie !")

                #il n'y a pas de capteurs localisés tq date_fin > dateMesure == on ne peut plus intégrer les données
                elif capt_loc_passe == []:
                    #print(f"impossibilité d'intégrer les données à partir de {ligne[0]}, il n'y a plus aucun capteurs localisés avec une date de fin > {dateMesure}, si vous voulez continuer d'intégrer les données, il va falloir étendre la durée d'un capteur à une localisation ou actualiser la localisation d'un capteur ^u^")
                    dico["commentaire"] = "impossibilité d'intégrer les données à partir de " + ligne[0] + " il n'y a plus aucun capteurs localisés avec une date de fin > " + dateMesure + ", si vous voulez continuer d'intégrer les données, il va falloir étendre la durée d'un capteur à une localisation ou actualiser la localisation d'un capteur"
                    print(json.dumps(dico))
                    break

                #Cas 2 : dateMesure >= cl.date_debut et < cl.date_fin : Cas normal
                else:
                    #print(capt_loc_time[0])
                    #étape 2.1 : dans capt_loc_time, il ne devrait y avoir qu'un seul capteur puisque le hobo n'est composé que d'un capteur et il ne peut pas y en avoir 2 à la même loc en même temps
                    id_capt_loc = capt_loc_time[0][0]
                    id_loc_capt = capt_loc_time[0][1]
                    date_deb_capt_loc = capt_loc_time[0][2]
                    date_fin_capt_loc = capt_loc_time[0][3]

                    #étape 2.2 : rechercher s'il existe déjà une série temporelle pour ce capteur localisé et chaque variable mesuree : sinon la créer
                    id_serie_temp = 0

                    for idv in ids_var_mesurees:

                        cur.execute("""
                            INSERT INTO serie_temporelle (
                                date_debut, date_fin, id_capteur_gen, id_loc, 
                                date_capteur_loc, id_variable_mesuree, nb_mesures
                            )
                            SELECT 
                                to_timestamp(%s, %s),
                                to_timestamp(%s, %s),
                                %s, %s, %s, %s, %s
                            WHERE NOT EXISTS (
                                SELECT 1 FROM serie_temporelle
                                WHERE id_capteur_gen = %s
                                AND id_loc = %s
                                AND date_capteur_loc = %s
                            )
                            RETURNING id_st;
                        """, (
                            dateMesure, format_timestamp(dateMesure),
                            dateMesure, format_timestamp(dateMesure),
                            id_capt_loc, id_loc_capt, date_deb_capt_loc, idv, 0,
                            id_capt_loc, id_loc_capt, date_deb_capt_loc
                        ))

                        row = cur.fetchone()
                        if row is not None:
                            id_serie_temp = row[0]
                            #print(f"Création de la ST pour la variable {idv} réussie.")
                            id_series_t.append(row[0])
                        else:
                            # La ligne existait déjà → on récupère l'id existant
                            cur.execute("""
                                SELECT id_st FROM serie_temporelle
                                WHERE id_capteur_gen = %s
                                AND id_loc = %s
                                AND date_capteur_loc = %s
                            """, (id_capt_loc, id_loc_capt, date_deb_capt_loc))
                            id_serie_temp = cur.fetchone()[0]
                            #print(f"La ST existait déjà pour la variable {idv}.")

                        """
                         #le UPDATE me donne un id super élevé pour l'id de la ST...
                        cur.execute("INSERT INTO serie_temporelle (date_debut, date_fin, id_capteur_gen, id_loc, date_capteur_loc, id_variable_mesuree, nb_mesures) VALUES (to_timestamp(%s, %s), to_timestamp(%s, %s), %s, %s, %s, %s, %s) ON CONFLICT (id_capteur_gen, id_loc, date_capteur_loc) DO UPDATE SET id_capteur_gen = EXCLUDED.id_capteur_gen RETURNING id_st;", (dateMesure, format_timestamp(dateMesure), dateMesure, format_timestamp(dateMesure), id_capt_loc, id_loc_capt, date_deb_capt_loc, idv, 0))
                        
                        print(f"création de la ST pour la variable {idv} réussie ou elle existait déjà...")

                        id_serie_temp = cur.fetchone()[0]
                        print(id_serie_temp)
                        id_series_t.append(id_serie_temp)
                    """
                    #étape 2.3 : rentrer les mesures et les lier aux coefficients correcteurs
                    cur.execute("INSERT INTO mesure (valeur_mesure, date_heure, id_st) SELECT %s, to_timestamp(%s, %s), %s WHERE NOT EXISTS (SELECT 1 FROM mesure WHERE valeur_mesure = %s AND date_heure = to_timestamp(%s, %s) AND id_st = %s);", (ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp, ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp))
                    #print("insertion réussie de la mesure n°", ligne[0])
                    
                    cur.execute("SELECT id_mesure FROM mesure WHERE valeur_mesure = %s AND date_heure = to_timestamp(%s, %s) AND id_st = %s;", (ligne[2], dateMesure, format_timestamp(dateMesure), id_serie_temp))
                    id_mesure_bdd = cur.fetchone()[0]

                    #étape 1.5 : liaison coefficient correcteur et mesure
                    cur.execute("INSERT INTO correction_mesure (id_mesure, id_coeff) SELECT %s, (SELECT id_coeff_correcteur FROM coefficient_correcteur WHERE id_capteur = %s) ON CONFLICT (id_mesure, id_coeff) DO NOTHING;", (id_mesure_bdd, id_capt_loc))
                    #print("liaison coefficient-mesure réussie !")

            #étape 3 : vérifier si responsable fichier existe sinon le créer
            #si la personne qui veut déposer son fichier n'est pas responsable fichier
            if data["est_responsable_fichier"] == False:
                #on cherche si l'encadrant référencé dans le json existe dans la base
                cur.execute("SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s);", (data["encadre_par"],))
                id_encadrant = cur.fetchone()
                #print(id_encadrant)
                if id_encadrant != ():
                    id_encadrant = id_encadrant[0]


                #si l'enccadrant n'existe pas dans la base et que dans le json, il y a un encadrant référencé
                elif id_encadrant == () and data["encadre_par"] != "":
                    #on ajoute l'encadrant à la base et on récupère son id
                    cur.execute("INSERT INTO personne (adresse_mail) VALUES (%s);", (data["encadre_par"],))
                    cur.execute("SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s);", (data["encadre_par"],))
                    id_encadrant = cur.fetchone()[0]
    
                # ici, l'encadrant existe, soit parce qu'il existait déjà, soit parce qu'on vient de le créer
                # on doit donc insérer la personne qui veut être responsable fichier si elle n'existe pas en tant que personne dans la base
                #test si la personne qui veut être responsable existe
                cur.execute("SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s);", (data["mail_responsable"],))
                id_responsable_fic = cur.fetchone()
                #print("id respo censé exister", id_responsable_fic)
                #si la personne qui veut déposer n'existe pas dans la base en tant que personne, on l'insère
                if id_responsable_fic is None:
                    #print("on passe ici")
                    cur.execute("INSERT INTO personne (adresse_mail, nom, prenom, fonction, id_hierarchie) VALUES (%s, %s, %s, %s, %s);", (data["mail_responsable"], data["nom"], data["prenom"], data["fonction"], id_encadrant))
                    cur.execute("SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s);", (data["mail_responsable"],))
                    id_responsable_fic = cur.fetchone()[0]
                    #print("id respo après insertion", id_responsable_fic)

                #on crée le responsable
                cur.execute("INSERT INTO responsable_fichier (id_responsable) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM responsable_fichier WHERE id_responsable = %s);", (id_responsable_fic, id_responsable_fic))
                #print("création responsable car inexistant réussie")

            else :#on récupère l'id du responsable s'il existait
                cur.execute("SELECT id_responsable FROM responsable_fichier rf JOIN personne p ON rf.id_responsable = p.id_personne WHERE lower(p.adresse_mail) = lower(%s);", (data["mail_responsable"],))
                id_responsable_fic = cur.fetchone()[0]

            """
            #étape 4 : copier le fichier dans un répertoire qui symbolisera le NAS et donner un nom unique au fichier : exemple, nom_fic_date_aujd
            chemin_NAS = os.path.join(os.getcwd(), "NAS/"+data['nom_outil'].lower())
            #le créer s'il existe pas
            os.makedirs(chemin_NAS, exist_ok=True)
            chemin_NAS = os.path.join(os.getcwd(), "NAS", data['nom_outil'].lower())
            print(chemin_NAS)
            nom_fic = Path(data["chemin_source"]).stem
            nouveau_nom_fic = Path(data["chemin_source"]).stem + data["date_import"].replace(":", "_") + Path(data["chemin_source"]).suffix
            shutil.copy2(data["chemin_source"], os.path.join(chemin_NAS, nouveau_nom_fic))

            print("copie réussie")
            """
            nom_fic = Path(data["chemin_source"]).stem
            nouveau_nom_fic = Path(data["chemin_source"]).with_suffix("").as_posix() + "__" + data["date_import"].replace(":", "_") + Path(data["chemin_source"]).suffix
            

            #étape 5 : créer source de données + la lier au responsable fichier + la lier à la structure correspondante au numéro d'instrument
            cur.execute("""INSERT INTO source_donnees (extension, nom_source, chemin_source, date_import, date_recueil, commentaire, id_responsable, id_struct, type_source)
            SELECT %s, %s, %s, to_timestamp(%s, %s), to_timestamp(%s, %s), %s, %s, (SELECT s.id_structure FROM structure_fichier s JOIN instrument_mesure im ON lower(im.nom_outil) = lower(s.nom_instrument) WHERE lower(im.num_instrument) = lower(%s)), %s
            WHERE NOT EXISTS (SELECT 1 FROM source_donnees WHERE lower(extension) = lower(%s) AND lower(nom_source) = lower(%s) AND lower(chemin_source) = lower(%s) AND date_import = to_timestamp(%s, %s) AND date_recueil = to_timestamp(%s, %s) AND lower(commentaire) = lower(%s) AND id_responsable = %s AND id_struct = (SELECT sf.id_structure FROM structure_fichier sf JOIN instrument_mesure im ON lower(im.nom_outil) = lower(sf.nom_instrument) WHERE lower(im.num_instrument) = lower(%s)) AND lower(type_source) = lower(%s));
            """, (data["extension"], nom_fic, nouveau_nom_fic, data["date_import"], format_timestamp(data["date_import"]), data["date_recueil"], format_timestamp(data["date_recueil"]), data["commentaire"], id_responsable_fic, data["num_instrument"], data["type_source"], data["extension"], nom_fic, nouveau_nom_fic, data["date_import"], format_timestamp(data["date_import"]), data["date_recueil"], format_timestamp(data["date_recueil"]), data["commentaire"], id_responsable_fic, data["num_instrument"], data["type_source"]))

            cur.execute("SELECT id_source FROM source_donnees WHERE lower(extension) = lower(%s) AND lower(nom_source) = lower(%s) AND lower(chemin_source) = lower(%s) AND date_import = to_timestamp(%s, %s) AND date_recueil = to_timestamp(%s, %s) AND lower(commentaire) = lower(%s) AND id_responsable = %s AND id_struct = (SELECT s.id_structure FROM structure_fichier s JOIN instrument_mesure im ON lower(im.nom_outil) = lower(s.nom_instrument) WHERE lower(im.num_instrument) = lower(%s)) AND lower(type_source) = lower(%s) LIMIT 1;", (data["extension"], nom_fic, nouveau_nom_fic, data["date_import"], format_timestamp(data["date_import"]), data["date_recueil"], format_timestamp(data["date_recueil"]), data["commentaire"], id_responsable_fic, data["num_instrument"], data["type_source"]))
            id_source_d = cur.fetchone()[0]

            #print("insertion sd d'id ", id_source_d)

            for idST in id_series_t:
                cur.execute("INSERT INTO source_donnees_st (id_source, id_st) VALUES (%s, %s) ON CONFLICT (id_source, id_st) DO NOTHING;", (id_source_d, idST))
                #print("insertion sdst réussie")
            #print(len(id_series_t))
            dico["reussite"] = True
            dico["commentaire"] = ""
            print(json.dumps(dico))

    os.remove(fichiercsv)




if __name__ == "__main__": 

    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--json")
    args = parser.parse_args()
    """

    if len(sys.argv) != 2:
        dico = {}
        dico["commentaire"] = "Usage : integration_hobo.py JSON/integration_Hobo.json"
        dico["reussite"] = False
        print(json.dumps(dico))

    else :

        load_dotenv()



        # Connexion à la base
        
        #conn = psycopg2.connect(
            #host="localhost",
            #database="eco_forum",
            #user="postgres",
            #password="123456",
            #port=5432
        #)

        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "eco_forum"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            port=os.getenv("DB_PORT", 5432)
        )

        #Création du curseur qui nous permettra de faire les requêtes
        cur = conn.cursor()
        
        integration_hobo(sys.argv[1])

        conn.commit()
        # Fermeture curseur et connexion à la base
        cur.close()
        conn.close()
