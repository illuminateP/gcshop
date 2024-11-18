const board = require('./board');
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
    view: (req, res) => {
        console.log('person.view');
        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from person;`;
        var sql3 = `select * from code;`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            let is_empty = false;

            let result = results[1];

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }

            if (result.length == 0) {
                {
                    is_empty = true;
                }
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[2] || [],
                person: results[1],
                is_empty: is_empty,
                login: login,
                body: 'person.ejs',
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

    create: (req, res) => {
        console.log('person.create');
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        db.query(sql1 + sql2, (err, results) => {
            if(err){
                console.log(err);
            }

            var { login, name, cls } = authIsOwner(req, res);
            var mode = 'create';
            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                login: login,
                body: 'personCU.ejs',
                mode: mode,
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

    create_process: (req, res) => {
        console.log('person.craete_process');

        var post = req.body;
        var sanitized_login_id = sanitizehtml(post.loginid);
        var sanitized_password = sanitizehtml(post.password);
        var sanitized_name = sanitizehtml(post.name);
        var sanitized_address = sanitizehtml(post.address);
        var sanitized_tel = sanitizehtml(post.tel);
        var sanitized_birth = sanitizehtml(post.birth);
        var sanitized_class = sanitizehtml(post.class);
        var sanitized_grade = sanitizehtml(post.grade);

        db.query(
            `INSERT INTO person (loginid, password, name, address, tel, birth, class, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sanitized_login_id, sanitized_password, sanitized_name,
                sanitized_address, sanitized_tel, sanitized_birth,
                sanitized_class, sanitized_grade
            ], (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(result);
            });
        res.redirect('/person/view');
    },

    update: (req, res) => {
        console.log('person.update');

        var loginid = req.params.loginId;
        var sanitized_login_id = sanitizehtml(loginid);
        
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from person where loginid = '${sanitized_login_id}';`;
        var sql3 = `select * from code;`;

        db.query(sql1 + sql2 + sql3, (err, results) => {
            if (err) {
                console.log(err);
            }

            var { login, name, cls } = authIsOwner(req, res);
            var mode = 'update';

            var context = {
                who: name,
                login: login,
                mode: mode,
                boardtypes: results[0] || [],
                categorys: results[2] || [],
                per: results[1],
                body: 'personCU.ejs',
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

    update_process: (req, res) => {
        console.log('person.update_process');
        var post = req.body;
        var sanitized_login_id_current = sanitizehtml(post.currentloginid);
        var sanitized_login_id = sanitizehtml(post.loginid);
        var sanitized_password = sanitizehtml(post.password);
        var sanitized_name = sanitizehtml(post.name);
        var sanitized_address = sanitizehtml(post.address);
        var sanitized_tel = sanitizehtml(post.tel);
        var sanitized_birth = sanitizehtml(post.birth);
        var sanitized_class = sanitizehtml(post.class);
        var sanitized_grade = sanitizehtml(post.grade);

        db.query(`UPDATE person SET 
                loginid = ?, 
                password = ?, 
                name = ?, 
                address = ?, 
                tel = ?, 
                birth = ?, 
                class = ?, 
                grade = ? 
            WHERE loginid = ?`,
            [
                sanitized_login_id,
                sanitized_password,
                sanitized_name,
                sanitized_address,
                sanitized_tel,
                sanitized_birth,
                sanitized_class,
                sanitized_grade,
                sanitized_login_id_current
            ], (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(result);
            });
        res.redirect('/person/view');

    },

    delete_process: (req, res) => {
        console.log('person.delete_process');

        var loginId = req.params.loginId;
        var sanitized_login_id = sanitizehtml(loginId);

        db.query(`DELETE FROM person WHERE loginid = '${sanitized_login_id}'`, (error, result) => {
            if (error) {
                console.log(error);
            }
            console.log(result);
            res.writeHead(302, { location: `/person/view` });
            res.end();
        });
    },



}

