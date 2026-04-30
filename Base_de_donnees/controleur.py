import os
import sys
import subprocess
import json

def meta(choixScript, type_fichiers, fichiers):
    """
    Fonction qui permet d'appeler les script selon si c'est l'intégration ou la 
    vérification d'un ou plus fichier de métadonnées
    @param choixScript : string, savoir si c'est l'intégration ou la vérification
    @param type_fichiers : liste de string, ce à quoi corrrespond chacun des fichiers
    @param fichiers : liste de string, tout les fichiers de métadonnées à insérer
    """
    if "inte" in choixScript:
        choixScript = "integration"
    else:
        choixScript = "verification"
    args = []
    for i in range(len(type_fichiers)):
        match type_fichiers[i]:
            case "personne":
                args.append(f"--ficPers {fichiers[i]}")
            case "capteur":
                args.append(f"--ficInstr {fichiers[i]}")
            case "localisation":
                args.append("--ficLoc")
                args.append(fichiers[i])
            case "projet":
                if "personne" not in type_fichiers:
                    sys.exit(json.dumps({"reussite":False, "commentaire":f"Pas de {choixScript} de projet sans {choixScript} de personne"}))
                args.append(f"--ficProj {fichiers[i]}")
    try:
        retour = subprocess.run(["python", f"./{choixScript}_metadonnees.py"]+args, shell=True, capture_output=True, text=True, check=True)
        #Exécution du script en permettant de stocker la valeur de "retour"(les print)
        print(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
    except subprocess.CalledProcessError as e:
        print(json.dumps({"reussite":False, "commentaire":f"La commande de {choixScript} des metadonnees a echoue avec le code d'erreur : {e.returncode}"}))
        #"Retour" de notre script si tout ne s'est pas bien passé
        #print(e.stderr)               #Si l'on veut voir tout le message d'erreur effectuer par le script défectueux
        #sys.exit(e.stdout)            #Si l'on veut voir tout les print effectuer par le script défectueux


def nonMeta(choixScript, instrument, metaJson, cheminFichierMesure):
    """
    Fonction qui permet d'appeler les script selon si c'est l'intégration ou la 
    vérification d'un fichier de mesure
    @param choixScript : string, savoir si c'est l'intégration ou la vérification
    @param instrument : string, l'instrument concerné par le fichier de mesure
    @param metaJson : string, l'argument que l'on va passer au script d'intégration/vérification
    @param metaJson : string, le chemin du fichier de mesure pour le supprimer si la réponse du script est négative
    """
    try:
        retour = subprocess.run(["python", "./Base_de_donnees/"+choixScript+"_donnees_"+instrument.lower()+".py", metaJson], shell=True, capture_output=True, text=True, check=True)
        #éxécution du script en permettant de stocker la valeur de "retour"(les print)
        #print(retour.stdout)           #"Retour" de notre script si tout s'est bien passé
        retJson = json.loads(retour.stdout)
        if not retJson["reussite"]:
            try:
                os.remove(cheminFichierMesure)
                retJson["commentaire"] += " et la suppression de la copie du fichier a marche"
            except (FileNotFoundError, PermissionError) as e:
                retJson["commentaire"] += " et la suppression de la copie du fichier n'a pas marche"
        print(json.dumps(retJson))
    except subprocess.CalledProcessError as e:
        #"Retour" de notre script si tout ne s'est pas bien passé
        try:
            os.remove(cheminFichierMesure)
            print(json.dumps({"reussite":False, "commentaire":f"La commande de {choixScript} des donnees a echoue avec le code d'erreur : {e.returncode} mais la copie du fichier a bien pu etre supprimer"}))
        except (FileNotFoundError, PermissionError):
            print(json.dumps({"reussite":False, "commentaire":f"La commande de {choixScript} des donnees a echoue avec le code d'erreur : {e.returncode} et la copie du fichier n'a pas pu etre supprimer"}))
        
        #print(e.stderr)            #Si l'on veut voir le message d'erreur effectuer par le script défectueux
        #print(e.stdout)            #Si l'on veut voir les print effectuer par le script défectueux jusqu'au moment de l'erreur


if __name__ == "__main__":

    if len(sys.argv)!=2:     #Vérification du nombre d'arguments
        sys.exit(json.dumps({"reussite":False, "commentaire":"Usage : python ./controleur.py metadonnees.json"}) )

    arg = sys.argv[1]    # Argument, le chemin du fichier de métadonnées, exemple : r".\Base_de_donnees\metadonnees.json"

    with open(arg, encoding="utf-8") as f:
        metadonnees = json.load(f)                 #Ouverture du json
        if "metadonnees" in metadonnees["script"]:
            meta(metadonnees["script"], metadonnees["type_script"], metadonnees["fichier_donnees"])
        else:
            if metadonnees["nom_outil"].lower() in ["tms4", "dendrometre", "thermologger"]:
                metadonnees["nom_outil"] = "tomst"
            nonMeta(metadonnees["script"], metadonnees["nom_outil"], arg, metadonnees["chemin_source"])