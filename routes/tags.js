'use strict';

const express = require('express');
const router = express.Router();
const Tag = require('../models/tag');
const Note = require('../models/note');
const ObjectId = require('mongoose').Types.ObjectId;
/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  Tag
  .find()  
  .sort({name: 'asc'})
  .then(results => {
    if (results) {
      res.json(results);
    } else{
      next(); //=>404 handler
    }
  })
  .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid Tag id');
    err.status = 400;
    return next(err); // => Error handler
  }
  Tag
    .findById(id)
    .then(result => {
      if (result) {
        res.json(result).status(200); // => Client
      } else {
        err.status = 404;
        return next(err); // => Error handler
     // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== POST/CREATE AN ITEM ========== */
/* ========== POST/CREATE A tag ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newtag = {
    name: name
  };

  Tag
    .create(newtag)
    .then(result => {
      if (result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => {
        if (err.code === 11000) {
          err = new Error('The tag name already exists');
          err.status = 400;
        }
        next(err);
      });
});

/* ========== PUT/UPDATE A SINGLE tag ========== */
router.put('/:id', (req, res, next) => {
  const tagId = req.params.id;
  const { name } = req.body;
  if (!ObjectId.isValid(tagId)) {
    const err = new Error('Invalid Tag id');
    err.status = 400;
    return next(err); // => Error handler
  }
  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = {
    name: name
  };

  Tag
    .findByIdAndUpdate(tagId, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result).status(200); // => Client
      } else {
        err.status = 404;
        return next(err); // => Error handler
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE tag ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    const err = new Error('Invalid Tag id');
    err.status = 400;
    return next(err); // => Error handler
  }
  Note.updateMany({ $pull: { tags: id }})
    .then(() => {
      return Tag.findByIdAndRemove(id);
    })  
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;