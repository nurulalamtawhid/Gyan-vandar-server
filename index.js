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
        const productsCollection = client.db('gyan-vandar').collection('products-collection');
        const bookingsCollection = client.db('gyan-vandar').collection('bookings')
        const usersCollection = client.db('gyan-vandar').collection('users-collection');






        //categories collection get api frm db
        app.get('/bookscategories',async(req,res)=>{
            const query ={};
            const options = await booksCategoryCollection.find(query).toArray();
            res.send(options);
        })
        //products collection
        app.get('/products/:name',async(req,res)=>{
            const categoryname = req.params.name;
            console.log(categoryname);
            const query ={categoryname};
            const options = await productsCollection.find(query).toArray();
            res.send(options);
        })
        //booking product to db
        app.post('/bookings',async(req,res)=>{
            const booking = req.body;
            // sorted booking insertion for only one book of one cateory
            const query ={
                email : booking.email,
                 
                book : booking.book
            }
            console.log(query);
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message = `You have already booking on ${booking.book}`
                return res.send({acknowledged:false, message})
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);

        });
        app.get('/bookings', async(req,res)=>{      
            const email = req.query.email;           //api  - 1  
           // const decodedEmail = req.decoded.email;
           // console.log(decodedEmail);
            {/*if(email !== decodedEmail){
                return  res.status(403).send({message: 'forbidden access'})
            }*/}
           // console.log('token', req.headers.authorization); 
            const query ={email : email} ;
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);  
        })
        
     
        // users info Api start here add,get delete

        //user save to databse from signup
        app.post('/users',async(req,res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
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