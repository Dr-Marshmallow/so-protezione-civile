const { MongoClient } = require('mongodb')
const config = require('../config')

let client
let db

async function initMongo() {
  if (db) return db
  client = new MongoClient(config.mongo.uri, {
    maxPoolSize: 10
  })
  await client.connect()
  db = client.db(config.mongo.dbName)

  const collection = db.collection(config.mongo.collectionChiamate)
  await collection.createIndex({ uniqueKey: 1 }, { unique: true })
  await collection.createIndex({ stato: 1 })
  await collection.createIndex({ dataChiamata: 1 })
  await collection.createIndex({ conclusaAt: 1 })
  await collection.createIndex({ nonPiuNecessarioAt: 1 })
  await collection.createIndex({ presaInCaricoAt: 1 })

  return db
}

function getCollection() {
  if (!db) {
    throw new Error('MongoDB not initialized')
  }
  return db.collection(config.mongo.collectionChiamate)
}

async function closeMongo() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}

module.exports = {
  initMongo,
  getCollection,
  closeMongo
}
