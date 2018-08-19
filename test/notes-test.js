'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);
describe('Notes API', function() {

    // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `mongoose.connection.db.dropDatabase`,
  // `Note.insertMany` and `mongoose.connection.db.dropDatabase` each return a promise,
  // so we return the value returned by these function calls.
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),
      Tag.insertMany(seedTags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ]);
   });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {
    it('should return correct number of notes', function () {

        // 1) Call the database **and** the API
      // 2) Wait for both promises to resolve using `Promise.all`
      return Promise.all([
          Note.find(),
          chai.request(app).get('/api/notes')
        ])
        // 3) then compare database results to API response
          .then(([data, res]) => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('array');
            expect(res.body).to.have.length(data.length);
          });
    });
  });  
  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      let validTags = ['breed', 'domestic', 'hybrid', 'feral'];
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect (res.body.folderId).to.equal(data.folderId + '');
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.tags).to.be.an('array');
          //for (let i = 0; i < res.tags.length; i++) {
          //  expect(validTags).to.contain(res.tags[i].name);
          //}
        });
    });
  })

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'folderId': '111111111111111111111100',  
        'tags' : ['222222222222222222222200','222222222222222222222202']    
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(res.body.folderId).to.equal(data.folderId + '');
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });

  describe('PUT /api/notes/:id', function () {
    // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
    it('should update the correct note with the input data', function () {
      const updateObject = {
        title : 'This is a New and Improved Title',
        content : 'This is some content',
        folderId : '111111111111111111111100',
        tags: ["222222222222222222222200", "222222222222222222222201", "222222222222222222222202"]
      };
      let res;
      // 1) First, call the database
      return Note
        .findOne()
        .then(function(note) {
          updateObject.id = note.id;
          return chai.request(app)
            .put(`/api/notes/${note.id}`)
            .send(updateObject);
        })
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'folderId', 'tags', 'createdAt', 'updatedAt');
          expect(res.body).to.deep.equal(
            Object.assign(updateObject, ({
              id: res.body.id,
              createdAt: res.body.createdAt,
              updatedAt: res.body.updatedAt
            }))
          );

          return Note.findById(updateObject.id);
        })
        .then(function(data) {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.folderId).to.equal(data.folderId + '');
        });

    });
    it('should should return a 400 if the title is omitted', function () {
      const updateObject = {
        title : '',
        content : 'This is the new content',
        folderId : '111111111111111111111100',
        tags: ["222222222222222222222200", "222222222222222222222201", "222222222222222222222202"]
      };
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).put(`/api/notes/${data.id}`)
            .send(updateObject);
        })
        // 2) then check API response
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
    it('should should return a 400 if the folderId is invalid', function () {
      const updateObject = {
        title : 'Some Other Title',
        content : 'This is more content',
        folderId : 'NOT-A-VALID-FOLDER'
      };
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).put(`/api/notes/${data.id}`)
            .send(updateObject);
        })
        // 2) then check API response
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('`folderId` is not a valid Mongo ObjectId');
        });
    });
  });
  describe('DELETE /api/notes/:id', function () {
    it('should delete a note and return a 204', function () {
      // 1) First, call the database
      let data;
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).delete(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Note.findById(data.id);
        })
        .then((res) => {
          expect(res).to.be.null;
        });
    });
    it('should return a 400 error when given an invalid id', function() {
      return chai.request(app)
        .delete('/api/notes/NOT-A-VALID-ID')
        .then(function(res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid id');
        });
    });

  })

});
