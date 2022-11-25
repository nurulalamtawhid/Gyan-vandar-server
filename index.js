const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5001;

require('dotenv').config();
const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@database1.wijxnwd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        //db colection declaration
        const booksCategoryCollection = client.db('gyan-vandar').collection('books-categories');






        //categories collection get api frm db
        app.get('/bookscategories',async(req,res)=>{
            const query ={};
            const options = await booksCategoryCollection.find(query).toArray();
            res.send(options);
        })
    }
    finally{

    }

}
run().catch(console.log);

app.get('/',(req,res)=>{
    res.send("Welcome to gyan_vandar_server ")
});
app.listen(port,()=>console.log(`running on port${port}`))