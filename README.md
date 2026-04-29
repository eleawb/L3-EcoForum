# Projet L3 EcoForum

[Lien vers le drive du projet](https://drive.google.com/drive/folders/1pDWjVzZtVJSltq6X1iO6_A5gh6dT9goN)

## Nom des étudiants
- Aurore Minihot
- Éléa Weber
- Ernest Niederman
- Francisco Ernesto Suarez Roca
- Maeva Zerbib
- Oriane Roux

## Nom des encadrants
- Anne-Muriel Arigon
- Marine Zwicke
- Annie Chateau

Dans # package.json, explications des dépendences

voir s'il suffit de taper "npm run dependencies" et "devDependencies" pour installer les dépendences


TEST POUR SE CONNECTER A LA BDD ELEA AVEC DONNÉES SEMI FICTIVES (avant intégration de toutes les vraies données)
PUIS PLUS TARD POUR LA BDD TOUT COURT

avant tout, créez vous un fichier .env à la racine du projet et ajoutez : 
DB_USER=postgres
DB_PASSWORD=mdp
DB_HOST=localhost
DB_NAME=EcoforumV3

et modifiez avec postgres votre nom d'utilisateur sur pgAdmin, et mdp votre mdp pgAdmin
normalement .env est ajouté dans .gitignore pour ne pas que le fichier soit push dans le gitlab (sécurité)

ENSUITE :

- sur pgAdmin : créer une bdd vide EcoForumV3, clic droit, "restore" et choisir le fichier EcoForumV3.sql puis exécuter
- ligne de cmd : psql -U postgres -d EcoForumV3 -f EcoForumV3.sql

pour lancer le client et le serveur en simultané : lancer "npm run dev:all"



Carte des zones du campus avec instruments de mesure :
https://www.google.com/maps/d/u/1/viewer?ll=43.63208270185771%2C3.8634961583030103&z=17&mid=1zQxZ4ap-1xYahwCcU7LALE8AnQ5Dhs0

