const express = require('express');
const session = require('express-session')
const {Pool} = require('pg');
const pgSession = require('connect-pg-simple')(session);
const {protected} = require('./middlewares/protection')
const dotenv = require('dotenv');


dotenv.config();

const {
    PORT,
    DB_PORT,
    SESSION_NAME,
    SESSION_SECRET,
    SESSION_AGE = 1000*60*60*2,
    SESSION_SECURE = process.env === "production",
    DB_USER,
    DB_HOST,
    DB,
    DB_PASSWORD
} = process.env;

// create an express app
const app = express();

// create a pool to connect to database
const pgPool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: Number(DB_PORT),
});

// create connect-pg-simple session object that is responsible of storing 
// user sessions in database
const pgStore = new pgSession({
    pool : pgPool,
    tableName : 'session'
});

// create a session middleware 
app.use(session({
    store : pgStore,
    name : SESSION_NAME,
    saveUninitialized : false,
    resave : false,
    secret : SESSION_SECRET,
    cookie : {
        path : '/',
        domain : null,
        httpOnly : true,
        sameSite : true,
        secure : SESSION_SECURE
    }
}));

app.use(express.json());

// middleware to add cors support to responses
app.use((req, res, next) => {
    res.header('Access-control-Allow-Origin', 'http://localhost:3000');
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header('Access-Control-Allow-Credentials', true);

    next();
})

// gets executed before all middlewares and adds user details to request locals object 
// that is shared accross all middlewares
// app.use((req, res, next) => { 
//     next();
// });

//routes
app.get('/home', (req, res) => {
    res.json({message : 'homepage'});
})

app.get('/dashboard', protected, (req, res) => {
    res.json({message : 'dashboard'})
})

app.use('/api/users', require('./routes/users'));
app.use('/api/books', require('./routes/books'));

app.listen(Number(PORT), console.log(`listening on port ${PORT}\nhttp://localhost:${PORT}/`));