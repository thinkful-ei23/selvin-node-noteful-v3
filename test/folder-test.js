'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);
describe('Folders API', function() {

    // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `mongoose.connection.db.dropDatabase`,
  // `Folder.insertMany` and `mongoose.connection.db.dropDatabase` each return a promise,
  // so we return the value returned by these function calls.
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function () {
    // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
    return Promise.all([
        Folder.find(),
        chai.request(app).get('/api/folders')
      ])
      // 3) then compare database results to API response
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
  });  

  describe('GET /api/folders/:id', function () {
    it('should return correct folder', function () {
      let data;
      // 1) First, call the database
      return Folder.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  })

  describe('POST /api/folders', function () {
    it('should create and return a new folder when provided valid data', function () {
      const newItem = {
        'name': 'The Biggest Cat Folder Yet!',
      };
      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/folders')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Folder.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
        });
    });
  });


//   describe('PUT /api/folders/:id', function () {
//     // 1) Call the database **and** the API
//     // 2) Wait for both promises to resolve using `Promise.all`
//     it('should update the correct folder with the input data', function () {
//       const updateObject = {
//         title : 'This is the New Title',
//         content : 'This is the new content'
//       };
//       let data;
//       // 1) First, call the database
//       return Folder.findOne()
//         .then(_data => {
//           data = _data;
//           // 2) then call the API with the ID
//           return chai.request(app).put(`/api/folders/${data.id}`)
//             .send(updateObject);
//         })
//         // 2) then check API response
//         .then((res) => {
//           expect(res).to.have.status(200);
//           expect(res).to.be.json;
//           expect(res.body).to.be.an('object');
//           expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
//           // Retrieve the Folder by ID
//           return Folder.findById(data.id);
//         })
//           // then compare database results to API response
//           expect(res.body.id).to.equal(data.id);
//           expect(res.body.title).to.equal(data.title);
//           expect(res.body.content).to.equal(data.content);
//           expect(new Date(res.body.createdAt)).to.eql(new Date(data.createdAt));
//           expect(new Date(res.body.updatedAt)).to.eql(new Date(data.updatedAt));
//         });

//     it('should should return a 400 if the title is omitted', function () {
//       const updateObject = {
//         title : '',
//         content : 'This is the new content'
//       };
//       let data;
//       // 1) First, call the database
//       return Folder.findOne()
//         .then(_data => {
//           data = _data;
//           // 2) then call the API with the ID
//           return chai.request(app).put(`/api/folders/${data.id}`)
//             .send(updateObject);
//         })
//         // 2) then check API response
//         .then((res) => {
//           expect(res).to.have.status(400);
//           expect(res.text).to.equal('{"status":400,"message":"Missing `title` in request body"}');
//         });
//     });
//   });
//   describe('DELETE /api/folders/:id', function () {
//     it('should return a 204', function () {
//       // 1) First, call the database
//       let data;
//       return Folder.findOne()
//         .then(_data => {
//           data = _data;
//           // 2) then call the API with the ID
//           return chai.request(app).delete(`/api/folders/${data.id}`);
//         })
//         .then((res) => {
//           expect(res).to.have.status(204);
//           return Folder.findById(data.id);
//         })
//         .then((res) => {
//           expect(res).to.be.null;
//         });
//     });
//   })

});
