const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');

const graphqlSchema = require('./graphql/schema');
const graphqlResolvers = require('./graphql/resolvers');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_DB}/?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3000);
    })
    .catch(error => {
        console.log(error);
    });
