const config = require("config");
const mongoose = require("mongoose");

const { host, username, password, database, port } = config.get("mongo");

const conn = `mongodb://${username}:${password}@${host}:${port}/${database}`;

console.log(conn);

try {
  mongoose.connect(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
} catch (e) {
  console.log('CONNECTION ERROR : ', e);
}

module.exports = mongoose;
