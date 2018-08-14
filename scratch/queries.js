const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = 'Lady Gaga';
//     let filter = {};

//     if (searchTerm) {
//       filter.title = { $regex: searchTerm };
//     }

//     return Note.find(filter).sort({ updatedAt: 'desc' });
//   })
//   .then(results => {
//     console.log(results);
//   })
//   .then(() => {
//     return mongoose.disconnect()
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });
// //Find note by id using Note.findById
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchId = '000000000000000000000003';
//     let filter = {};
//     if (searchId) {
//       filter._id  = { _id: searchId };
//     }
//     return Note.findOne(filter);
//   })
// .then(results => {
//   console.log(results);
// })
// .then(() => {
//   return mongoose.disconnect()
// })
// .catch(err => {
//   console.error(`ERROR: ${err.message}`);
//   console.error(err);
// });
//Create a new note using Note.create
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const title = '24 Carat Cats';
//     const content = 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
//     let filter = {};
//     if(title && content)  {
//       filter = {title: title, content: content};
//     }
//     return Note.create(filter);
//   })
// .then(results => {
//   console.log(results);
// })
// .then(() => {
//   return mongoose.disconnect()
// })
// .catch(err => {
//   console.error(`ERROR: ${err.message}`);
//   console.error(err);
// });

//Update a note by id using Note.findByIdAndUpdate
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const id = '000000000000000000000006';
//     const title ='Cats should be U.N. Ambassadors';
//     const content = 'xoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxoxox';
//     let filter = {};
//     if(id && title && content)  {
//       filter.id = {_id : id};
//       filter.titleAndContent = {title: title, content: content};
//     }
//     return Note.findByIdAndUpdate(filter.id, filter.titleAndContent);
//   })
// .then(results => {
//   console.log(results);
// })
// .then(() => {
//   return mongoose.disconnect()
// })
// .catch(err => {
//   console.error(`ERROR: ${err.message}`);
//   console.error(err);
// });
//Delete a note by id using Note.findByIdAndRemove
mongoose.connect(MONGODB_URI)
  .then(() => {
    const id = '5b733a02fdb1402b284e72d3';
    let filter = {};
    if(id)  {
      filter.id = {_id : id};
    }
    return Note.findByIdAndRemove(filter.id);
  })
.then(results => {
  console.log(results);
})
.then(() => {
  return mongoose.disconnect()
})
.catch(err => {
  console.error(`ERROR: ${err.message}`);
  console.error(err);
});