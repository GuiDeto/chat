const MongoClient = require('mongodb').MongoClient

const state = {
  db: null,
}
// MongoClient Connection Method
exports.connect = (url, done) => {
  if (state.db) return done()

  MongoClient.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err, client)=> {
    if (err) return done(err)
    state.db = client.db('chat_sisc');
    done()
  })
}

exports.get = ()=> {
  return state.db
}

exports.close = (done)=> {
  if (state.db) {
    state.db.close((err, result)=> {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}