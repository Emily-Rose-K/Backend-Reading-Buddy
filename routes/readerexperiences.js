const express = require('express');
const router = express.Router()

//const db = require('../../models')

const ReaderExperience = require('../models/ReaderExperience');
const Book = require('../models/Book');
const User = require('../models/User');

router.post('/', (req,res) => {     // assumes req.body structure of {req.query: {title: XXX, author: XXX, etc}, req.body: {status: XXXX, user: XXX}}

    const createReaderExperience = (bookId) => {    // will be called later in the route, depending on whether the relevant Book is found or created
        req.body.book = bookId;
        ReaderExperience.create(req.body) 
        // may want to refactor later to make sure bookId&userId combo is unique, so that user doesn't accidentally review the same book twice
        .then(createdReaderExperience => {
            Book.findOneAndUpdate({_id: createdReaderExperience.book}, {$push: {readerExperiences: createdReaderExperience._id}})
            .then(bookUpdateResult => {
                User.findOneAndUpdate({_id: createdReaderExperience.user}, {$push: {readerExperiences: createdReaderExperience._id}})
                .then(userUpdateResult => {
                    res.send({createdReaderExperience})
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

    //Look for book with same api_id as new readerExperience's book.  If it doesn't exist, create it.  Return its id here,
    //then create the new readerExperience, then update the Book with the experience's ID, then associate the User with the experience, using the above function.
    Book.findOne({api_id: req.body.bookInfo.api_id})
        .select("_id")
        .then(foundBook => {
            if (foundBook){
                createReaderExperience(foundBook._id);
            } else {              
                Book.create(req.query)
                    .then(createdBook => {
                        createReaderExperience(createdBook._id);
                    })
                    .catch(err => { 
                        res.send({error: `Error in readerExperience route Create method while creating Book: ${err}`});
                    })
            }
        })
        .catch(err => { 
            res.send({error: `Error in readerExperience route Create method while finding Book: ${err}`})
        })
})

router.get('/:id', (req,res) => {
    ReaderExperience.findById(req.params.id)
        .populate('book')
        .then(readerExperience => {
            console.log(`🟣🟣🟣🟣 found user experience: ${JSON.stringify(readerExperience)}`)
            res.send(readerExperience)
        })
        .catch(err => {
            res.send({error: `Error in readerExperience route Show method while finding experience: ${err}`})
        })
})

router.put('/:id', (req,res) => {
    ReaderExperience.findOneAndUpdate(req.params.id, {$set: req.body}, {new: true, runValidators: true})
        .then(updatedReaderExperience => {
            res.send({updatedReaderExperience})
        })
        .catch(err => {
            res.send({error: `Error in readerExperience router Update method: ${err}`})
        })
})

module.exports = router;