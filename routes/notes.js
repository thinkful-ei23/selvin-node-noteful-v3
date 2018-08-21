'use strict';

const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const ObjectId = require('mongoose').Types.ObjectId;
/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  const {searchTerm, folderId, tagId }  = req.query;
  let filter = {};
  if (searchTerm) {
    filter.title = { $regex: searchTerm, $options: 'i' };
  }
  if (folderId) {
    filter.folderId = folderId;
  }
  if (tagId) {
    filter.tags = tagId;
    //Note.find({ tags: tagId })
  }

  Note
  .find(filter)  
  .populate('tags')
  .sort({ updatedAt: 'desc' })
    .then(results => {
    if (results) {
      res.json(results);
    } else {
      next(); //=>404 handler
    }
  })
  .catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  Note
    .findById(req.params.id)
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== POST/CREATE AN ITEM ========== */
/* ========== POST/CREATE A NOTE ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }
  if (folderId && !ObjectId.isValid(folderId)) {
    const err = new Error('The `folderId` is invalid!');
    err.status = 400;
    return next(err); // => Error handler
  }
  if (tags) {
    tags.forEach((tag) => {
      if (!ObjectId.isValid(tag)) {
        const err = new Error('The `tagId` is invalid');
        err.status = 400;
        return next(err); // => Error handler
      }
    });
  }

  const newNote = {
    title: title,
    content: content,
    folderId: folderId,
    tags: tags
  };

  Note
    .create(newNote)
    .then(result => {
      if (result) {
        res.location(`http://${req.originalUrl}/${result.id}`)
          .status(201)
          .json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== PUT/UPDATE A SINGLE NOTE ========== */
router.put('/:id', (req, res, next) => {
  const { id, title, content, folderId, tags } = req.body;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }
  if (folderId && !ObjectId.isValid(folderId)) {
    const err = new Error('`folderId` is not a valid Mongo ObjectId');
    err.status = 400;
    return next(err); // => Error handler
  }
  if (tags) {
    tags.forEach((tag) => {
      if (!ObjectId.isValid(tag)) {
        const err = new Error('The `tagId` is invalid');
        err.status = 400;
        return next(err); // => Error handler
      }
    });
  }
  const updateObj = {
    title: title,
    content: content
  };

  Note
    .findByIdAndUpdate(id, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => next(err)); // => Error handler
});

/* ========== DELETE/REMOVE A SINGLE NOTE ========== */
router.delete('/:id', (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    const err = new Error('Invalid id');
    err.status = 400;
    return next(err); // => Error handler
  }
  Note
    .findByIdAndRemove(req.params.id)
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;'use strict';