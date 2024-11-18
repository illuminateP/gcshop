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
        var sql2 = `select * from product;`;
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
                products: result,
                is_empty: is_empty,
                login: login,
                body: 'product.ejs',
                mode: 'modify',
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
        console.log('product.create');
        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`


        db.query(sql1 + sql2, (err, results) => {
            if (err) {
                console.log(err);
            }
            var { login, name, cls } = authIsOwner(req, res);
            var mode = 'create';
            var context = {
                who: name,
                login: login,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                mode: mode,
                body: 'productCU.ejs',
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

    create_process: (req, res, file) => {
        console.log('product.create_process');
        var post = req.body;

        var sanitize_category = sanitizehtml(post.category);

        var main_id = sanitize_category.substr(0, 4)
        var sub_id = sanitize_category.substr(4, 4)

        var sanitized_name = sanitizehtml(post.name);
        var sanitized_price = sanitizehtml(post.price);
        var sanitized_stock = sanitizehtml(post.stock);
        var sanitized_brand = sanitizehtml(post.brand);
        var sanitized_supplier = sanitizehtml(post.supplier);

        var sanitized_sale_yn = sanitizehtml(post.sale_yn);
        var sanitized_sale_price = parseInt(sanitizehtml(post.sale_price));

        if (file != undefined) { // 파일이 정의되었을 때만 public/ 제거 처리 수행
            var sanitized_file = file.path.replace(/^public/, '');; // static 경로로 public를 지정했으므로 경로상의 'public' 제거
            sanitized_file = sanitized_file.replace(/\\/g, '/');  // 백슬래시(\)를 슬래시(/)로 변경
        }
        else {
            sanitized_file = '/image/default.jpg' // 이미지를 업로드하지 않았을 때 사용할 default 이미지
        }


        db.query(`INSERT INTO product (main_id, sub_id, name, price, stock, brand, supplier, image, sale_yn, sale_price) values(?,?,?,?,?,?,?,?,?,?)`,
            [main_id, sub_id, sanitized_name, sanitized_price, sanitized_stock, sanitized_brand, sanitized_supplier, sanitized_file, sanitized_sale_yn, sanitized_sale_price], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
        res.redirect('/product/view');

    },

    update: (req, res) => {
        console.log('product.update');

        var merid = req.params.merId;
        var sanitized_merId = sanitizehtml(merid);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product where mer_id= '${sanitized_merId}';`;


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
                categorys: results[1] || [],
                mer: results[2],
                body: 'productCU.ejs',
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

    update_process: (req, res, file) => {
        console.log('product.update_process');

        var post = req.body;

        var sanitize_category = sanitizehtml(post.category);

        var main_id = sanitize_category.substr(0, 4)
        var sub_id = sanitize_category.substr(4, 4)

        var sanitized_merId = sanitizehtml(post.merId);
        var sanitized_name = sanitizehtml(post.name);
        var sanitized_price = sanitizehtml(post.price);
        var sanitized_stock = sanitizehtml(post.stock);
        var sanitized_brand = sanitizehtml(post.brand);
        var sanitized_supplier = sanitizehtml(post.supplier);


        if (file != undefined) { // 파일이 정의되었을 때만 public/ 제거 처리 수행
            var sanitized_file = file.path.replace(/^public/, '');; // static 경로로 public를 지정했으므로 경로상의 'public' 제거
            sanitized_file = sanitized_file.replace(/\\/g, '/');  // 백슬래시(\)를 슬래시(/)로 변경
        }
        else {
            sanitized_file = '/image/default.jpg' // 이미지를 업로드하지 않았을 때 사용할 default 이미지
        }


        var sanitized_sale_yn = sanitizehtml(post.sale_yn);
        var sanitized_sale_price = parseInt(sanitizehtml(post.sale_price));

        db.query(`UPDATE product SET main_id = ?, sub_id = ?, name = ?, price = ?, stock = ?, brand = ?, supplier = ?, image = ?, sale_yn = ? , sale_price = ? where mer_id = '${sanitized_merId}'`,
            [main_id, sub_id, sanitized_name, sanitized_price, sanitized_stock, sanitized_brand, sanitized_supplier, sanitized_file, sanitized_sale_yn, sanitized_sale_price], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });

        res.redirect('/product/view');

    },

    delete_process: (req, res) => {
        console.log('product.delete_process');
        var sanitized_merId = sanitizehtml(req.params.merId);

        db.query(`DELETE FROM product WHERE mer_id = '${sanitized_merId}'`, (error, result) => {
            if (error) {
                console.log(error);
            }
            res.writeHead(302, { location: `/product/view` });
            res.end();
        });
    },



}

