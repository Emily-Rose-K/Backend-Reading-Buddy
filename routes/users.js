require('dotenv').config()
const express = require('express')
const router = express.Router()
//const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')

const User = require('../models/User')
const Book = require('../models/Book')
const ReaderExperience = require('../models/ReaderExperience')

router.get('/test', function(req, res) {
    res.json({msg: "Users route working"})
})

router.post('/register', (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return res.status(400).json({email: 'Email already exists'})
            } else {
                // const avatar = gravatar.url(req.body.email, {
                //     s: '200',
                //     r: 'pg',
                //     d: 'mm'
                // })
                const newUser = new User({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    user_name: req.body.user_name,
                    email: req.body.email,
                    password: req.body.password,
                    //avatar
                    
                })
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) {
                            throw err
                        }
                        newUser.password = hash
                        newUser.save()
                            //delete json send for security long term
                            .then(user => res.status(207).json(user))
                            .catch(err => console.log(err))
                    })
                })
            }
        })
})

router.post('/login', function(req, res) {
    console.log("⚛️in backend /users/login route");
    const email = req.body.email
    const password = req.body.password

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(400).json({ email: "User not found" })
            }
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        const payload = { id: user.id, first_name: user.fist_name, last_name: user.last_name, user_name: user.user_name }
                        jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 3600 }, (err, token) => {
                            res.json({ sucess: true, token: 'Bearer ' + token })
                        })
                    } else {
                        return res.status(400).json({ password: 'Password is incorrect.'})
                    }
                })
        })
})


router.get('/', (req,res) => {
    console.log("in users get route with req.query " + JSON.stringify(req.query));
    User.find(req.query)
        .then(searchResults => {
            res.send({searchResults})
        })
        .catch(err => {
            res.send({error: `Error searching user names: ${err}`})
        })
})

router.put('/:id/update', (req,res) => {
    if (req.query.remove) { // if we are removing a friend, PULL from friend list
        User.findOneAndUpdate({_id: req.params.id}, {$pull: {friends: req.body.friendId}})
            .then(updateResponse => {
                User.findOneAndUpdate({_id: req.body.friendId}, {$pull: {friends: req.params.id}})
                    .then(nextUpdateResponse => {
                        res.send({updateResponse})
                    })
                    .catch(error => {
                        res.send({error: `Error adding user to friend's friend list`})
                    })
            })
            .catch(error => {
                res.send({error: `Error adding friend to user's friend list: ${err}`});
            })
    } else { // if we are adding a friend, PUSH to friend list
        User.findOneAndUpdate({_id: req.params.id}, {$push: {friends: req.body.friendId}})
        .then(updateResponse => {
            User.findOneAndUpdate({_id: req.body.friendId}, {$push: {friends: req.params.id}})
                .then(nextUpdateResponse => {
                    res.send({updateResponse})
                })
                .catch(error => {
                    res.send({error: `Error adding user to friend's friend list`})
                })
        })
        .catch(error => {
            res.send({error: `Error adding friend to user's friend list: ${err}`});
        })
    }
})

router.get('/:id', (req, res) => {
    User.findOne({_id: req.params.id})
        .populate([
            {
                path: 'readerExperiences',
                model: 'ReaderExperience',
                populate: 'book'
            }, {
                path: 'friends'
            }
        ])
        .then(user => {
            console.log(JSON.stringify(user));
            res.send({user})
        })
        .catch(err => {
            res.send({error: `Error getting user: ${err}`});
        })
})    

/*  
    /users/:id returns an object with this structure:
    {
        _id: blah,
        first_name: blah,
        last_name: blah,
        user_name: blah,
        email: blah,
        friends: [                  // a list of your friends' user objects
            {
                _id: blah,
                first_name: blah,
                last_name: blah,
                user_name: blah,
                email: blah,
            }
        ],
        readerExperiences: [        // a list of your readerExperiences
            {
                _id: blah, 
                rating: blah,
                review: blah,
                status: "wishlist" or "started" or "finished"
                date_started: some date,
                date_finished: some date,
                book: {             // the book this experience is about
                    _id: blah       // the id of the book in the database
                    api_id: blah,   // the ISBN of the book
                    title: blah,
                    author: blah,
                    genre: blah,
                    image_url: blah,
                    description: blah,
                    readerExperiences: [ a list of ids of all the other readerExperience for this book]

                }
            }
        ]
        }
    }

*/

module.exports = router