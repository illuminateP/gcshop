
var db = require('./db');
var sanitizehtml = require('sanitize-html');

function authIsOwner(req, res) {
    var name = 'Guest';
    var login = false;
    var cls = 'NON';
    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
    }
    return { name, login, cls }
}

module.exports = {
    login: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        db.query(sql1 + sql2, (error, results) => {
            var context = {
                who: name,
                login: login,
                body: 'login.ejs',
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                cls: cls
            };
            req.app.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.log(err);
                }
                res.end(html);
            });
        })

    },

    login_process: (req, res) => {
        var post = req.body;
        var sntzedLoginid = sanitizehtml(post.loginid);
        var sntzedPassword = sanitizehtml(post.password);

        db.query('select count(*) as num from person where loginid = ? and password = ?',
            [sntzedLoginid, sntzedPassword], (error, results) => {
                if (results[0].num == 1) {
                    db.query('select name, class, loginid, grade from person where loginid = ? and password = ?',
                        [sntzedLoginid, sntzedPassword], (error, result) => {
                            req.session.is_logined = true;
                            req.session.loginid = result[0].loginid;
                            req.session.name = result[0].name;
                            req.session.cls = result[0].class;
                            req.session.grade = result[0].grade;
                            res.redirect('/');
                        })
                }
                else {
                    req.session.is_logined = false;
                    req.session.name = 'Guest';
                    req.session.cls = 'NON';
                    res.redirect('/');
                }
            })
    },
    logout_process: (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/');
        })
    },

    register: (req, res) => {
        if (req.session.is_logined == true) {
            res.redirect('/');
            return; // 추가적인 코드 실행 방지
        }

        var { login, name, cls } = authIsOwner(req, res);
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        db.query(sql1 + sql2, (error, results) => {
            if (error) {
                console.log(error);
            }
            var context = {
                who: name,
                login: login,
                body: 'personCU.ejs',
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                mode: 'register',
                cls: cls
            };
            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.log(err);
                }
                res.end(html);
            });
        });


    },


    register_process: (req, res) => {
        console.log('/register_process')
        var post = req.body;
        var sanitized_id = sanitizehtml(post.loginid);
        var sanitized_password = sanitizehtml(post.password);
        var sanitized_name = sanitizehtml(post.name);
        var sanitized_address = sanitizehtml(post.address);
        var sanitized_tel = sanitizehtml(post.tel);
        var sanitized_birth = sanitizehtml(post.birth);
        var defaultClass = 'CST';
        var defaultGrade = 'C';

        db.query(`
            INSERT INTO person (loginid, password, name, address, tel, birth, class, grade) values(?,?,?,?,?,?,?,?)`,
            [sanitized_id, sanitized_password, sanitized_name, sanitized_address, sanitized_birth, sanitized_tel, defaultClass, defaultGrade], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
        res.redirect('/');
    },


}



