const express = require('express');
const router = express.Router();

const readerExperience = require("../models/ReaderExperience");
const Book = require("../models/Book");
const User = require("../models/User");

const BIG_OL_LIST = require('../seed2.js');

router.get('/', (req, res) => {
    Book.find({title: { $regex: req.query.title, $options: 'i' }, author: { $regex: req.query.author, $options: 'i'}})
        .limit(10)
        .then(books => {
            console.log(`🔵🔵🔵🔵 Book search successful.  books: ${JSON.stringify(books)}`)
            res.send({books})
        })
        .catch(err => {
            console.log(`🔴🔴🔴🔴 error in book search: ${JSON.stringify(err)}`)
        })
})

router.get("/:id", (req,res) => {
    Book.findById(req.params.id)
        .populate([
            {
                path: 'readerExperiences',
                model: 'ReaderExperience',
                populate: 'user'
            }
        ])
        .then(bookInfo => {
            console.log(`Sending response: ${JSON.stringify(bookInfo)}`)
            res.send({bookInfo});
        })
        .catch(err => {
            res.send({error: `Error in books controller show route: ${err}`});
        })
})

// only use for seeding db
router.post("/", (req, res) => {
    // format list so we can insert it with a single Mongoose create() call.
    BIG_OL_LIST_FOR_MONGOOSE = BIG_OL_LIST.map(book => {
        // I think this sort of isbn number always has 10 digits, 
        // and our seed file sometimes leaves out initial zeros, 
        // so we need to put them in in order for openlibrary API to work
        while ( book[2].length < 10 ) {
            book[2] = `0${book[2]}`;
        }
        return {title: book[0], author: book[1], api_id: book[2]}
    })
    console.log(`🔴🔴🔴🔴🔴 ${JSON.stringify(BIG_OL_LIST_FOR_MONGOOSE[0])}`);
    Book.find({title: BIG_OL_LIST_FOR_MONGOOSE[0].title})
        .then(foundBook => {
            if (foundBook.title) {
                console.log(`Seeding aborted - the database may be already seeded: ${foundBook}`)
            } else {
                Book.create(BIG_OL_LIST_FOR_MONGOOSE)
                    .then(result => {
                        res.send(`Database seeded.  Db response: ${JSON.stringify(result)}`);
                    })
                    .catch(err => {
                        res.send(`error seeding database: ${err}`)
                    })
            }
        })
        .catch(err => {
            console.log(`error determining whether database was previously seeded: ${err}`)
        })
})

module.exports = router;