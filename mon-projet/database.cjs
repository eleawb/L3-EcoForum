const {Client} = require('pg')

const client = new Client({
    host : "localhost",
    user : "postgres",
    port : 5432,
    password : "post",
    database :"postgres"
});

client.connect();

client.query(`SELECT * FROM elemento`, (err,res)=>{
    if(!err){
        console.log(res.rows);
    }
    else{
        console.log(err.message);
    }
    client.end;
});
