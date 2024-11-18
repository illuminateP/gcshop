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
    typeview: (req, res) => {
        console.log('board.typeview');
        var { login, name, cls } = authIsOwner(req, res);
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        db.query(sql1 + sql2, (error, results) => {
            var is_empty = false;

            let result = results[0];

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }

            if (error) {
                console.log(error);
            }
            if (result.length == 0) {
                {
                    var is_empty = true;
                }
            }

            var context = {
                who: name,
                is_empty: is_empty,
                boardtypes: result,
                categorys: results[1] || [],
                board: result,
                login: login,
                body: 'boardtype.ejs',
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

    typecreate: (req, res) => {
        console.log('board.typecreate');
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;


        db.query(sql1 + sql2, (err, results) => {
            var { login, name, cls } = authIsOwner(req, res);
            var mode = 'create';
            var context = {
                who: name,
                login: login,
                boardtypes: results[0] || [],
                categorys: results[1] || [], 
                body: 'boardtypeCU.ejs',
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

    typecreate_process: (req, res) => {
        console.log('board.craete_process(type)');

        var post = req.body;
        var sanitized_title = sanitizehtml(post.title);
        var sanitized_description = sanitizehtml(post.description);
        var sanitized_numPerPage = sanitizehtml(post.numPerPage);
        var sanitized_write_YN = sanitizehtml(post.write_YN);
        var sanitized_re_YN = sanitizehtml(post.re_YN);


        db.query(
            `INSERT INTO boardtype (title, description, write_YN, re_YN, numPerPage) VALUES (?, ?, ?, ?, ?)`,
            [
                sanitized_title,
                sanitized_description,
                sanitized_write_YN,
                sanitized_re_YN,
                sanitized_numPerPage
            ], (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(result);
            });
        res.redirect('/board/type/view');
    },

    typeupdate: (req, res) => {
        console.log('board.typeupdate');
        var typeid = req.params.typeId;
        var sanitized_type_id = sanitizehtml(typeid);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from boardtype where type_id = '${sanitized_type_id}';`;
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
                boardtype: results[1],
                categorys: results[2] || [],
                body: 'boardtypeCU.ejs',
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

    typeupdate_process: (req, res) => {
        console.log('board.typeupdate_process!');
        var post = req.body;

        var sanitized_type_id = sanitizehtml(post.type_id);
        var sanitized_title = sanitizehtml(post.title);
        var sanitized_description = sanitizehtml(post.description);
        var sanitized_numPerPage = sanitizehtml(post.numPerPage);
        var sanitized_write_YN = sanitizehtml(post.write_YN);
        var sanitized_re_YN = sanitizehtml(post.re_YN);

        db.query(`UPDATE boardtype SET 
            title = ?,
            description = ?,
            write_YN = ?,
            re_YN = ?,
            numPerPage = ?
            WHERE type_id = ?`,
            [
                sanitized_title,
                sanitized_description,
                sanitized_write_YN,
                sanitized_re_YN,
                sanitized_numPerPage,
                sanitized_type_id
            ], (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(result);
            });
        res.redirect('/board/type/view');

    },

    typedelete_process: (req, res) => {
        console.log('board.typedelete_process');

        var typeId = req.params.typeId;
        var sanitized_type_id = sanitizehtml(typeId);

        db.query(`DELETE FROM boardtype WHERE type_id = '${sanitized_type_id}'`, (error, result) => {
            if (error) {
                console.log(error);
            }

            console.log(result);
            res.writeHead(302, { location: `/board/type/view` });
            res.end();
        });
    },

    view: (req, res) => {
        console.log('board.view/:typeId/:pNum');

        var { name, login, cls } = authIsOwner(req, res);

        var sanitized_type_id = sanitizehtml(req.params.typeId);
        var pNum = req.params.pNum;

        var sql1 = `select * from boardtype;`; // results[0]
        var sql2 = `select * from boardtype where type_id = ${sanitized_type_id};` // results[1]
        var sql3 = `select count(*) as total from board where type_id = ${sanitized_type_id};` // results[2]
        var sql4 = `select * from code;`;

        db.query(sql1 + sql2 + sql3 + sql4, (error, results) => {
            /*******페이지 기능 구현 *********/
            var numPerPage = results[1][0].numPerPage;
            var offs = (pNum - 1) * numPerPage;
            var totalPages = Math.ceil(results[2][0].total / numPerPage);
            db.query(`select b.board_id as board_id, b.title as title, b.date as date, p.name as name
                          from board b inner join person p on b.loginid = p.loginid
                          where b.type_id = ? OR b.p_id = ? ORDER BY date desc, board_id desc LIMIT ? OFFSET ?`,
                [sanitized_type_id, 0, numPerPage, offs], (err, boards) => {
                    if (err) {
                        console.log(err);
                    }

                    
                    if (boards == undefined) {
                        boards = [] // 빈 배열의 길이를 읽는 경우를 방지
                    }

                    var is_empty = false;
                    if(boards.length == 0){
                        is_empty = true;
                    }
                    var context = {
                        who: name,
                        login: login,
                        boardtypes: results[0] || [],
                        categorys: results[3] || [],
                        board: boards, // 조회된 게시글 목록
                        is_empty: is_empty,
                        btname: results[1], // 선택한 boardtype 정보
                        totalPages: totalPages, // 전체 페이지 수
                        pNum: pNum, // 현재 페이지 번호
                        cls: cls,
                        body: 'board.ejs'
                    };

                    res.render('mainFrame', context, (err, html) => {
                        if (err) {
                            console.log(err);
                        }
                        res.end(html);
                    });
                });
        });
    },

    create: (req, res) => {
        console.log('board.create');
        var { name, login, cls } = authIsOwner(req, res);

        var sanitized_type_id = sanitizehtml(req.params.typeId);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from boardtype where type_id = ${sanitized_type_id};`
        var sql3 = `select * from code;`;

        var loginid = req.session.loginid;

        if (loginid == undefined) {
            loginid = 'NON'; // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }

        db.query(sql1 + sql2 + sql3, (err, results) => {
            if (err) {
                console.log(err);
            }

            var mode = 'create';
            var context = {
                who: name,
                login: login,
                boardtypes: results[0] || [],
                categorys: results[2] || [],
                board: results[1],
                login_id: loginid,
                mode: mode,
                body: 'boardCRU.ejs',
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
        console.log('board.create_process');

        var post = req.body;

        var sanitized_type_id = sanitizehtml(post.typeid);

        var sanitized_login_id = sanitizehtml(post.loginid);
        var sanitized_password = sanitizehtml(post.password);
        var sanitized_title = sanitizehtml(post.title);

        var sanitized_content = sanitizehtml(post.content);


        db.query(`INSERT INTO board (type_id, loginid, password, title, date, content) values(?,?,?,?, NOW(),?)`,
            [
                sanitized_type_id,
                sanitized_login_id,
                sanitized_password,
                sanitized_title,
                sanitized_content

            ], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
        res.redirect(`/board/view/${sanitized_type_id}/1`);

    },

    detail: (req, res) => {
        console.log('board.detail(:/boardId/:pNum');
        var { name, login, cls } = authIsOwner(req, res);

        var sanitized_boardid = sanitizehtml(req.params.boardId);
        var sanitized_pNum = sanitizehtml(req.params.pNum);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from board where board_id = ${sanitized_boardid};`
        var sql3 = `
        SELECT p.name as name
        FROM board b 
        INNER JOIN person p ON b.loginid = p.loginid
        WHERE b.board_id = ${sanitized_boardid};`;
        var sql4 = `select * from code;`;

        db.query(sql1 + sql2 + sql3 + sql4, (err, results) => {
            if (err) {
                console.log(err);
            }

            var writer = results[2][0].name;

            var loginid = req.session.loginid;

            if (loginid == undefined) {
                loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
            }

            var mode = 'read';
            var context = {
                who: name,
                login: login,
                loginid: loginid,
                boardtypes: results[0] || [],
                categorys: results[3] || [],
                board: results[1],
                writer: writer,
                pNum: sanitized_pNum,
                mode: mode,
                body: 'boardCRU.ejs',
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

    update: (req, res) => {
        console.log('board.update(:/boardId/:typeId/:pNum)');

        var { name, login, cls } = authIsOwner(req, res);

        var sanitized_boardid = sanitizehtml(req.params.boardId);
        var sanitized_type_id = sanitizehtml(req.params.typeId);
        var sanitized_pNum = sanitizehtml(req.params.pNum);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from board where board_id = ${sanitized_boardid};`
        var sql3 = `select * from boardtype where type_id = '${sanitized_type_id}';`; // title 추출용
        var sql4 = `select * from code;`;

        var loginid = req.session.loginid;

        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }



        db.query(sql1 + sql2 + sql3 + sql4, (err, results) => {
            if (err) {
                console.log(err);
            }

            var mode = 'update';
            var title = results[2][0].title

            var context = {
                who: name,
                login: login,
                login_id: loginid,
                boardtypes: results[0] || [],
                categorys: results[3] || [],
                boardid: sanitized_boardid,
                board: results[1],
                title: title,
                pNum: sanitized_pNum,
                mode: mode,
                body: 'boardCRU.ejs',
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
        console.log('board.update_process');

        var post = req.body;

        var sanitized_type_id = sanitizehtml(post.type_id);
        var sanitized_login_id = sanitizehtml(post.loginid);
        var sanitized_board_id = sanitizehtml(post.boardId);
        var sanitized_pNum = sanitizehtml(post.pNum);

        var sanitized_title = sanitizehtml(post.title);

        var sanitized_content = sanitizehtml(post.content);
        var sanitized_password = sanitizehtml(post.password);

        db.query(`select * from board where board_id = '${sanitized_board_id}'`, (err, results) => {
            if (err) {
                console.log(err);
            }
            let pw = results[0].password;
            var { login, name, cls } = authIsOwner(req, res);

            if (cls == 'MNG' || cls == 'CST' && sanitized_password == pw) {
                db.query(`UPDATE board 
                SET loginid =? , title = ?, date = NOW(), content = ?
                WHERE board_id = ?`,
                    [
                        sanitized_login_id,
                        sanitized_title,
                        sanitized_content,
                        sanitized_board_id
                    ], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                res.redirect(`/board/view/${sanitized_type_id}/${sanitized_pNum}`);
            }
            else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
        <script language="JavaScript" type="text/javascript">
            alert("비밀번호가 일치하지 않습니다.");
            setTimeout(() => {location.href = 'http://localhost:3000/board/view/${sanitized_type_id}/${sanitized_pNum}';
            }, 1000);
        </script>`);
            };
        });



    },

    delete_process: (req, res) => {
        console.log('board.delete_process');

        var { login, name, cls } = authIsOwner(req, res);
        var sanitized_board_id = sanitizehtml(req.params.boardId);
        var sanitized_type_id = sanitizehtml(req.params.typeId);
        var sanitized_pNum = sanitizehtml(req.params.pNum);

        db.query(`select * from board where board_id = '${sanitized_board_id}'`, (err, results) => {
            if (err) {
                console.log(err);
            }
            let pw = results[0].password;
            var { login, name, cls } = authIsOwner(req, res);

            if (cls == 'MNG' || name == results[0].loginid) {
                db.query(`DELETE FROM board WHERE board_id = '${sanitized_board_id}';`, (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                });
                res.writeHead(302, { location: `/board/view/${sanitized_type_id}/${sanitized_pNum}` });
                res.end();
            }
            else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
        <script language="JavaScript" type="text/javascript">
            alert("비밀번호가 일치하지 않습니다.");
            setTimeout(() => {location.href = 'http://localhost:3000/board/view/${sanitized_type_id}/${sanitized_pNum}';
            }, 1000);
        </script>`);
            };
        });




    },


}




