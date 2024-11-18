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
    purchase: (req, res) => {
        console.log('purchase.purchase');

        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        let loginid = req.session.loginid;

        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }

        var sql3 = `
    SELECT 
        p.purchase_id,
        p.loginid,
        p.mer_id,
        p.date,
        p.price AS purchase_price,
        p.point,
        p.qty,
        p.total,
        p.payYN,
        p.cancel,
        p.refund,
        prod.name AS product_name,
        prod.image AS product_image,
        prod.price AS product_price
    FROM 
        purchase AS p
    LEFT JOIN 
        product AS prod
    ON 
        p.mer_id = prod.mer_id
    WHERE 
        p.loginid = '${loginid}';`;


        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            let is_empty = false;

            let result = results[2];
            if (result == undefined) {
                result = [];

            } 

            if(result.length == 0) {
                is_empty = true;
            }

            var context = {
                who: name,
                loginid: loginid,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                product: result,
                is_empty: is_empty,
                login: login,
                body: 'purchase.ejs',
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

    purchasedetail: (req, res) => {
        console.log('purchase.purchasedetail(/detail/:merId)')
        var merId = req.params.merId;
        var sanitized_merId = sanitizehtml(merId);

        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;
        var sql3 = `select * from product where mer_id = '${sanitized_merId}';`;

        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            let loginid = req.session.loginid;

            if (loginid == undefined) {
                loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
            }

            var context = {
                who: name,
                loginid: loginid,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                product: results[2],
                login: login,
                body: 'purchaseDetail.ejs',
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

    purchase_process: (req, res) => {
        console.log('purchase.purchase_process');
        var body = req.body;
        var sanitized_login_id = sanitizehtml(body.loginid);
        var sanitized_mer_id = sanitizehtml(body.mer_id);
        var sanitized_price = parseFloat(sanitizehtml(body.price));
        var sanitized_qty = parseFloat(sanitizehtml(body.qty));

        var sanitized_total = sanitized_price * sanitized_qty;
        var sanitized_point = parseFloat(sanitized_total) * 0.005

        db.query(`INSERT INTO purchase (loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund) 
        VALUES (?, ?, NOW(), ?, ?, ?, ?, 'N', 'N', 'N')`,
            [sanitized_login_id, sanitized_mer_id, sanitized_price, sanitized_point, sanitized_qty, sanitized_total], (err, result) => {
                if (err) {
                    console.log(err);
                }
            });
        res.redirect('/purchase');

    },

    cancel_process: (req, res) => {
        console.log('purchase.cancel_process(/cancel/:purchaseId)');
        var sanitized_purchase_id = sanitizehtml(req.params.purchaseId);
        db.query(`UPDATE purchase
        SET cancel = 'Y'
        WHERE purchase_id = '${sanitized_purchase_id}'`
        );
        res.redirect('/purchase');
    },

    cart: (req, res) => {
        console.log('purchase.cart');
        var { login, name, cls } = authIsOwner(req, res);

        var sql1 = `select * from boardtype;`;
        var sql2 = `select * from code;`;

        let loginid = req.session.loginid;
        var sanitized_login_id = sanitizehtml(loginid);

        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }

        var sql3 = `
        SELECT 
            c.mer_id, 
            p.image AS product_image, 
            p.name AS product_name, 
            p.price AS product_price, 
            c.date
        FROM cart AS c
        INNER JOIN product AS p ON c.mer_id = p.mer_id
        WHERE c.loginid = '${sanitized_login_id}'
    `;
        db.query(sql1 + sql2 + sql3, (error, results) => {
            if (error) {
                console.log(error);
            }

            let is_empty = false;

            let result = results[2];

            if (result == undefined) {
                result = [];
            }

            if (result.length == 0) {
                is_empty = true;
            }

            var context = {
                who: name,
                loginid: loginid,
                boardtypes: results[0] || [],
                categorys: results[1] || [],
                product: result,
                is_empty: is_empty,
                login: login,
                body: 'cart.ejs',
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

    cartinsert: (req, res) => {
        console.log('purchase.cartinsert');
        var body = req.body;
        var sanitized_mer_id = sanitizehtml(body.mer_id);

        let loginid = req.session.loginid;

        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }

        var sanitized_login_id = sanitizehtml(loginid);

        db.query(`select * FROM cart WHERE loginid = ? AND mer_id = ?`,
            [sanitized_login_id, sanitized_mer_id], (err, result) => {
                if (err) {
                    console.log(err);
                }

                if (result == undefined) {
                    result = [];
                }

                if (result.length > 0) {
                    // 검색 결과가 있을 경우
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
            <script language="JavaScript" type="text/javascript">
                alert("장바구니에 이미 있는 제품입니다.");
                setTimeout(() => {location.href = 'http://localhost:3000/purchase/cart';
                }, 1000);
            </script>`);
                }
                else {
                    db.query(`INSERT INTO cart (loginid, mer_id, date) VALUES (?, ?, NOW())`,
                        [sanitized_login_id, sanitized_mer_id],
                        (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    res.redirect('/purchase/cart');
                }
            });
    },

    cartbuy: (req, res) => {
        console.log('cart.cartbuy');

        var body = req.body;

        let loginid = req.session.loginid;
        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }
        var sanitized_login_id = sanitizehtml(loginid);


        let selectedItems = body.selectedItems;
        // undefimed 값 처리
        if (selectedItems == undefined) {
            selectedItems = [];
        };
        // 단일 값은 배열로 변환해주지 않으면 length 속성에서 에러가 발생한다.
        if (!Array.isArray(selectedItems)) {
            selectedItems = [selectedItems];
        }

        if (selectedItems.length == 0) { // 선택한 상품이 없는 경우
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
    <script language="JavaScript" type="text/javascript">
        alert("구매할 상품을 선택해 주세요.");
        setTimeout(() => {location.href = 'http://localhost:3000/purchase/cart';
        }, 1000);
    </script>`);
        } else { // 상품을 선택했을 경우
            for (var i = 0; i < selectedItems.length; i++) {

                var mer_id = selectedItems[i];
                var sanitized_mer_id = sanitizehtml(mer_id);

                var qty = body['qty_' + mer_id];  // 각 mer_id에 해당하는 qty 값을 가져오기

                var price = body['pri_' + mer_id]

                var sanitized_price = sanitizehtml(price);

                var sanitized_qty = sanitizehtml(qty);

                var sanitized_total = parseFloat(sanitized_price) * parseFloat(sanitized_qty);
                var sanitized_point = parseFloat(sanitized_total) * 0.005

                if (qty) {
                    db.query(`INSERT INTO purchase (loginid, mer_id, date, price, point, qty, total, payYN, cancel, refund) VALUES (?, ?, NOW(), ?, ?, ?, ?, 'N', 'N', 'N')`,
                        [sanitized_login_id, sanitized_mer_id, sanitized_price, sanitized_point, sanitized_qty, sanitized_total],
                        (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });

                    // cart 테이블에서 삭제
                    db.query(`
                    DELETE FROM cart WHERE loginid = ? AND mer_id = ?`,
                        [sanitized_login_id, sanitized_mer_id],
                        (err, result) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                }
            }
            res.redirect('/purchase/cart');
        }
    },

    cartdelete: (req, res) => {
        console.log('cart.cartdelete');

        var body = req.body;

        let loginid = req.session.loginid;
        if (loginid == undefined) {
            loginid = 'NON' // 세션에 저장된 loginid가 없을 경우 null 값을 직접 비교하는 경우 제외
        }
        var sanitized_login_id = sanitizehtml(loginid);


        let selectedItems = body.selectedItems;
        // undefimed 값 처리
        if (selectedItems == undefined) {
            selectedItems = [];
        };
        // 단일 값은 배열로 변환해주지 않으면 length 속성에서 에러가 발생한다.
        if (!Array.isArray(selectedItems)) {
            selectedItems = [selectedItems];
        }


        if (selectedItems.length == 0) { // 선택한 상품이 없는 경우
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
    <script language="JavaScript" type="text/javascript">
        alert("삭제할 상품을 선택해 주세요.");
        setTimeout(() => {location.href = 'http://localhost:3000/purchase/cart';
        }, 1000);
    </script>`);
        } else {  // 선택된 상품이 있는 경우
            for (var i = 0; i < selectedItems.length; i++) {
                var mer_id = selectedItems[i];

                var sanitized_mer_id = sanitizehtml(mer_id);

                // DB에서 cart 테이블에서 삭제
                db.query(`DELETE FROM cart WHERE loginid = '${sanitized_login_id}' AND mer_id =  '${sanitized_mer_id}'`,
                    (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
            }
            res.redirect('/purchase/cart');
        }


    },

}