const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "post",
    database: "postgres"

});

client.connect();
console.log("\nconnexion exitosa\n");

/*client.query('\nSELECT * FROM categorie_variable\n',(err,res)=>{
    if(!err){
        console.log(res.rows)
    }
    else{
        console.log("\nNo sirvio tu mierda\n")
    }
})

*/
//Creacion de los endpoints 
app.get('api/')