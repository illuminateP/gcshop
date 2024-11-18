const db = require('./db');
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
    home: (req, res) => {
        console.log('root.home');
        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product;`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }
            var is_empty = false;

            let result = results[2] // product

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }

            if (result.length == 0) {
                {
                    var is_empty = true;
                }
            }

            var context = {
                who: name,
                categorys: results[1] || [], // 결과가 undefined면 빈 배열 대입
                boardtypes: results[0] || [], 
                products: result,
                is_empty: is_empty,
                login: login,
                body: 'product.ejs',
                mode: 'view',
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

    categoryview: (req, res) => {
        var categ = req.params.categ;
        var sanitize_category = sanitizehtml(categ);
        console.log('root.categoryview(/category/:categ)');
        var { login, name, cls } = authIsOwner(req, res);

        var main_id = sanitize_category.substr(0, 4)
        var sub_id = sanitize_category.substr(4, 4)

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product where main_id = '${main_id}' and sub_id = '${sub_id}';`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }
            var is_empty = false;

            let result = results[2];

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
                categorys: results[1] || [],
                boardtypes: results[0] || [],
                products: result,
                is_empty: is_empty,
                login: login,
                body: 'product.ejs',
                mode: 'view',
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

    search: (req, res) => {
        console.log('root.search');
        var { login, name, cls } = authIsOwner(req, res);

        let body = req.body;

        if (body == undefined) {
            body = {}
            body.search = '' // 빈 배열을 비교하는 경우를 방지
        }

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product where name like '%${body.search}%' or brand like '%${body.search}%' or supplier like '%${body.search}%';`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }
            var is_empty = false;

            let result = results[2]; // product에 대한 검색 결과가 없는 빈 경우

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
                categorys: results[1] || [],
                boardtypes: results[0] || [],
                products: result,
                is_empty: is_empty,
                login: login,
                body: 'product.ejs',
                mode: 'view',
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

    detail: (req, res) => {
        console.log('root.detail(/detail/:merId)')
        var merId = req.params.merId;
        var { login, name, cls } = authIsOwner(req, res);

        var sanitized_merId = sanitizehtml(merId);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product where mer_id = '${sanitized_merId};'`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                product: results[2],
                login: login,
                body: 'productDetail.ejs',
                mode: 'view',
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

    cartview: (req, res) => {
        console.log('root.cartview')
        var { login, name, cls } = authIsOwner(req, res);

        let loginid = req.session.loginid;
        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }
        var sanitized_login_id = sanitizehtml(loginid);


        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `SELECT 
                    c.cart_id, 
                    c.mer_id, 
                    p.name AS product_name, 
                    per.loginid, 
                    per.name AS customer_name, 
                    c.date
                    FROM 
                        cart c
                    INNER JOIN 
                        product p ON c.mer_id = p.mer_id
                    INNER JOIN 
                        person per ON c.loginid = per.loginid;`;
        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }


            let is_empty = false;

            let result;
            result = results[2];

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }

            if (result.length == 0) {
                is_empty = true;
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                carts: result,
                is_empty: is_empty,
                login: login,
                body: 'cartView.ejs',
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

    cartupdate: (req, res) => {
        console.log('root.cartupdate(/cartupdate/:cartId)');
        var { login, name, cls } = authIsOwner(req, res);

        var sanitized_cart_id = sanitizehtml(req.params.cartId);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from cart where cart_id = '${sanitized_cart_id}';`;
        var sql4 = `SELECT 
            p.name AS product_name
        FROM 
            cart c
        INNER JOIN 
            product p ON c.mer_id = p.mer_id
        WHERE 
            c.cart_id = '${sanitized_cart_id}';`;
        // cart 테이블에서 sanitized_cart_id의 merId 값을 가져와 product 테이블에서 해당 mer_id의 제품명을 받아오는 query

        var sql5 = `
        SELECT p.name AS customer_name
        FROM person AS p
        JOIN cart AS c ON p.loginid = c.loginid
        WHERE c.cart_id = '${sanitized_cart_id}';`; // cart 테이블에서 santized_cart_id의 loginid 값을 가져와 person 테이블에서 해당 loginid의 사용자명 추출

        var sql6 = `select * from product;`; // product 선택 옵션 추출
        var sql7 = `select * from person;`; // customer 선택 옵션 추출



        db.query(sql1 + sql2 + sql3 + sql4 + sql5 + sql6 + sql7, (error, results) => {
            if (error) {
                console.log(error);
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                cart: results[2],
                productname: results[3][0].product_name,
                products: results[5],
                customers: results[6],
                customername: results[4][0].customer_name,
                login: login,
                body: 'cartU.ejs',
                cls: cls
            };

            console.log(results);
            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.log(err);
                }
                res.end(html);
            });
        });
    },

    cartupdate_process: (req, res) => {
        var post = req.body;
        var sanitized_cart_id = sanitizehtml(post.cartId);
        var sanitized_mer_id = sanitizehtml(post.product);
        var sanitized_login_id = sanitizehtml(post.customer);

        db.query(
            'UPDATE cart SET loginid = ?, mer_id = ?, date = NOW() WHERE cart_id = ?',
            [sanitized_login_id, sanitized_mer_id, sanitized_cart_id],
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                res.redirect('/cartview');
            }
        );
    },

    cartdelete_process: (req, res) => {
        console.log('cart.cartdelete_process(/cartdelete/:cartId)');
        sanitized_cart_id = sanitizehtml(req.params.cartId);

        db.query(`DELETE FROM cart WHERE cart_id = '${sanitized_cart_id}'`, (error, result) => {
            if (error) {
                console.log(error);
            }
            res.redirect('/cartview');
        });
    },

    purchaseview: (req, res) => {
        console.log('root.purchaseview')
        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `SELECT 
                    pch.*, 
                    prd.name AS product_name, 
                    per.name AS customer_name
                    FROM 
                        purchase AS pch
                    LEFT JOIN 
                        product AS prd ON pch.mer_id = prd.mer_id
                    LEFT JOIN 
                        person AS per ON pch.loginid = per.loginid;`;
        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            let is_empty = false;

            let result = results[2];

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }

            if (result.length == 0) {
                is_empty = true;
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                purchases: result,
                is_empty: is_empty,
                login: login,
                body: 'purchaseView.ejs',
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

    purchaseupdate: (req, res) => {
        console.log('root.purchaseupdate(/purchaeupdate/:purchaseId)');

        var { login, name, cls } = authIsOwner(req, res);

        var sanitized_purchase_id = sanitizehtml(req.params.purchaseId);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from purchase where purchase_id = '${sanitized_purchase_id}';`;
        var sql4 = `
        SELECT 
            p.name AS product_name
        FROM 
            purchase pch
        INNER JOIN 
            product p ON pch.mer_id = p.mer_id
        WHERE 
            pch.purchase_id = '${sanitized_purchase_id}';`;
        // purchase 테이블에서 sanitized_purchase_id 의 merId 값을 가져와 product 테이블에서 해당 mer_id의 제품명을 받아오는 query

        var sql5 = `
        SELECT p.name AS customer_name
        FROM person AS p
        JOIN purchase AS pch ON p.loginid = pch.loginid
        WHERE pch.purchase_id = '${sanitized_purchase_id}';`;
        var sql6 = `select * from product;`; // product 선택 옵션 추출
        var sql7 = `select * from person;`; // customer 선택 옵션 추출



        db.query(sql1 + sql2 + sql3 + sql4 + sql5 + sql6 + sql7, (error, results) => {
            if (error) {
                console.log(error);
            }

            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                purchase: results[2],
                productname: results[3][0].product_name,
                products: results[5],
                customers: results[6],
                customername: results[4][0].customer_name,
                login: login,
                body: 'purchaseU.ejs',
                cls: cls
            };

            console.log(results);
            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    console.log(err);
                }
                res.end(html);
            });
        });
    },

    purchaseupdate_process: (req, res) => {
        var post = req.body;

        var sanitized_purchase_id = sanitizehtml(post.purchaseId);

        var sanitized_login_id = sanitizehtml(post.customer);
        var sanitized_mer_id = sanitizehtml(post.product);

        var sanitized_price = sanitizehtml(post.price);

        var sanitized_point = sanitizehtml(post.point);
        var sanitized_qty = sanitizehtml(post.qty);

        var sanitized_total = sanitizehtml(post.total);

        var sanitized_payYN = sanitizehtml(post.payYN);
        var sanitized_cancel = sanitizehtml(post.cancel);

        var sanitized_refund = sanitizehtml(post.refund);

        db.query(
            `UPDATE purchase 
             SET loginid = ?, mer_id = ?, price = ?, point = ?, qty = ?, total = ?, payYN = ?, cancel = ?, refund = ?, date = NOW() 
             WHERE purchase_id = ?`,
            [
                sanitized_login_id,
                sanitized_mer_id,
                sanitized_price,
                sanitized_point,
                sanitized_qty,
                sanitized_total,
                sanitized_payYN,
                sanitized_cancel,
                sanitized_refund,
                sanitized_purchase_id,
            ],
            (err, results) => {
                if (err) {
                    console.log(err);
                }
                res.redirect('/purchaseview');
            }
        );
    },

    purchasedelete_process: (req, res) => {
        console.log('purchase.purchasedelete_process(/purchasedelete/:purchaseId)');
        sanitized_purchase_id = sanitizehtml(req.params.purchaseId);

        db.query(`DELETE FROM purchase WHERE purchase_id = '${sanitized_purchase_id}'`, (error, result) => {
            if (error) {
                console.log(error);
            }
            res.redirect('/purchaseview');
        });
    },

    table: (req, res) => {
        console.log('root.table');

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `SELECT * 
                    FROM INFORMATION_SCHEMA.TABLES
                    where
                    table_schema = 'webdb2024';`

        db.query(sql1 + sql2 + sql3, (err, results) => {
            if(err){
                console.log(err);
            }
            
            var { login, name, cls } = authIsOwner(req, res);

            let is_empty = false;

            let result = results[2];

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
                categorys: results[1] || [], 
                login: login,
                is_empty: is_empty,
                tables: result,
                body: 'tableManage.ejs',
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

    tableView: (req, res) => {
        console.log('root.tableView(/table/view/:tableName)');

        var tableName = req.params.tableName;
        var sanitized_table_name = sanitizehtml(tableName);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `SELECT *
                    FROM information_schema.columns
                    WHERE
                    table_schema = 'webdb2024' and
                    table_name ='${sanitized_table_name}';` // 선택한 테이블의 컬럼 명 모두 출력
        var sql4 = `SELECT * FROM ${sanitized_table_name};`; // 선택한 테이블의 값 모두 출력

        db.query(sql1 + sql2 + sql3 + sql4, (err, results) => {
            if(err){
                console.log(err);
            }

            var { login, name, cls } = authIsOwner(req, res);

            let is_empty = false;

            let result = results[2];

            if (result == undefined) {
                result = []; // 빈 배열의 길이를 읽는 경우를 방지
            }


            var context = {
                who: name,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                tableColumns: result,
                tableRows: results[3],
                is_empty: is_empty,
                login: login,
                body: 'tableView.ejs',
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
    
}