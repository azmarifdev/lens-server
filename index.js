const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config();
require('colors');
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// secret key with MongoClient
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zh0amk9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

// jwt token
function verifyJWT(req, res, next) {
    authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'Unauthorize access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Unauthorize access' });
        }
        req.decoded = decoded;
        next();
    });
}

// main function
async function run() {
    try {
        await client.connect();
        console.log('database connected'.yellow.bold);
    } catch (error) {
        console.log(
            error.name.red.bold,
            error.message.blue.bold,
            error.stack.gray.bold,
        );
        res.send({
            success: false,
            error: error.message,
        });
    }
}
run();

// mongoDB Collection
const Services = client.db('services').collection('photo');
const Reviews = client.db('services').collection('review');

// services post
app.post('/services', async (req, res) => {
    try {
        const service = await Services.insertOne(req.body);
        if (service.insertedId) {
            res.send({
                success: true,
                message: `successfully created the ${req.body.name} with ${service.insertedId}`,
            });
        } else {
            res.send({
                success: false,
                error: "couldn't create the service",
            });
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.bold);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// get limit
app.get('/service', async (req, res) => {
    try {
        const cursor = Services.find({}).limit(3);
        const services = await cursor.toArray();

        res.send({
            success: true,
            message: 'successfully got the data',
            services: services,
        });
    } catch (error) {
        console.log(error.name.bgRed, error.message.bold);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// get all
app.get('/services', async (req, res) => {
    try {
        const cursor = Services.find({});
        const services = await cursor.toArray();

        res.send({
            success: true,
            message: 'successfully got the data',
            services: services,
        });
    } catch (error) {
        console.log(error.name.bgRed, error.message.bold);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// get by id
app.get('/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Services.findOne({ _id: ObjectId(id) });
        res.send({
            success: true,
            service: service,
        });
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// post review for
app.post('/reviews', async (req, res) => {
    try {
        const reviews = await Reviews.insertOne(req.body);
        if (reviews.insertedId) {
            res.send({
                success: true,
                message: `successfully created the ${req.body.name} with ${reviews.insertedId}`,
            });
        } else {
            res.send({
                success: false,
                error: "couldn't create the service",
            });
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// get by id for service all review

app.get('/reviews', async (req, res) => {
    try {
        let query = {};
        if (req.query.reviewId) {
            query = {
                serviceId: req.query.reviewId,
            };
        }
        console.log(query);
        const cursor = Reviews.find(query).sort({ $natural: -1 });
        const reviews = await cursor.toArray();
        res.send({
            success: true,
            message: 'successfully got the data',
            reviews: reviews,
        });
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// get jwt

app.get('/myreview', verifyJWT, async (req, res) => {
    try {
        const decoded = req.decoded;
        console.log(decoded);
        if (decoded.email !== req.query.email) {
            return res.status(403).send({ message: 'Unauthorize access' });
        }
        let query = {};
        if (req.query.email) {
            query = {
                email: req.query.email,
            };
        }
        console.log(query);
        const cursor = Reviews.find(query).sort({ $natural: -1 });
        const myReview = await cursor.toArray();
        res.send({
            success: true,
            message: 'successfully got the data',
            reviews: myReview,
        });
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// post jwt

app.post('/jwt', async (req, res) => {
    try {
        const user = req.body;
        var token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '10h',
        });
        res.send({ token });
    } catch (error) {
        console.log(error.message);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// delete item

app.delete('/myreview/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const result = await Reviews.deleteOne({ _id: ObjectId(id) });
        if (result.deletedCount) {
            res.send(result);
        } else {
            res.send({
                success: false,
                error: `review not deleted`,
            });
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.bold);
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// patch

app.patch('/myreview/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Reviews.updateOne(
            { _id: ObjectId(id) },
            { $set: req.body },
        );
        // modifiedCount
        if (result.matchedCount) {
            res.send({
                success: true,
                message: `successfully updated ${req.body.name}`,
            });
        } else {
            res.send({
                success: false,
                error: "couldn't update the review",
            });
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

// find review
app.get('/reviewupdate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Reviews.findOne({ _id: ObjectId(id) });
        res.send({
            success: true,
            review: review,
        });
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        });
    }
});

app.get('/', (req, res) => {
    res.send('Database running');
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`.magenta.bold);
});
