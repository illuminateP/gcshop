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

        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        db.query(sql1 + sql2, (error, results) => {
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
                codes: result,
                categorys: result || [],
                is_empty: is_empty,
                login: login,
                body: 'code.ejs',
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

    create: (req, res) => {
        console.log('code.create');
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        db.query(sql1 + sql2, (err, results) => {
            var { login, name, cls } = authIsOwner(req, res);
            var mode = 'create';
            var context = {
                who: name,
                login: login,
                mode: mode,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                body: 'codeCU.ejs',
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
        console.log('/craete_process');
        var post = req.body;
        var sanitized_main_id = sanitizehtml(post.main_id);
        var sanitized_main_name = sanitizehtml(post.main_name);
        var sanitized_sub_id = sanitizehtml(post.sub_id);
        var sanitized_sub_name = sanitizehtml(post.sub_name);
        var sanitized_start = sanitizehtml(post.start);
        var sanitized_end = sanitizehtml(post.end);
        db.query(`INSERT INTO code (main_id, sub_id, main_name, sub_name, start, end) values(?,?,?,?,?,?)`,
            [sanitized_main_id, sanitized_sub_id, sanitized_main_name, sanitized_sub_name, sanitized_start, sanitized_end], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
        res.redirect('/code/view');

    },

    update: (req, res) => {
        console.log('code.update');

        var main_id = req.params.main;
        var sub_id = req.params.sub;
        var start = req.params.start;

        var sanitized_main_id = sanitizehtml(main_id);
        var sanitized_sub_id = sanitizehtml(sub_id);
        var sanitized_start = sanitizehtml(start);
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code where main_id = '${sanitized_main_id}' AND sub_id = '${sanitized_sub_id}' AND start = '${sanitized_start}';`
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
                body: 'codeCU.ejs',
                result: results[1],
                categorys: results[2] || [],
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
        console.log('code.update_process');

        var post = req.body;
        var sanitized_main_id = sanitizehtml(post.main_id);
        var sanitized_sub_id = sanitizehtml(post.sub_id);
        var sanitized_start = sanitizehtml(post.start);

        var sanitized_main_name = sanitizehtml(post.main_name);
        var sanitized_sub_name = sanitizehtml(post.sub_name);
        var sanitized_end = sanitizehtml(post.end);

        db.query(`UPDATE code SET main_name = ?, sub_name = ?, end = ? WHERE main_id = ? AND sub_id = ? AND start = ?`,
            [sanitized_main_name, sanitized_sub_name, sanitized_end, sanitized_main_id, sanitized_sub_id, sanitized_start],
            (err, result) => {
                if (err) {
                    console.log(err);
                }

                console.log(result);
            });
        res.redirect('/code/view');

    },

    delete_process: (req, res) => {
        console.log('code.delete_process');

        var main_id = req.params.main;
        var sub_id = req.params.sub;
        var start = req.params.start;

        var sanitized_main_id = sanitizehtml(main_id);
        var sanitized_sub_id = sanitizehtml(sub_id);
        var sanitized_start = sanitizehtml(start);

        db.query('DELETE FROM code WHERE main_id = ? AND sub_id = ? AND start = ? ', [sanitized_main_id, sanitized_sub_id, sanitized_start], (error, result) => {
            if (error) {
                console.log(error);
            }
            res.writeHead(302, { location: `/code/view` });
            res.end();
        });
    },



}

