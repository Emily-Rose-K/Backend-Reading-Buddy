require('dotenv').config()
const express = require('express')
const router = express.Router()
//const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')

// load User model
const User = require('../models/User')
const Book = require('../models/Book')
const ReaderExperience = require('../models/ReaderExperience')
console.log(`⁉️This is Model: ${ReaderExperience}`);

//API ROUTES
//user test route
router.get('/test', function(req, res) {
    res.json({msg: "Users route working"})
})
//Get a user by id for profiles
/*
const populateExperiences = (idList, experienceList, user) => {
    if (idList.length === 0) {
        user.readerExperiences = experienceList;
        res.send({user});
        return experienceList;
    } else {
        console.log(`About to pluck off experience ${idList[0]}`)
        ReaderExperience.find({_id: idList.shift()})
            .then(thisExperience => {
                console.log(`found experience ${JSON.stringify(thisExperience)}`);
                experienceList.push(thisExperience);
                populateExperiences(idList, experienceList, user);
            })
            .catch(err => {
                console.log(`Error in populateExperiences: ${err}`);
            })
    }
}

router.get('/:id', (req, res) => {
    User.findOne({_id: req.params.id})
        .populate('friends')
        .then(user => {
            console.log(`passing ${user.readerExperiences} to populateExperiences`);
            populateExperiences(user.readerExperiences, [], user);
        })
        .catch(err => {
            console.log(`Error in alternate user/:id route: ${err}`);
        })
})
*/

//GET route to handle registration
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
    console.log("In users.js get /:id method")
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
            res.send({user})
        })
        .catch(err => {
            res.send({error: `Error getting user: ${err}`});
        })
})    
   
    /*  
        /users/:id returns an object with this structure:
        {
            _id: blah,                  // the id of the user whose information is below
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
                    _id: blah,          // the id of this readerExperience
                    rating: blah,
                    review: blah,
                    status: "wishlist" or "started" or "finished"
                    date_started: some date,
                    date_finished: some date,
                    book: {             // the book this experience is about
                        _id: blah       // the id of the book in the database
                        api_id: blah,   // the id of the book on Google Books
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




//GET log people in and check their credentials against existing User data
//GET if already logged in, set user data to current
module.exports = router