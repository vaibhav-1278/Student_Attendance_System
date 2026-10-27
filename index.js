var express  = require('express');
var bodyParser = require("body-parser");
var fileUpload = require("express-fileupload");
var session = require("express-session");
var bcrypt = require("bcrypt");
var jsonwebtoken = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var util = require("util");
require("dotenv").config();


var common_routes = require("./routes/common");
var admin_routes = require("./routes/admin");



var app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});
app.use(express.static("public"));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

app.use("/", common_routes);
app.use("/admin", admin_routes);

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started");
});