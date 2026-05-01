import psycopg2
import pandas as pd
import os
import csv
import json
import sys
from dotenv import load_dotenv #ajout connexion générale
from pathlib import Path
import shutil

dico = {}

def charger_json(chemin_fichier):
    try:
        with open(chemin_fichier, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        dico["commentaire"] = "Fichier de mesure introuvable"
        dico["reussite"] = False
        print(json.dumps(dico))
        exit(1)
    except json.JSONDecodeError:
        dico["commentaire"] = "Erreur de format JSON"
        dico["reussite"] = False
        print(json.dumps(dico))
        exit(1)

def convert_date(date_fichier):
    # Date 2023.09.01 00:00 adapté en 2023-09-01 00:00:00 pour le type TIMESTAMP de postgreSQL
    return "-".join(date_fichier.split(".")) + ":00"

def insert_responsable(nom, prenom, adresse_mail, fonction, mail_encadrant):
    # Vérifie si le responsable est dans la BDD ou non (au cas où la personne se trompe)
    cur.execute("""
        SELECT id_personne FROM personne 
            JOIN responsable_fichier ON id_personne = id_responsable
            WHERE lower(adresse_mail) = lower(%s);
        """, (adresse_mail,))
    id_responsable = cur.fetchone()

    # Si le responsable n'existe pas
    if (id_responsable == None):
        #print(f"Ajout d'un responsable pour {prenom} {nom}")
        # Recherche de l'id de l'encadrant s'il y en a un (sinon "")
        cur.execute("""
            SELECT id_personne FROM personne WHERE lower(adresse_mail) = lower(%s);
            """, (mail_encadrant,))
        id_encadrant = cur.fetchone()
        id_encadrant = id_encadrant[0]
        # Ajout de la personne correspondant au responsable
        cur.execute("""
            INSERT INTO personne 
                (nom, prenom, adresse_mail, fonction, id_hierarchie)
                VALUES
                (%s, %s, %s, %s, %s)
            RETURNING id_personne
            """,\
            (nom, prenom, adresse_mail, fonction, id_encadrant))
        # Recherche le l'id de cet nouvelle ligne
        id_responsable = cur.fetchone()
        # Ajout du responsable
        cur.execute("""
            INSERT INTO responsable_fichier 
                (id_responsable)
                VALUES
                (%s)
            """,\
            (id_responsable[0],))
    else:
        #print("Le responsable existe déjà !")
        pass

    # Renvoie l'id du responsable à la fin
    return id_responsable[0]

def insert_source_donnees(extension, nom_source, chemin_source, date_import, date_recueil, commentaire, id_responsable, nom_instru):
    # Recherche de l'id de la structure
    cur.execute("""
        SELECT id_structure FROM structure_fichier WHERE lower(nom_instrument) = lower(%s);
        """, (nom_instru,))
    id_struct = cur.fetchone()

    if (id_struct != None):
        id_struct = id_struct[0]
        # Ajoute la source de données dans la base
        cur.execute("""
            INSERT INTO source_donnees 
                (extension, nom_source, chemin_source, date_import, date_recueil, commentaire, type_source, id_responsable, id_struct)
                VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id_source
            """,
            (extension, nom_source, chemin_source, date_import, date_recueil, commentaire, "fichier_mesure", id_responsable, id_struct))
        # Va chercher l'id de cette nouvelle source et le renvoie
        id_source = cur.fetchone()
        id_source = id_source[0]
        return id_source
    else :
        dico["commentaire"] = "Instrument non pris en compte !"
        dico["reussite"] = False
        print(json.dumps(dico))
        exit(1)

def copie_fichier(chemin_fichier, nom_instrument, date_import):
    chemin_NAS = os.path.join(os.getcwd(), "NAS/"+nom_instrument.lower())
    #le créer s'il existe pas
    os.makedirs(chemin_NAS, exist_ok=True)
    chemin_NAS = os.path.join(os.getcwd(), "NAS", nom_instrument.lower())
    nouveau_nom_fic = Path(chemin_fichier).stem + "__" + date_import.replace(":", "-").replace(" ", "_") + Path(chemin_fichier).suffix
    #print(chemin_fichier)
    #print(nouveau_nom_fic)
    #print(os.path.join(chemin_NAS, nouveau_nom_fic))
    chemin_nouveau_fic = os.path.join(chemin_NAS, nouveau_nom_fic)
    shutil.copy2(chemin_fichier, chemin_nouveau_fic)
    return chemin_nouveau_fic

def insert_serie_temporelle(id_source_donnees, nom_inst, num_col, type_mesure):
    # Recherche de la variable_mesure
    cur.execute("""
        SELECT id_variable_mesuree FROM variable_mesuree WHERE lower(type_mesure) = lower(%s);
        """, (type_mesure,))
    id_variable_mesuree = cur.fetchone()
    id_variable_mesuree = id_variable_mesuree[0]

    # Recherche du capteur correspondant à la st
    cur.execute("""
        SELECT id_capteur FROM capteur C
            JOIN instrument_mesure I ON C.id_instrument = I.id_instrument 
            WHERE num_colonne = %s AND lower(nom_outil) = lower(%s);
        """, (num_col, nom_inst))
    id_capteur = cur.fetchone()
    id_capteur = id_capteur[0]

    # Recherche de capteur_localise, verif existance st et nouv loca
    cur.execute("""
        SELECT id_loc, date_debut FROM capteur_localise C
            WHERE id_capteur_gen = %s
            AND date_debut = (
                SELECT MAX(date_debut)
                FROM capteur_localise
                WHERE id_capteur_gen = %s
            );
        """, (id_capteur, id_capteur))
    id_loc, date_capteur_loc = cur.fetchone()

    # Recherche d'un st avec les mêmes infos
    cur.execute("""
        SELECT id_st FROM serie_temporelle ST
            WHERE id_capteur_gen = %s AND id_loc = %s AND date_capteur_loc = %s;
        """, (id_capteur, id_loc, date_capteur_loc))
    id_st = cur.fetchone()

    if id_st == None:
        # Créé la nouvelle serie temporelle
        cur.execute("""
            INSERT INTO serie_temporelle 
                (date_debut, date_fin, max_mesure, min_mesure, moyenne_mesure, 
                nb_mesures, id_capteur_gen, id_loc, date_capteur_loc, id_variable_mesuree)
                VALUES (%s, NULL, %s, %s, 0, 0, %s, %s, %s, %s)
                RETURNING id_st
                """,\
            (date_capteur_loc, float('-inf'), float('inf'), id_capteur, id_loc, date_capteur_loc, id_variable_mesuree))
        id_st = cur.fetchone()
        id_st = id_st[0]

        # Faire source_donnees_ST
        cur.execute("""
            INSERT INTO source_donnees_ST
                (id_source, id_st)
                VALUES (%s, %s)
            """, (id_source_donnees, id_st))
        # False car la st n'existait pas déjà
        return False
    else:
        # True car la st existait déjà
        return True

def insert_mesure(valeur_mesure, date_heure, description_mesure, statut,\
     num_col, nom_inst, existait_st, id_mesure_associee=None):

    if existait_st:
        # Vérifie que la mesure ne soit pas déjà dans la base
        cur.execute("""
            SELECT id_mesure FROM mesure
                WHERE date_heure = %s;
            """, (date_heure,))
        id_mesure = cur.fetchone()
        # Si la mesure existait déjà passe
        if id_mesure != None:
            print("TEST")
            return

    # Recherche la serie_temporelle
    cur.execute("""
        SELECT id_st FROM serie_temporelle ST
            JOIN capteur_localise CL ON CL.id_capteur_gen = ST.id_capteur_gen 
                AND CL.id_loc = ST.id_loc AND CL.date_debut = ST.date_capteur_loc
            JOIN capteur_generique CG ON CG.id_capteur_generique = CL.id_capteur_gen
            JOIN capteur C ON C.id_capteur = CG.id_capteur_generique
            JOIN instrument_mesure IM ON C.id_instrument = IM.id_instrument
            WHERE num_colonne = %s AND lower(nom_outil) = lower(%s);
        """, (num_col, nom_inst))
    id_st = cur.fetchone()
    id_st = id_st[0]
    
    # Insère la mesure
    cur.execute("""
        INSERT INTO mesure (valeur_mesure, date_heure, description_mesure, statut, id_mesure_associee, id_st) 
            VALUES (%s, %s, %s, %s,%s, %s)
            RETURNING id_mesure
        """, (valeur_mesure, date_heure, description_mesure, statut, id_mesure_associee, id_st))
    id_mesure = cur.fetchone()
    id_mesure = [0]

    # Rechercher le dernier coef correcteur lié au capteur
    cur.execute("""
        SELECT id_coeff_correcteur FROM coefficient_correcteur CC
            JOIN capteur C ON CC.id_capteur = C.id_capteur
            JOIN instrument_mesure I ON C.id_instrument = I.id_instrument 
            WHERE num_colonne = %s AND lower(nom_outil) = lower(%s) 
            AND date_calibration = (
                SELECT MAX(date_calibration)
                FROM coefficient_correcteur CC
                JOIN capteur C ON CC.id_capteur = C.id_capteur
                JOIN instrument_mesure I ON C.id_instrument = I.id_instrument 
                WHERE num_colonne = %s AND lower(nom_outil) = lower(%s)
            );;
        """, (num_col, nom_inst, num_col, nom_inst))
    id_coeff_correcteur = cur.fetchone()
    
    # S'il y a un coef correcteur, ajoute un correction_mesure
    if id_coeff_correcteur != None:
        id_coeff_correcteur = id_coeff_correcteur[0]

        # la lier à correction_mesure s'il en existe un pour le capteur
        cur.execute("""
            INSERT INTO correction_mesure (id_coeff, id_mesure) 
                VALUES (%s, %s)
            """, (id_coeff_correcteur, id_mesure))


if __name__ == "__main__":
    # Recherche du fichier JSON avec les infos
    if len(sys.argv) < 2:
        dico["commentaire"] = "Usage : python script_TMS4.py <chemin_fichier_JSON>"
        dico["reussite"] = False
        print(json.dumps(dico))
        sys.exit(1)

    chemin_json = sys.argv[1]

    if not os.path.exists(chemin_json):
        dico["commentaire"] = "Le fichier JSON n'existe pas"
        dico["reussite"] = False
        print(json.dumps(dico))
        exit(1)
    
    dico_json = charger_json(chemin_json)

    # Connexion à la base
    load_dotenv()
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "Test"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        port=os.getenv("DB_PORT", 7777)
    )
    #print("Connection à la BDD réussie !!\n")


    #Création du curseur qui nous permettra de faire les requêtes
    cur = conn.cursor()

    fichier_mesure = dico_json["chemin_source"]

    #Utilisation de csv pour parcourir le fichier
    with open(fichier_mesure, newline="", encoding="utf-8") as f:

        reader = csv.reader(f, delimiter=";")
        ## Pas d'entête avec les TOMST
        #entetes = next(reader) #si on veut les entêtes avec csv et pas pandas
        #next(reader)  # sauter les entêtes

        # Créer le responsable fichier s'il n'existe pas
        id_responsable = insert_responsable(dico_json["nom"], dico_json["prenom"], dico_json["mail_responsable"],\
            dico_json["fonction"], dico_json["encadre_par"])

        # Copie le fichier et change son nom
        #nouv_fichier_mesure = copie_fichier(fichier_mesure, dico_json["nom_outil"], dico_json["date_import"])
        ##Fait par l'application

        # Insère la source de données (ici fichier pour TMS4, Dendromètre et Thermolloger)
        # Reprend l'extension du JSON au cas où le fichier n'en ait pas
        """nom_nouv_fichier = Path(nouv_fichier_mesure).stem
        insert_source_donnees(dico_json["extension"], nom_nouv_fichier, nouv_fichier_mesure,\
                dico_json["date_import"], dico_json["date_recueil"], dico_json["commentaire"],\
                id_responsable, dico_json["nom_outil"])
        """
        nom_fichier = Path(fichier_mesure).stem
        id_source_donnees = insert_source_donnees(dico_json["extension"], nom_fichier, fichier_mesure,\
                dico_json["date_import"], dico_json["date_recueil"], dico_json["commentaire"],\
                id_responsable, dico_json["nom_outil"])

        # Recherche de la structure à suivre
        cur.execute("""
            SELECT * FROM structure_fichier SF 
            JOIN instrument_mesure IM ON SF.id_structure = IM.id_structure 
            WHERE nom_outil = %s""",\
            (dico_json["nom_outil"],))
        # Contient les infos de la structure suivie de l'instrument de mesure
        tab_structure_instru = cur.fetchone()
        #print(tab_structure_instru)

        # Création de toutes les séries temporelles si elles n'existent pas déjà 
        # ou si changement de localisation
        for i in range(tab_structure_instru[3]):
            a_prendre_en_compte = tab_structure_instru[4].split(";")[i]

            # Pour chaque colonne à prendre en compte du fichier
            if a_prendre_en_compte == "1":
                nom_colonne = tab_structure_instru[2].split(";")[i]
                nom_inst = tab_structure_instru[7]
                # Créé une série temporelle si nécessaire
                existait_st = insert_serie_temporelle(id_source_donnees, nom_inst, i+1, nom_colonne)


        ## PRENDRE LES NOUVELLES DATES DES SERIES (vérifier que données ne soient pas déjà là)
        #### Renommer le fichier à mettre à un endroit
        for ligne in reader:
            ### Enlever tous les ; à la fin des lignes
            # enlève le dernier élément de la ligne qui est vide (; en trop à la fin)
            ligne.pop()
            # date au bon format TIMESTAMP pour ajouter dans la BDD
            date = convert_date(ligne[1])

            for i in range(tab_structure_instru[3]):
                a_prendre_en_compte = tab_structure_instru[4].split(";")[i]

                # Si existait_st, il faut verif que les mesures ne soient pas déjà dans la base (avec la date)

                # Pour chaque colonne à prendre en compte du fichier
                if a_prendre_en_compte == "1":
                    nom_colonne = tab_structure_instru[2].split(";")[i]
                    nom_inst = tab_structure_instru[7]
                    insert_mesure(ligne[i], ligne[1], nom_colonne, "principale",\
                        i+1, nom_inst, existait_st)


    #f.seek(0)  # retour au début du fichier
    #reader = csv.reader(f, delimiter=";") #remettre le lecteur au niveau de la tête de lecture

    #Réussite de l'intégration
    dico["commentaire"] = ""
    dico["reussite"] = True
    print(json.dumps(dico))

    # Commit les changements apportés à la BDD
    conn.commit()
    #print("Commit des changements !")

    # Fermeture
    cur.close()
    conn.close()





# Prendre en compte le cas où on ajoute des données avec une série temporelle qui existe déjà
# Vérifier si la localisation n'a pas changé et sinon créer une nouvelle série temporelle
# Dire qu'on ne peut pas traiter s'il n'y a pas structure fichier -> le format n'est pas conforme
#   -> pouvoir télécharger le format (pour plus tard, STAGE)


"""
-- Prendre 1er ligne fichier puis dernière ?
INSERT INTO serie_temporelle (date_debut, date_fin, max_mesure, min_mesure, moyenne_mesure, nb_mesures) VALUES
    (2023-09-01 00:00:00, 2023-09-24 23:45:00, Infinity, -Infinity, 0, 0);
-- Date début, même que date_debut de capteur_localise et date_fin dernière val fichier

INSERT INTO mesure (valeur_mesure, date_heure, description_mesure, statut, id_mesure_associee, id_st) VALUES
    (0, 2023-09-01 00:00:00, 'colonne 1 de 1 ligne de TMS4', 'principale'),
    (25.625, 2023-09-01 00:00:00, 'colonne 4 de 1 ligne de TMS4', 'principale'),
    (25.75, 2023-09-01 00:00:00, 'colonne 5 de 1 ligne de TMS4', 'principale'),
    (25.6875, 2023-09-01 00:00:00, 'colonne 6 de 1 ligne de TMS4', 'principale'),
    (403, 2023-09-01 00:00:00, 'colonne 7 de 1 ligne de TMS4', 'principale');
"""