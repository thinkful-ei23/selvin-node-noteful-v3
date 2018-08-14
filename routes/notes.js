'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  mongoose.connect(MONGODB_URI)
  .then(() => {
    // const searchTerm = 'odio.';
    // let filter = {};

    // if (searchTerm) {
    //   filter = { $or:[
    //     {title:  { $regex: searchTerm }}, 
    //     {content:{ $regex: searchTerm }}
    //   ]};
    // }
  return Note.find().sort({_id: 'asc'});
  })

  .then(results => {
    res.json(results);
    console.log(results);
  })
  .then(() => {
    return mongoose.disconnect()
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });

});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

  console.log('Get a Note');
  //Find note by id using Note.findById
  mongoose.connect(MONGODB_URI)
  .then(() => {
    const searchId = req.params.id;

    let filter = {};
    if (searchId) {
      filter._id  = { _id: searchId };
    }
    return Note.findOne(filter);
  })
  .then(results => {
  res.json(results);
  })
  .then(() => {
  return mongoose.disconnect()
  })
  .catch(err => {
  console.error(`ERROR: ${err.message}`);
  console.error(err);
  });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content } = req.body;
  console.log('Create a Note');
  mongoose.connect(MONGODB_URI)
    .then(() => {
      let filter = {};
      if(title && content)  {
        filter = {title: title, content: content};
      }
      return Note.create(filter);
    })
  .then(results => {
    res.json(results);
  })
  .then(() => {
    return mongoose.disconnect()
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
    mongoose.connect(MONGODB_URI)
    .then(() => {
      let filter = {};
      if(id && title && content)  {
        filter.id = {_id : id};
        filter.titleAndContent = {title: title, content: content};
      }
      return Note.findByIdAndUpdate(filter.id, filter.titleAndContent);
    })
  .then(results => {
    res.json(results);
  })
  .then(() => {
    return mongoose.disconnect()
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const  { id } = req.params; 
  console.log('Delete a Note');
  mongoose.connect(MONGODB_URI)
  .then(() => {
    let filter = {};
    if(id)  {
      filter.id = {_id : id};
    }
    return Note.findByIdAndRemove(filter.id);
  })
  .then(results => {
    res.status(204).end();
  })
  .then(() => {
    return mongoose.disconnect()
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
});

module.exports = router;