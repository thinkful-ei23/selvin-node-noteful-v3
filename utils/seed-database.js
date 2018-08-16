'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const seedNotes = require('../db/seed/notes');
const seedFolder = require('../db/seed/folders');

mongoose.connect(MONGODB_URI)
  .then(() => mongoose.connection.db.dropDatabase())
  .then(() => {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolder),
      Folder.createIndexes(),
    ]);
  })
  .then(() => mongoose.disconnect())
  .catch(err => {
    console.error(err);
  });