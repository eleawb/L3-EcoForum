import psycopg2
from dotenv import load_dotenv, find_dotenv
import os
import csv
import sys
import json
import re

load_dotenv()


# Connexion à la base
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)

#Création du curseur qui nous permettra de faire les requêtes
cur = conn.cursor()

arg = sys.argv[1]       #r".\Base_de_donnees\metadonnees.json"

with open(arg, encoding="utf-8") as f:
    metadonnees = json.load(f)

    titre, extension = os.path.splitext(metadonnees["chemin_source"])
    if (".csv" == extension) or not(extension):
        with open(metadonnees["chemin_source"], newline="", encoding="utf-8") as f2:
            source = csv.reader(f2, delimiter=";")

            cur.execute("SELECT * FROM structure_fichier WHERE nom_instrument = %s;", [metadonnees["nom_outil"]])
            struct = cur.fetchone()
            if struct:
                colonnes = next(source)

                if ((colonnes[-1]=='') and (struct[3] == len(colonnes)-1)) or (struct[3] == len(colonnes)):
                    nomFichier = metadonnees["chemin_source"].split("/")
                    resRegex = re.fullmatch(struct[5], nomFichier[-1])

                    if resRegex:
                        params = metadonnees["chemin_source"].split("_")
                        print(json.dumps({"reussite":True, "commentaire":"Le regex a marche et le fichier est valide", "numero_serie":params[-5], "extension":"csv", "date_recueil":params[-4]+params[-3]+params[-2], "type_source":"fichier_mesure"}))

                    else:
                        print(json.dumps({"reussite":True, "commentaire":"Le regex n'a pas marche mais le fichier est valide", "numero_serie":"", "extension":"", "date_recueil":"", "type_source":""}))

                else:
                    print(json.dumps({"reussite":False, "commentaire":"Il n'y a pas le bon nombre de colonnes"}))
            else:
                print(json.dumps({"reussite":False, "commentaire":"La structure de cet l'instrument n'existe pas"}))

    else:
        print(json.dumps({"reussite":False, "commentaire":"L'extension n'est pas bonne"}))


#Fermeture
cur.close()
conn.close()