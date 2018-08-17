'use strict';

const express = require('express');
const router = express.Router();
const Folder = require('../models/folder');
/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

  Folder
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
  Folder
    .findById(req.params.id)
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
/* ========== POST/CREATE A folder ========== */
router.post('/', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const newfolder = {
    name: name
  };

  Folder
    .create(newfolder)
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
          err = new Error('The folder name already exists');
          err.status = 400;
        }
        next(err);
      });
});

/* ========== PUT/UPDATE A SINGLE folder ========== */
router.put('/:id', (req, res, next) => {
  const folderId = req.params.id;
  const { name } = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err); // => Error handler
  }

  const updateObj = {
    name: name
  };

  Folder
    .findByIdAndUpdate(folderId, {$set: updateObj}, { new: true })
    .then(result => {
      if (result) {
        res.json(result); // => Client
      } else {
        next(); // => 404 handler
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE folder ========== */
router.delete('/:id', (req, res, next) => {
  Folder
    .findByIdAndRemove(req.params.id)
    .then(() => {
      // Respond with a 204 status
      res.sendStatus(204); // => Client
    })
    .catch(err => next(err)); // => Error handler
});

module.exports = router;