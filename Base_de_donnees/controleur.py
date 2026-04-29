import os
import sys
import subprocess
import json

reponse = r".\Base_de_donnees\reponse_verif.json"

if len(sys.argv)!=2:                                             #Respectivement if len(sys.argv)!=3:
    with open(reponse, 'w', encoding="utf-8") as r:
        json.dump({"réussite":False, "commentaire":"Usage : python ./controleur.py metadonnees.json"}, r)       #json.dump({"réussite":False, "commentaire":"Usage : python ./controleur.py mesure.csv/xlsx metadonnees.json"}, f)
    sys.exit(reponse)

#Si l'on veut séparer le chemin du fichier de mesure du fichier en json :
#arg1 = sys.argv[1]  #Argument 1, le chemin du fichier de mesure, exemple : r".\Base_de_donnees\data_95224601_2024_11_19_0.csv"
#arg2 = sys.argv[2]  #Argument 2, le chemin du fichier de métadonnées, exemple : r".\Base_de_donnees\metadonnees.json"
#Sinon :
arg = sys.argv[1]    # Argument, le chemin du fichier de métadonnées, exemple : r".\Base_de_donnees\metadonnees.json"

with open(arg, encoding="utf-8") as f:
    metadonnees = json.load(f)                 #Ouverture du json
    match metadonnees["script"]:
        case "intégration":                    #Cas où le script à éxécuter est le script d'intégration
            try:
                retour = subprocess.run(["python", "./Base_de_donnees/integration_donnees_"+metadonnees["nom_outil"].lower()+".py", arg], shell=True, capture_output=True, text=True, check=True)
                #éxécution du script en permettant de stocker la valeur de "retour"(les print)
                sys.exit(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
            except subprocess.CalledProcessError as e:
                with open(reponse, 'w', encoding="utf-8") as r:
                    json.dump({"réussite":False, "commentaire":f"La commande d'intégration des données a échoué avec le code d'erreur : {e.returncode}"}, r)
                print(reponse)
                #"Retour" de notre script si tout ne s'est pas bien passé
                #print(e.stderr)            #Si l'on veut voir tout le message d'erreur effectuer par le script défectueux
                #sys.exit(e.stdout)         #Si l'on veut voir tout les print effectuer par le script défectueux
        case "vérification":                   #Cas où le script à éxécuter est le script de vérification
            try:
                retour = subprocess.run(["python", "./Base_de_donnees/verification_donnees_"+metadonnees["nom_outil"].lower()+".py", arg], shell=True, capture_output=True, text=True, check=True)
                sys.exit(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
            except subprocess.CalledProcessError as e:
                with open(reponse, 'w', encoding="utf-8") as r:
                    json.dump({"réussite":False, "commentaire":f"La commande de vérification des données a échoué avec le code d'erreur : {e.returncode}"}, r)
                print(reponse)
                #"Retour" de notre script si tout ne s'est pas bien passé
                #print(e.stderr)            #Si l'on veut voir tout le message d'erreur effectuer par le script défectueux
                #sys.exit(e.stdout)         #Si l'on veut voir tout les print effectuer par le script défectueux
        case "intégration_métadonnées":
            args = []
            for i in range(len(metadonnees["type_script"])):
                match metadonnees["type_script"][i]:
                    case "personne":
                        args.append(f"--ficPers {metadonnees["fichier_données"][i]}")
                    case "capteur":
                        args.append(f"--ficInstr {metadonnees["fichier_données"][i]}")
                    case "localisation":
                        args.append("--ficLoc")
                        args.append(metadonnees["fichier_données"][i])
                    case "projet":
                        if "personne" not in metadonnees["type_script"]:
                            sys.exit("Pas d'intégration de projet sans intégration de personne")
                        args.append(f"--ficProj {metadonnees["fichier_données"][i]}")
            try:
                retour = subprocess.run(["python", "./integration_metadonnees.py"]+args, shell=True, capture_output=True, text=True, check=True)
                #éxécution du script en permettant de stocker la valeur de "retour"(les print)
                sys.exit(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
            except subprocess.CalledProcessError as e:
                with open(reponse, 'w', encoding="utf-8") as r:
                    json.dump({"réussite":False, "commentaire":f"La commande d'intégration des métadonnées a échoué avec le code d'erreur : {e.returncode}"}, r)
                print(reponse)
                #"Retour" de notre script si tout ne s'est pas bien passé
                #print(e.stderr)               #Si l'on veut voir tout le message d'erreur effectuer par le script défectueux
                #sys.exit(e.stdout)            #Si l'on veut voir tout les print effectuer par le script défectueux
        case "vérification_métadonnées":
            args = []
            for i in range(len(metadonnees["type_script"])):
                match metadonnees["type_script"][i]:
                    case "personne":
                        args.append(f"--ficPers {metadonnees["fichier_données"][i]}")
                    case "capteur":
                        args.append(f"--ficInstr {metadonnees["fichier_données"][i]}")
                    case "localisation":
                        args.append(f"--ficLoc {metadonnees["fichier_données"][i]}")
                    case "projet":
                        if "personne" not in metadonnees["type_script"]:
                            with open(reponse, 'w', encoding="utf-8") as r:
                                json.dump({"réussite":False, "commentaire":"Pas de vérification de projet sans vérification de personne"}, r)
                            sys.exit(reponse)
                        args.append(f"--ficProj {metadonnees["fichier_données"][i]}")
            try:
                retour = subprocess.run(["python", "./Base_de_donnees/verification_metadonnees.py"]+args, shell=True, capture_output=True, text=True, check=True)
                #éxécution du script en permettant de stocker la valeur de "retour"(les print)
                sys.exit(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
            except subprocess.CalledProcessError as e:
                with open(reponse, 'w', encoding="utf-8") as r:
                    json.dump({"réussite":False, "commentaire":f"La commande de vérification des métadonnées a échoué avec le code d'erreur : {e.returncode}"}, r)
                print(reponse)
                #"Retour" de notre script si tout ne s'est pas bien passé
                #print(e.stderr)               #Si l'on veut voir tout le message d'erreur effectuer par le script défectueux
                #sys.exit(e.stdout)            #Si l'on veut voir tout les print effectuer par le script défectueux

    