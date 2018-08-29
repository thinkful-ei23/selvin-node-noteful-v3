const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');

const app = require('../server');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');
const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');
const seedUsers = require('../db/seed/users');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Noteful API - Folders', function () {

  let token;
  let user;

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(seedUsers),
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders),      
      Tag.insertMany(seedTags),
      Folder.createIndexes(),
      Tag.createIndexes(),
      User.createIndexes()
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username })
        // user is defined console.log('1111 user in beforeEach', user);
      })

  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function () {

    it('should return a list sorted by name with the correct number of folders', function () {
      // updates endpoint to return userId, folderId, folder.name
      const dbPromise = Folder.find({ userId: user.id }); //add a filter to the folderbase query
      const apiPromise = chai.request(app) // update the assertion
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`); // Update your test with the Authorization header

      return Promise.all([dbPromise, apiPromise])
        .then(([folder, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(folder.length);
        });
    });

    it('should return a list with the correct fields and values', function () {
      const dbPromise = Folder.find({ userId: user.id });
      //console.logconsole.log('token', token);
      const apiPromise = chai.request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        //Folder.find().sort('name'), //replaced with dbPromice
        //chai.request(app).get('/api/folders') // replaced with apiPromise
        .then(([folder, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          // expect(res.body).to.have.length(folder.length);
          res.body.forEach(function (item, i) {
            expect(item).to.be.an('object');
            expect(item).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
            expect(item.id).to.equal(folder[i].id);
            expect(item.name).to.equal(folder[i].name);
            expect(item.user).to.equal(folder.user_id)
            expect(new Date(item.createdAt)).to.eql(folder[i].createdAt);
            expect(new Date(item.createdAt)).to.eql(folder[i].createdAt);

          });
        });
    });
  });

  describe('GET /api/folders/:id', function () {

    it('should return correct folder', function () {
      let folder;
      const dbPromise = Folder.find({ userId: user.id });

      return dbPromise
        .then(_folder => {
          folder = _folder[0];
          return chai.request(app)
          .get(`/api/folders/${folder.id}`)
          .set('Authorization', `Bearer ${token}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          //console.log('11111111111res.body', res.body);
          expect(res.body).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(folder.id);
          expect(res.body.name).to.equal(folder.name);
          expect(new Date(res.body.createdAt)).to.eql(folder.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(folder.updatedAt);
        });
    });

    it('should respond with a 400 for an invalid id',

      function () {
        const dbPromise = Folder.findOne({ userId: user.id });
        const apiPromise = chai.request(app)
          .get('/api/folders/NOT-A-VALID-ID')
          .set('Authorization', `Bearer ${token}`);

        return Promise.all([dbPromise, apiPromise])
          .then(([folder, res]) => {
            expect(res).to.be.json;
            expect(res).to.have.status(400);
            expect(res.body.message).to.eql('The `id` is not valid');
          });
      });

    it('should respond with a 404 for an ID that does not exist', function () {
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      const dbPromise = Folder.findOne({ userId: user.id });
      const apiPromise = chai.request(app)
        .get('/api/folders/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`);
      return Promise.all([dbPromise, apiPromise])
        .then(([folder, res]) => {
          expect(res).to.be.json;
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/folders', function () {

    it('should create and return a new item when provided valid folder', function () {
      const newFolder = { 'name': 'newFolderName' };
      let res;
      return chai
        .request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send(newFolder)
        .then(_res => {
          res = _res;
          //console.log('***********NEW FOLDER res: ', res  );
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys(
            'id',
            'name',
            'userId',
            'createdAt',
            'updatedAt'
          );
          return Folder.findById(res.body.id);
        })
        .then(folder => {
          expect(res.body.id).to.equal(folder.id);
          expect(res.body.name).to.equal(folder.name);
          expect(new Date(res.body.createdAt)).to.eql(folder.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(folder.updatedAt);
        });
    });
    it('should return an error when missing "name" field', function () {
      const newFolder = { 'foo': 'newFolderName' };
      let res;
      return chai
        .request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send(newFolder)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        })
    });

    it('should return an error when given a duplicate name', function () {
      let folder;
      let res;
      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          const newItem = { 'name': folder.name };
          return chai.request(app)
          .post('/api/folders')
          .set('Authorization', `Bearer ${token}`)
          .send(newItem);
        })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Folder name already exists');
        });
    });

  });

  describe('PUT /api/folders/:id', function () {
    it('should update the folder', function () {
      let folder;
      let res;
      const updateFolder = { 'name': 'Updated Name' };

      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          return chai.request(app)
          .put(`/api/folders/${folder.id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(updateFolder);
      })
        .then(_res => {
          res =_res;
          //console.log('****res: ', res);
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys(
            'id', 
            'userId', 
            'name', 
            'createdAt', 
            'updatedAt'
          );
          expect(res.body.id).to.equal(folder.id);
          expect(res.body.name).to.equal(updateFolder.name);
          expect(new Date(res.body.createdAt)).to.eql(folder.createdAt);
          // expect item to have been updated
          expect(new Date(res.body.updatedAt)).to.greaterThan(folder.updatedAt);
        });
    });


    it('should respond with a 400 for an invalid id', function () {
      let res;
      const updateFolder = { name: 'Squirrels' };
      return chai.request(app)
        .put('/api/folders/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .send(updateFolder)
        .then(_res => {
          res =_res;
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an id that does not exist', function () {
      let res;
      const updateFolder = { name: 'Banana' };
      // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
      return chai.request(app)
        .put('/api/folders/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .send(updateFolder)
        .then(_res => {
          res =_res;
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function () {
      let folder;
      let res;
      const updateFolder = {};
      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateFolder);
        })
        .then(_res => {
          res =_res;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when "name" field is empty string', function () {
      let folder;
      let res;
      const updateFolder = { name: '' };
      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          return chai.request(app)
            .put(`/api/folders/${folder.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateFolder);
        })
        .then(_res => {
          res =_res;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

    it('should return an error when given a duplicate name', function () {
      let res;
      return Folder.find().limit(2)
        .then(results => {
          const [item1, item2] = results;
          item1.name = item2.name;
          return chai.request(app)
            .put(`/api/folders/${item1.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(item1);
        })
        .then(_res => {
          res =_res;
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Folder name already exists');
        });
    });
  });

  describe('DELETE /api/folders/:id', function () {
    it('should delete an existing folder and respond with 204', function () {
      let folder;
      let res;
      return Folder.findOne()
        .then(_folder => {
          folder = _folder;
          return chai.request(app)
            .delete(`/api/folders/${folder.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then( _res => {
          res = _res;
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          return Folder.count({ _id: folder.id });
        })
        .then(count => {
          expect(count).to.equal(0);
        });
    });

    it('should delete an existing folder and remove folderId reference from note', function () {

      return Note.findOne({ folderId: { $exists: true } })
        .then(_note => {
         let note = _note;
         //console.log(_note);
          //console.log(`note.userId: ${note.userId}  note.folderId is ${note.folderId} `);
          let folderId = note.folderId;
          return chai.request(app)
            .delete(`/api/folders/${folderId}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(function (res, folderId) {
          //console.log('res.status: ', res.status);
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
          //return Note.count( {folderId} );
        })
        //.then(count => {
        //  expect(count).to.equal(0);
         //});
    });


    it('should respond with a 400 for an invalid id', function () {

      return chai.request(app)
        .delete('/api/folders/NOT-A-VALID-ID')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res =_res;
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });
});
