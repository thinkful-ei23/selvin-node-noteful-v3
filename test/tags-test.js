'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');
const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;
chai.use(chaiHttp);
describe('Tags API', function() {

    // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `mongoose.connection.db.dropDatabase`,
  // `Tag.insertMany` and `mongoose.connection.db.dropDatabase` each return a promise,
  // so we return the value returned by these function calls.
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Tag.insertMany(seedTags),
    Tag.createIndexes();
    //add index
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function () {
    // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
    return Promise.all([
        Tag.find(),
        chai.request(app).get('/api/tags')
      ])
      // 3) then compare database results to API response
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
  });  

  describe('GET /api/tags/:id', function () {
    it('should respond with a 400 for an invalid Tag Id', function () {
       // The string "NOT-A-VALID-ID" is 14 bytes which is an invalid Mongo ObjectId
       // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
       return chai.request(app)
        .get('/api/tags/NOT-A-VALID-ID')
        .then(function(res) {
          console.info(`res.status: ${res.status}`);
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('message', 'status');
          expect(res.body.message).to.equal('Invalid Tag id');
        });    
    });    
    it('should return correct tag when given a valid id', function () {
      let data;
      // 1) First, call the database
      return Tag.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).get(`/api/tags/${data.id}`);
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

  describe('POST /api/tags', function () {
    it('should create and return a new tag when provided valid data', function () {
      const newItem = {
        'name': 'The Best Cat Tag Yet!',
      };
      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Tag.findById(res.body.id);
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


  describe('PUT /api/tags/:id', function () {
    // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
    it('should update the correct tag with valid input data', function () {
      const updateObject = {
        name : 'This is the New Tag Name'
      };
      let data;
      // 1) First, call the database
      return Tag.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).put(`/api/tags/${data.id}`)
            .send(updateObject);
        })
        // 2) then check API response
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
          // Retrieve the Tag by ID
          return Tag.findById(data.id);
        })
          // then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(new Date(data.createdAt));
          expect(new Date(res.body.updatedAt)).to.eql(new Date(data.updatedAt));
        });

    it('should should return a 400 if the name is omitted', function () {
      const updateObject = {
        name : ''
      };
      let data;
      // 1) First, call the database
      return Tag.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).put(`/api/tags/${data.id}`)
            .send(updateObject);
        })
        // 2) then check API response
        .then((res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.equal('{"status":400,"message":"Missing `name` in request body"}');
        });
    });
  });
  describe('DELETE /api/tags/:id', function () {
    it('should return a 204 from the successful DELETE', function () {
      // 1) First, call the database
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(204);
          return Tag.findById(data.id);
        })
        .then((res) => {
          expect(res).to.be.null;
        });
    });
  })

});
