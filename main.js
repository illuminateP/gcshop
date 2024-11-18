const express = require('express');

var session = require('express-session');
var MysqlStore = require('express-mysql-session')(session);
var bodyparser = require('body-parser');


var db = require('./lib/db');

var options = {
    host : 'localhost',
    user : 'root',
    password : 'root',
    database : 'webdb2024'
};

var sessionStore = new MysqlStore(options);

const app = express();

app.use(session({
    secret : 'keyboard cat',
    resave : false,
    saveUninitialized : true,
    store : sessionStore
}));


app.use(bodyparser.urlencoded({extended:false}));

app.set('views',__dirname+'/views');
app.set('view engine','ejs');

var authRouter = require('./router/authRouter');
var rootRouter = require('./router/rootRouter');
var codeRouter = require('./router/codeRouter');
var productRouter = require('./router/productRouter');
var personRouter = require('./router/personRouter');
var boardRouter = require('./router/boardRouter');
var purchaseRouter = require('./router/purchaseRouter');


app.use('/', rootRouter);
app.use('/auth',authRouter);
app.use('/code',codeRouter);
app.use('/product',productRouter);
app.use('/person',personRouter);
app.use('/board',boardRouter);
app.use('/purchase',purchaseRouter);

app.use(express.static('public'));

app.get('/favicon.ico', (req, res) => res.writeHead(404));
app.listen(3000, () => console.log('http://127.0.0.1:3000/!'));
