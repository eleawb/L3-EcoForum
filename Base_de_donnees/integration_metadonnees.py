import psycopg2
import pandas as pd
import os
import csv
import re
from pathlib import Path
import argparse

def format_date(date):
    if date == None :
        return None

    #pour vérifier si date est de type timestamp ou datetime :
    #demander si date a un attribut strftime, si oui, alors le format est toujours le format classique YYYY-MM-DD
    if hasattr(date, "strftime"): 
        return "YYYY-MM-DD"

    elif date[0:4].isdigit() and len(date) >= 10:
        fmt = "YYYY" + date[4] + "MM" + date[7] + "DD"
        return fmt

    elif date[-4:].isdigit() and len(date) >= 10:
        fmt = "DD" + date[2] + "MM" + date[5]+ "YYYY"
        return fmt

    else :
        return None


def integration_fichier_metadonnees(ficPers, ficInstr, ficLoc, ficProj):
    """ Cette fonction prends en entrée les 4 fichiers .xlsx de métadonnées contenant des infos sur les personnes,
    les instruments, les capteurs, les localisations et les projets et insère les données dans la base"""

    #pour obtenir le chemin jusqu'au repertoire dans lequel se trouve ce programme (car dans mon cas les fichiers .xlsx y sont aussi)
    #s'ils n'y sont pas dans la version finale, il faudra donner dans chemin le chemin vers le répertoire où ils sont stockés
    chemin = os.getcwd()

    #Ouverture de tous les fichiers .xlsx de métadonnées avec pandas + récupération dans des listes des noms des onglets
    dfPers = pd.read_excel(os.path.join(chemin, ficPers), sheet_name=None)
    onglets_Pers = list(dfPers.keys())
    dfInstr = pd.read_excel(os.path.join(chemin, ficInstr), sheet_name=None)
    onglets_Instr = list(dfInstr.keys())
    dfLoc = pd.read_excel(os.path.join(chemin, ficLoc), sheet_name=None)
    onglets_Loc = list(dfLoc.keys())
    dfProj = pd.read_excel(os.path.join(chemin, ficProj), sheet_name=None)
    onglets_Proj = list(dfProj.keys())


    #insertion des Personnes :
    #on itère sur des tuples de la forme (index, (ligne)) qui sont dans le premier onglet du fichier des personnes
    for index, row in dfPers[onglets_Pers[0]].iterrows():
        row = row.tolist()
        #conversion des valeurs des cases vides (NaN -> None) car PostgreSQL ne comprend pas les NaN mais arrive à convertir les None en NULL
        row = [None if pd.isna(x) else x for x in row]

        #requête à la base pour insèrer une personne
        #ON CONFLICT (attribut) DO NOTHING sert à si on tente d'insérer un doublon et que l'on tombe sur une erreur due à une contrainte UNIQUE, on n'insère pas (on ne veut pas de doublons)
        cur.execute("INSERT INTO personne (nom, prenom, adresse_mail, fonction) VALUES (%s, %s, %s, %s) ON CONFLICT (adresse_mail) DO NOTHING;", (row[0], row[1], row[2], row[3]))
        #print("insertion d'une personne réussie")
        #Si la 4ème colonne de l'onglet contient un 'Oui', on crée également un responsable fichier
        if row[4].lower() == ("Oui").lower(): #on met les chaînes de caractère en minuscules pour tester leur égalité, ça évite la casse
            cur.execute("INSERT INTO responsable_fichier SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_responsable) DO NOTHING;", (row[2],))
            #print("insertion d'un responsable fichier réussie")

    #insère les instruments de mesure
    for index, row in dfInstr[onglets_Instr[0]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        cur.execute("INSERT INTO instrument_mesure (num_instrument, modele, num_serie, nom_outil, pas_temps, fuseau_horaire, description_instrument, id_structure) SELECT %s, %s, %s, %s, %s, %s, %s, id_structure FROM structure_fichier WHERE lower(nom_instrument) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (num_instrument) DO NOTHING;", (row[1], row[2], row[0], row[3], row[4], row[5], row[6], row[3]))

        #print("insertion d'un instrument de mesure réussie")

    #insère les capteurs
    for index, row in dfInstr[onglets_Instr[1]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        #Pour insérer un capteur, il faut d'abord créer un capteur générique auquel il faudra le relier
        cur.execute("INSERT INTO capteur_generique (description) VALUES (%s) ON CONFLICT (description) DO NOTHING;", (row[2],))
        #print("insertion d'un capteur générique réussie")
        #Si la date que l'on a dans la case est de type date ou timestamp et pas string, il faut la convertir en string pour le bien des insert qui prennent des dates comme attributs car la fonction to_date de PostgreSQL n'aime que les string
        date_act = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]

        cur.execute("INSERT INTO capteur (id_capteur, date_activation, id_instrument) SELECT (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_capteur) DO NOTHING;", (row[2], date_act, format_date(row[1]), row[0]))
        
        #print("insertion d'un capteur réussie")

    #insère les remplacements des instruments/capteurs
    for index, row in dfInstr[onglets_Instr[2]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        date_rempl = row[2].strftime("%Y-%m-%d") if hasattr(row[2], "strftime") else row[2]

        if row[4].lower() == "i":
            cur.execute("INSERT INTO remplacement_instrument (id_instrument, id_nouvel_instrument, date_remplacement, raison_remplacement) SELECT (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), %s ON CONFLICT (id_instrument, id_nouvel_instrument) DO NOTHING;", (row[0], row[1], date_rempl, format_date(row[2]), row[3]))
            print("insertion de remplacement instrument réussie")
        elif row[4].lower() == "c":
            cur.execute("INSERT INTO remplacement_capteur (id_capteur, id_nouveau_capteur, date_remplacement, raison_remplacement) SELECT (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), %s ON CONFLICT (id_capteur, id_nouveau_capteur) DO NOTHING;", (row[0], row[1], date_rempl, format_date(row[2]), row[3]))
            #print("insertion de remplacement capteur réussie")

    #insère les coefficients correcteurs des capteurs
    for index, row in dfInstr[onglets_Instr[3]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        date_cal = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
        cur.execute("INSERT INTO coefficient_correcteur (valeur, date_calibration, id_capteur) SELECT %s, to_date(%s, %s), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (date_calibration, id_capteur) DO NOTHING;", (row[0], date_cal, format_date(row[1]), row[2]))
        #print("insertion de coefficient capteur réussie")

    #insère les maintenances capteur
    for index, row in dfInstr[onglets_Instr[4]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        date_deb = row[0].strftime("%Y-%m-%d") if hasattr(row[0], "strftime") else row[0]
        date_fin = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
        #le WHERE NOT EXISTS permet de vérifier avant d'insérer que le ligne n'existe pas déjà, qu'il ne va pas y avoir de doublon. C'est l'équivalent au ON CONFLICT ... DO NOTHING sauf que lui peut s'appliquer sans qu'il y ait une contraine UNIQUE
        cur.execute("""INSERT INTO maintenance_capteur (date_debut, date_fin, description, id_capteur) SELECT to_date(%s, %s), to_date(%s, %s), %s, (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s))
        WHERE NOT EXISTS (SELECT 1 FROM maintenance_capteur WHERE date_debut = to_date(%s, %s) AND date_fin = to_date(%s, %s) AND description IS NOT DISTINCT FROM %s AND id_capteur = (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)))
        ;""", (date_deb, format_date(row[0]), date_fin, format_date(row[1]), row[2], row[3], date_deb, format_date(row[0]), date_fin, format_date(row[1]), row[2], row[3]))
        #print("insertion de maintenance capteur réussie")

    #insère les référents instrument et les collecteurs
    for index, row in dfPers[onglets_Pers[1]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]

        if row[2].lower() == "r" :
            cur.execute("INSERT INTO referent_instrument (id_referent) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_referent) DO NOTHING;", (row[0],))
            #print("insertion de référent instrument réussie")

            date_deb = row[3].strftime("%Y-%m-%d") if hasattr(row[3], "strftime") else row[3]
            date_fin = row[4].strftime("%Y-%m-%d") if hasattr(row[4], "strftime") else row[4]

            cur.execute("INSERT INTO est_referent_de (id_referent, id_instrument, date_debut, date_fin) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)), to_date(%s, %s), to_date(%s, %s) ON CONFLICT (id_referent, id_instrument, date_debut) DO NOTHING;", (row[0], row[1], date_deb, format_date(row[3]), date_fin, format_date(row[4])))
            #print("insertion de est_referent_de réussie")

        elif row[2].lower() == "c" :
            cur.execute("INSERT INTO collecteur (id_collecteur) SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s) ON CONFLICT (id_collecteur) DO NOTHING;", (row[0],))
            #print("insertion de collecteur réussie")

            cur.execute("INSERT INTO collecte_instrument (id_collecteur, id_instrument) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_collecteur, id_instrument) DO NOTHING;", (row[0], row[1]))
            #print("insertion de collecte_instrument réussie")

    #insère les récolteurs
    for index, row in dfPers[onglets_Pers[2]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        #Comme pour les capteurs, il faut aussi d'abord créer un capteur générique avant d'insérer un récolteur
        cur.execute("INSERT INTO capteur_generique (description) VALUES (%s) ON CONFLICT (description) DO NOTHING;", (row[1],))
        cur.execute("INSERT INTO recolteur (id_recolteur, id_capteur_generique) SELECT (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_recolteur, id_capteur_generique) DO NOTHING;", (row[0], row[1]))
        #print("insertion de récolteur réussie")

    #insère localisation
    for index, row in dfLoc[onglets_Loc[0]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]

        cur.execute("INSERT INTO milieu_specifique (categorie, description_milieu) SELECT %s, %s WHERE NOT EXISTS (SELECT 1 FROM milieu_specifique WHERE lower(categorie) = lower(%s) AND lower(description_milieu) = lower(%s));", (row[9], row[10], row[9], row[10]))
        #print("insertion de milieu spécifique réussie")

        cur.execute("""INSERT INTO localisation (altitude, longitude, latitude, pente, hauteur, orientation, id_milieu) SELECT %s, %s, %s, %s, %s, %s, (SELECT id_milieu FROM milieu_specifique WHERE lower(description_milieu) IS NOT DISTINCT FROM lower(%s) AND lower(categorie) IS NOT DISTINCT FROM lower(%s) LIMIT 1)
        WHERE NOT EXISTS (SELECT 1 FROM localisation WHERE altitude IS NOT DISTINCT FROM %s AND longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s
        AND id_milieu = (SELECT id_milieu FROM milieu_specifique WHERE lower(description_milieu) IS NOT DISTINCT FROM lower(%s) AND lower(categorie) IS NOT DISTINCT FROM lower(%s) LIMIT 1))
        ;""", (row[3], row[4], row[5], row[6], row[7], row[8], row[10], row[9], row[3], row[4], row[5], row[6], row[7], row[8], row[10], row[9]))
        #print("insertion de localisation réussie")

        #on récupère tous les capteurs qui sont liés à l'instrument de mesure cité dans la ligne
        cur.execute("SELECT id_capteur FROM capteur JOIN instrument_mesure im ON im.id_instrument = capteur.id_instrument WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s);", (row[0],))
        capteurs = cur.fetchall()
        #pour chaque capteur associé à un instrument, on associe la bonne localisation. (dans notre .xlsx, la localisation est associée à un instrument et pas un capteur alors que dans notre modèle EA c'est l'inverse) 
        for c in capteurs:
            date_deb = row[1].strftime("%Y-%m-%d") if hasattr(row[1], "strftime") else row[1]
            date_fin = row[2].strftime("%Y-%m-%d") if hasattr(row[2], "strftime") else row[2]
            cur.execute("INSERT INTO capteur_localise (id_capteur_gen, id_loc, date_debut, date_fin) SELECT %s, (SELECT id_localisation FROM localisation WHERE longitude IS NOT DISTINCT FROM %s AND latitude IS NOT DISTINCT FROM %s AND pente IS NOT DISTINCT FROM %s AND orientation IS NOT DISTINCT FROM %s AND altitude IS NOT DISTINCT FROM %s AND hauteur IS NOT DISTINCT FROM %s LIMIT 1), to_date(%s, %s), to_date(%s, %s) ON CONFLICT (id_capteur_gen, id_loc, date_debut) DO NOTHING;", (c[0], row[4], row[5], row[6], row[8], row[3], row[7], date_deb, format_date(row[1]), date_fin, format_date(row[2])))
            #print("insertion de capteur localisé réussie")

    #insère les projets
    for index, row in dfProj[onglets_Proj[0]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]
        date_deb = row[3].strftime("%Y-%m-%d") if hasattr(row[3], "strftime") else row[3]
        date_fin = row[4].strftime("%Y-%m-%d") if hasattr(row[4], "strftime") else row[4]
        cur.execute("""INSERT INTO projet (nom_responsable, mail_responsable, date_debut, date_fin) SELECT %s, %s, to_date(%s, %s), to_date(%s, %s)
        WHERE NOT EXISTS (SELECT 1 FROM projet WHERE lower(nom_responsable) = lower(%s) AND lower(mail_responsable) = lower(%s) AND date_debut = to_date(%s, %s) AND date_fin = to_date(%s, %s))
        ;""", (row[1], row[2], date_deb, format_date(row[3]), date_fin, format_date(row[4]), row[1], row[2], date_deb, format_date(row[3]), date_fin, format_date(row[4])))
        #print("insertion de projet réussie")

    #insère les association des récolteurs et des instruments associés à des projets
    #Double ou triple boucle for car il faut aller chercher les infos dans différents onglets voire différents fichiers
    for index, row in dfProj[onglets_Proj[1]].iterrows():
        row = row.tolist()
        row = [None if pd.isna(x) else x for x in row]

        for index1, row1 in dfProj[onglets_Proj[0]].iterrows():
            row1 = row1.tolist()
            row1 = [None if pd.isna(x) else x for x in row1]
            date_deb = row1[3].strftime("%Y-%m-%d") if hasattr(row1[3], "strftime") else row1[3]
            date_fin = row1[4].strftime("%Y-%m-%d") if hasattr(row1[4], "strftime") else row1[4]

            if row[2].lower() == "i" :
                if row1[0] == row[1]:
                    cur.execute("INSERT INTO instrument_projet (id_projet, id_instrument) SELECT (SELECT id_projet FROM projet WHERE lower(mail_responsable) IS NOT DISTINCT FROM lower(%s) AND date_debut IS NOT DISTINCT FROM to_date(%s, %s) AND date_fin IS NOT DISTINCT FROM to_date(%s, %s) AND lower(nom_responsable) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_instrument FROM instrument_mesure WHERE lower(num_instrument) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT (id_projet, id_instrument) DO NOTHING;", (row1[2], date_deb, format_date(row1[3]), date_fin, format_date(row1[4]), row1[1], row[0]))
                    #print("insertion (maudite) d'instrument_projet réussie")

            elif row[2].lower() == "r" :
                if row1[0] == row[1]:

                    for index2, row2 in dfPers[onglets_Pers[2]].iterrows():
                        row2 = row2.tolist()
                        row2 = [None if pd.isna(x) else x for x in row2]

                        if row2[0] == row[0]:
                            cur.execute("INSERT INTO membre_projet (id_projet, id_recolteur, id_capteur_generique) SELECT (SELECT id_projet FROM projet WHERE lower(mail_responsable) IS NOT DISTINCT FROM lower(%s) AND date_debut IS NOT DISTINCT FROM to_date(%s, %s) AND date_fin IS NOT DISTINCT FROM to_date(%s, %s) AND lower(nom_responsable) IS NOT DISTINCT FROM lower(%s) LIMIT 1), (SELECT id_personne FROM personne WHERE lower(adresse_mail) IS NOT DISTINCT FROM lower(%s)), (SELECT id_capteur_generique FROM capteur_generique WHERE lower(description) IS NOT DISTINCT FROM lower(%s)) ON CONFLICT(id_projet, id_recolteur, id_capteur_generique) DO NOTHING;", (row1[2], date_deb, format_date(row1[3]), date_fin, format_date(row1[4]), row1[1], row[0], row2[1]))
                            #print("insertion (maudite-bis) de membre projet")

    #insère groupe récolte - mais je pense que c'est pas possible car il va manquer des attributs pour les reconnaître sans utiliser l'id qu'ils ont dans la base
    #il faudrait peut-être ajouter un nom UNIQUE ?

if __name__ == "__main__" :

    #arguments à donner si on veut lors de l'appel au programme en ligne de commande
    # exemple d'appel : python3 integration_metadonnees.py --ficPers Remplissage_des_tables_des_personnes.xlsx --ficInstr Remplissage_des_tables_liees_aux_capteurs.xlsx
    parser = argparse.ArgumentParser()
    parser.add_argument("--ficPers", default="Remplissage_des_tables_des_personnes.xlsx")
    parser.add_argument("--ficInstr", default="Remplissage_des_tables_liees_aux_capteurs.xlsx")
    parser.add_argument("--ficLoc", default="Remplissage_des_tables_de_localisation.xlsx")
    parser.add_argument("--ficProj", default="Remplissage_des_tables_des_projet&groupes.xlsx")
    args = parser.parse_args()


# Connexion à la base
    conn = psycopg2.connect(
        host="localhost",
        database="eco_forum",
        user="postgres",
        password="123456",
        port=5432
    )

    #Création du curseur qui nous permettra de faire les requêtes
    cur = conn.cursor()

    #Appel à la fonction qui va ajouter les données stockées dans les fichiers de métadonnées en .xlsx
    integration_fichier_metadonnees(args.ficPers, args.ficInstr, args.ficLoc, args.ficProj)

    #Pour faire passer les modifications à la base de données
    conn.commit()

    #Fermeture du curseur et de la connexion
    cur.close()
    conn.close()