const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
                .then(events => {
                    return events.map(event => {
                        return {
                            ...event._doc,
                            _id: event._doc._id.toString()
                        }
                    })
                })
                .catch(error => {
                    console.log(error)
                });
        },
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '62e9569b0ddd050007b20865'
            });

            let createdEvent;
            return event.save()
                // Save event
                .then(result => {
                    createdEvent = {
                        ...result._doc,
                        _id: result._doc._id.toString()
                    };

                    return User.findById('62e9569b0ddd050007b20865');
                })
                // Find user
                .then(user => {
                    if (!user) {
                        throw new Error('User not found.');
                    }

                    user.createdEvents.push(event);
                    return user.save();
                })
                // Update user
                .then(result => {
                    return createdEvent;
                })
                .catch(error => {
                    console.log(error);
                    throw error
                });
        },
        createUser: (args) => {

            return User.findOne({ email: args.userInput.email })
                .then(user => {
                    if (user) {
                        throw new Error('User exists already.');
                    }

                    return bcrypt.hash(args.userInput.password, 12)
                        // Hash password
                        .then(hashedPassword => {

                            const user = new User({
                                email: args.userInput.email,
                                password: hashedPassword
                            });

                            return user.save();

                        })
                        // Create user
                        .then(result => {
                            return {
                                ...result._doc,
                                password: null,
                                _id: result.id
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });

                });
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_DB}/?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3000);
    })
    .catch(error => {
        console.log(error);
    });
