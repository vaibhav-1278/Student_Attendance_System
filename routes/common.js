var express = require("express");
var router = express.Router();
var exe = require("../mysql_conn");
router.get("/", function (req, res, next) {
    res.render("common/home.ejs");
});

router.get('/admin_login', function (req, res) {
    res.render('common/admin_login.ejs');
});
module.exports = router;