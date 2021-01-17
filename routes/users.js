const {Pool} = require('pg');
const express = require('express');
const {Router} = require('express');
const {isEmail, isPassword} = require('../helper/validation');
const {hashPassword, verifyPassword} = require('../helper/password');
const {protected, loggedIn} = require('../middlewares/protection')

const dotenv = require('dotenv');

dotenv.config();

const {
    DB_PORT,
    SESSION_NAME,
    DB_USER,
    DB_HOST,
    DB,
    DB_PASSWORD
} = process.env;

// create a new pg pool 
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: DB_PORT,
});

const router = new Router();

router.post('/login', loggedIn, async (req, res) => {

    try{

        const {Email, Password} = req.body;

        // validate email and password
        if( isEmail(Email) && isPassword(Password)){

            // check if user exists in users table
            let result = await pool.query(`SELECT * FROM "Users" WHERE "Email" = '${Email}';`);
            const user = result.rows[0];
            
            if(!user) {
                return res.status(400).json({message : 'account does not exist'});
            }

            // verify password is true
            if(await verifyPassword(Password, user.Password)){
                // add user to session after authorization
                req.session.userId =  user.ID;    

                return res.status(200).json({
                    FirstName : user.FirstName, 
                    LastName : user.LastName, 
                    UserName : user.UserName,
                    Email
                });

            } else {
                return res.status(403).json({message : 'incorrect password'})
            }

        }else {
            res.status(403).json({message : 'please provide valid parameters'})
        }

    }catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }

});

router.post('/register', loggedIn, async (req, res) => {

    try{
        
        const {Email, UserName, FirstName, LastName, Password} = req.body;
        

        // validate email and password
        if( isEmail(Email) && isPassword(Password) && UserName && FirstName && LastName){

            // check if email is already in use
            let result = await pool.query(`SELECT EXISTS(SELECT 1 FROM "Users" WHERE "UserName" = '${UserName}' OR "Email" = '${Email}');`);
            const { exists } = result.rows[0];
            if(exists) {
                return res.status(400).json({message : 'email is already in use'});
            }

            // if email is not in use we need to hash password
            // then add it to users table
            const hashedPass = await hashPassword(Password);

    
            result = await pool.query(`INSERT INTO "Users" ("FirstName", "LastName", "Email", "UserName", "Password") 
                                       VALUES ('${FirstName}', '${LastName}', '${Email}', '${UserName}', '${hashedPass}') RETURNING  *;`) 
            const user = result.rows[0];

            if(!user) {
                return res.status(500).json({message : 'failed to register'});
            }

            // add user id to session
            req.session.userId =  user.ID;
            res.status(200).json({FirstName, LastName, UserName});

        }else {
            res.status(403).json({message : 'please provide valid parameters'})
        }

    }catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }

});

router.post('/logout', protected,  (req, res) => {
    req.session.destroy( error => {
        if(error){
            res.status(403).json({message : 'failed to logout'});
        }

        res.clearCookie(SESSION_NAME);
        res.status(400).json({message : 'logged out'});
    })
});

module.exports = router;

