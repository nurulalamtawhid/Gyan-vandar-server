const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5001;




const app = express();

//middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@database1.wijxnwd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
 



/// function or middleware for jwt
function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    //console.log(authHeader);
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
   // console.log(token);
    
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
        if(err){
            return res.status(403).send({message:'forbidden'})
        }
        req.decoded = decoded;
        next();
    })


}


async function run() {
    try {
        //db colection declaration
        const booksCategoryCollection = client.db('gyan-vandar').collection('books-categories');
        const productsCollection = client.db('gyan-vandar').collection('products-collection');
        const bookingsCollection = client.db('gyan-vandar').collection('bookings')
        const usersCollection = client.db('gyan-vandar').collection('users-collection');
        const advertisedCollection = client.db('gyan-vandar').collection('advertise-collection');

        const verifyAdmin = async (req, res, next) => {

            const decodedEmail = req.decoded.email;
            //console.log(decodedEmail);
            const query = {
                email: decodedEmail
            };
            const user = await usersCollection.findOne(query);
            if (user?.power !== 'admin') {
                return res.status(403).send({ message: 'forbidden access4' })
            }

            next();

        }



        //categories collection get api frm db
        app.get('/bookscategories', async (req, res) => {
            const query = {};
            const options = await booksCategoryCollection.find(query).toArray();
            res.send(options);
        })
        //products collection
        app.get('/products/:name', async (req, res) => {
            const categoryname = req.params.name;
            // console.log(categoryname);
            const query = { categoryname };
            const options = await productsCollection.find(query).toArray();
            res.send(options);
        })
        //booking product to db
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // sorted booking insertion for only one book of one cateory
            const query = {
                email: booking.email,

                book: booking.book
            }
            //console.log(query);
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You have already booking on ${booking.book}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);

        });
        app.get('/bookings',verifyJWT,async(req,res) => {
            const email = req.query.email;
            //console.log('email', email);
            //console.log('token get', req.headers.authorization);         //api  - 1  

            const decodedEmail = req.decoded.email;
            //console.log(decodedEmail);
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
           // console.log('token', req.headers.authorization);
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        //jwt
        app.get('/jwt',async(req,res)=>{
            const email = req.query.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            //console.log(user);
            if(user){
                const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn : '1h'});
                return res.send({accessToken: token})
            }
           
            res.status(403).send({accessToken : ""})
        })
        /// my products from products collection
        app.get('/products',verifyJWT,async(req,res) => {
            const email = req.query.email;
           // const name =  req.query.sellername;
            console.log('email', email);
            

        const decodedEmail = req.decoded.email;
            //console.log(decodedEmail);
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
           // console.log('token', req.headers.authorization);
            const query = { email: email,
                                  
                          };
            const bookings = await productsCollection.find(query).toArray();
            res.send(bookings);
        })
      

        // users info Api start here add,get delete
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            //console.log(email);
            const query = { email };
            const user = await usersCollection.findOne(query);
            // console.log(user);
            res.send({ isAdmin: user?.power === 'admin' });

        })
           app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            //console.log(email);
            const query = { email };
            const user = await usersCollection.findOne(query);
            // console.log(user);
            res.send({ isSeller: user?.role === 'Seller' });

        })

        app.get('/users', async (req, res) => {
            const query = {
                role : "Buyer"
            };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.get('/users/seller',async(req,res)=>{
            const query = {
                role : "Seller"
            };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })
        //user save to databse from signup
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        ////  update as a admin api using user db
        app.put('/users/admin/:id',verifyJWT,verifyAdmin, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateddoc = {
                $set: {
                    power: 'admin'
                }

            }
            const result = await usersCollection.updateOne(filter, updateddoc, options);
            res.send(result);
        });
        // delete buyers
        app.delete('/users/:id',verifyJWT,verifyAdmin, async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
         })
        /// add products
        app.get('/categoriesselect', async(req,res)=>{
            const query ={};
            const result = await booksCategoryCollection.find(query).project({name :1}).toArray();
            res.send(result);
         })
         ///
         app.post('/products',verifyJWT, async(req,res)=>{
            const product = req.body;
            const result =await productsCollection.insertOne(product);
            res.send(result);
         }) 
         /// add to advertised
         app.put('/products/advertised/:id',verifyJWT, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateddoc = {
                $set: {
                    aadvertise: 'advertise'
                }

            }
            const result = await productsCollection.updateOne(filter, updateddoc, options);
            res.send(result);
        });


    }
    finally {

    }

}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send("Welcome to gyan_vandar_server ")
});
app.listen(port, () => console.log(`running on port${port}`))