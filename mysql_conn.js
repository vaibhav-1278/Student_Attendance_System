
var mysql = require("mysql2");
var util = require("util");
require("dotenv").config();

var conn = mysql.createConnection({
    host: process.env.HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD
});

conn.connect(function (err) {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("Database connected successfully");
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
