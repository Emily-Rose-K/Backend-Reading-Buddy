const express = require('express');
const router = express.Router()

//const db = require('../../models')

const ReaderExperience = require('../models/ReaderExperience');
const Book = require('../models/Book');
const User = require('../models/User');

router.post('/', (req,res) => {
    ReaderExperience.findOne({book: req.body.book, user: req.body.user})
        .then(experience => {
            if (experience) {
                ReaderExperience.findOneAndUpdate({book: req.body.book, user:req.body.user}, {$set: {status: req.body.status}}, {new: true, runValidators: true})
                    .then(updatedExperience => {
                        console.log(`reader experience updated to ${updatedExperience.status}`)
                        res.send(updatedExperience)
                    })
                    .catch(err => {
                        res.send({error: `Error while updating experience in create readerexperience route: ${err}`})
                    })
            } else {
                ReaderExperience.create(req.body) 
                    .then(createdReaderExperience => {
                        Book.findOneAndUpdate({_id: createdReaderExperience.book}, {$push: {readerExperiences: createdReaderExperience._id}})
                        .then(bookUpdateResult => {
                            User.findOneAndUpdate({_id: createdReaderExperience.user}, {$push: {readerExperiences: createdReaderExperience._id}})
                            .then(userUpdateResult => {
                                res.send(createdReaderExperience)
                            })
                            .catch(err => {
                                res.send({error: `Error in readerExperiences create route adding experience id to user experience list: ${err}`})
                            })
                        })
                        .catch(err => {
                            res.send({error: `Error adding new user experience id to book readerExperience list: ${err}`});
                        })
                    })
                    .catch(err => {
                        res.send({error: `Error in readerExperience router Create method while creating readerExperience: ${err}`});
                    })
            }
        })
})

router.get('/', (req,res) => {
    ReaderExperience.findOne({book: req.query.book, user: req.query.user})
        .populate('book')
        .then(readerExperience => {
            console.log(`returning experience ${JSON.stringify(readerExperience)}`)
            res.send(readerExperience)
        })
        .catch(err => {
            res.send({error: `Error in readerExperience route Show method while finding experience: ${err}`})
        })
})

router.put('/:id', (req,res) => {
    console.log(`incoming id: ${req.params.id}`)
    ReaderExperience.findOneAndUpdate({_id: req.params.id}, {$set: req.body}, {new: true, runValidators: true})
        .then(updatedReaderExperience => {
            console.log(`🟣🟣🟣🟣 updated readerExperience: ${JSON.stringify(updatedReaderExperience)}`)
            res.send({updatedReaderExperience})
        })
        .catch(err => {
            res.send({error: `Error in readerExperience router Update method: ${err}`})
        })
})

module.exports = router;