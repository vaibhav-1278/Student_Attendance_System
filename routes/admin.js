var express = require("express");
var router = express.Router();
var exe = require("../mysql_conn");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var session = require("express-session");

var cookieParser = require("cookie-parser");
    router.use(session({
        secret: "secretkey",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 60000 }
    }));
router.use(cookieParser());
router.get("/admin_login",async function (req, res) {
  res.render("admin/admin_login.ejs");
});

// router.get("/", function (req, res) {
//   res.send("Admin Dashboard");
// });


router.post("/login_admin", async function (req, res) {
  var d = req.body;
  var sql = "SELECT * FROM admin WHERE admin_email = ?";
  var data =await exe(sql, [d.admin_email]);
// res.send(data)
// bcrypt.genSalt(10, function (err, salt) {
//     bcrypt.hash(d.admin_password, salt, async function (err, hash) {
//         res.send(hash);
//     });
// });
  if (data.length > 0) {
        var hash = data[0].admin_password;
        bcrypt.compare(d.admin_password, hash, function(err, result) {
            if (result) {
                var token = jwt.sign(
                    { "token": d.admin_email },
                    "secretkey",
                    { expiresIn: "40m" }
                );
                res.cookie("token", token); 
                req.session.admin_id = data[0].admin_id;
                res.redirect("/admin/dashboard");
            } else {
                res.send("Invalid password");
            }    
        });
    } else {
        res.send("Invalid email");
    }



});

//Dashbord Working Start
router.get('/dashboard',async function(req,res){
    var sql = `SELECT COUNT(*) AS total_students,
                  COUNT(DISTINCT student_class) AS total_classes
           FROM students`;

var data = await exe(sql);

var sql2 = `SELECT * FROM attendance INNER JOIN students ON attendance.student_id = students.student_id
           ORDER BY attendance.created_at DESC
           LIMIT 10`;
var recent_attendance = await exe(sql2);
    res.render('admin/dashboard.ejs',{total_students:data[0].total_students,total_classes:data[0].total_classes,recent_attendance:recent_attendance});
})  


router.get('/student_register',function(req,res){
    res.render('admin/student_register.ejs');
});
router.post('/register_student', async function(req,res){
    var d = req.body;
    var sql = "INSERT INTO students (student_name,student_roll_no,student_class,student_email,student_phone,student_address,face_descriptor) VALUES (?,?,?,?,?,?,?)";
    await exe(sql,[d.student_name,d.student_roll_no,d.student_class,d.student_email,d.student_phone,d.student_address,d.face_descriptor]);
    res.redirect('/admin/student_register');
});

router.get('/student_list', async function(req,res){
    var sql = "SELECT * FROM students";
    var data = await exe(sql);
    res.render('admin/student_list.ejs',{data:data});
}    
);

router.get('/edit_student/:id', async function(req,res){
    var id = req.params.id;
    var sql = "SELECT * FROM students WHERE student_id = ?";
    var data = await exe(sql,[id]);
    res.render('admin/edit_student.ejs',{student:data[0]});
}    
);

router.post('/update_student', async function(req,res){
    var d = req.body;
    var sql = "UPDATE students SET student_name = ?, student_roll_no = ?,student_class = ?, student_email = ?, student_phone = ?, student_address = ? WHERE student_id = ?";
    await exe(sql,[d.student_name,d.student_roll_no,d.student_class,d.student_email,d.student_phone,d.student_address,d.student_id]);
    res.redirect('/admin/student_list');
});

router.get('/delete_student/:id', async function(req,res){
    var id = req.params.id;
    var sql = "DELETE FROM students WHERE student_id = ?";
    await exe(sql,[id]);
    res.redirect('/admin/student_list');
});

// Take Attendance page
router.get('/take_attendance', async function(req, res) {
    var classes = await exe("SELECT DISTINCT student_class FROM students");
    var selectedClass = req.query.student_class;
    var attendance_date = req.query.attendance_date;
    var data = [];

    if (selectedClass && attendance_date) {
        var sql = `SELECT students.*,
                   attendance.status AS attendance_status
                   FROM students
                   LEFT JOIN attendance
                   ON students.student_id = attendance.student_id
                   AND attendance.attendance_date = ?
                   WHERE students.student_class = ?`;
        data = await exe(sql, [attendance_date, selectedClass]);
    }

    res.render('admin/take_attendance.ejs', {
        data: data,
        classes: classes,
        selected_class: selectedClass,
        attendance_date: attendance_date
    });
});

//save absent student
router.post('/save_attendance',async function(req,res){
    var d= req.body;
    var sql = `INSERT INTO attendance(student_id,attendance_date,status)VALUES (?,?,?)`;
    await exe(sql,[d.student_id,d.attendance_date,d.status]);
    res.redirect('/admin/take_attendance?student_class=' + d.student_class + '&attendance_date=' + d.attendance_date);
})

router.post('/verify_face', async function(req, res) {
    var d = req.body;

    var sql = "SELECT face_descriptor FROM students WHERE student_id = ?";
    var data = await exe(sql, [d.student_id]);

    var registered = JSON.parse(data[0].face_descriptor);
    var captured = d.face_descriptor;
    var sum = 0;

    for (var i = 0; i < 128; i++) {
        sum += Math.pow(captured[i] - registered[i], 2);
    }

    var distance = Math.sqrt(sum);

    if (distance < 0.6) {
        var sql = "INSERT INTO attendance(student_id, attendance_date, status) VALUES (?,?,?)";
        await exe(sql, [d.student_id, d.attendance_date, "Present"]);

        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});


router.get('/attendance_records', async function(req, res) {

    var classes = await exe("SELECT DISTINCT student_class FROM students");

    var selectedClass = req.query.student_class;
    var attendance_date = req.query.attendance_date;
    var data = [];

    if(selectedClass && attendance_date) {

        var sql = `SELECT * FROM attendance
        INNER JOIN students
        ON attendance.student_id = students.student_id
        WHERE students.student_class = ?
        AND attendance.attendance_date = ?
        ORDER BY students.student_roll_no ASC`;

        data = await exe(sql, [selectedClass, attendance_date]);

    } 
    else if(selectedClass) {

        var sql = `SELECT * FROM attendance
        INNER JOIN students
        ON attendance.student_id = students.student_id
        WHERE students.student_class = ?
        ORDER BY attendance.attendance_date ASC`;

        data = await exe(sql, [selectedClass]);

    } 
    else if(attendance_date) {

        var sql = `SELECT * FROM attendance
        INNER JOIN students
        ON attendance.student_id = students.student_id
        WHERE attendance.attendance_date = ?
        ORDER BY attendance.attendance_date DESC`;

        data = await exe(sql, [attendance_date]);

    } 
    else {

        var sql = `SELECT * FROM attendance
        INNER JOIN students
        ON attendance.student_id = students.student_id
        ORDER BY attendance.attendance_date DESC`;

        data = await exe(sql);

    }

    res.render('admin/attendance_records.ejs', {
        data: data,
        classes: classes,
        selected_class: selectedClass,
        attendance_date: attendance_date
    });

});

router.get('/admin_logout',function(req,res){
    res.clearCookie('token');
    req.session.destroy();
    res.redirect('/');
});


module.exports = router;