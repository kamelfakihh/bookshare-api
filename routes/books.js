const {Pool} = require('pg');
const express = require('express');
const {Router} = require('express');
const {protected, loggedIn} = require('../middlewares/protection');

// load enviroment variables from .env file
const dotenv = require('dotenv');

dotenv.config();

const {
    DB_PORT,
    DB_USER,
    DB_HOST,
    DB,
    DB_PASSWORD
} = process.env;

// create a new pg pool to connect to database
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB,
    password: DB_PASSWORD,
    port: DB_PORT,
});

const router = new Router();

// @route       GET api/books/
// @desc        return a list of books
// @access      Public
router.get('/', async (req, res) => {
    try {

        let limit, offset;

        // a client can add a limit value to params that can be a max of 20
        if(req.query.limit || req.query.limit < 20) 
            limit = req.query.limit;
        else 
            limit = 20

        // books are sorted by date
        // so an offset = 0, returns the most recent books
        if(req.query.offset)
            offset = req.query.offset
        else
            offset = 0;

        const result = await pool.query(`select * from "GetBooks" OFFSET ${offset} LIMIT ${limit};`);
    
        if(result.rowCount != 0){
            return res.status(200).json({
                offset,
                limit,
                body : result.rows,
                message : null
            });
        }else{
            return res.status(200).json({
                offset : 0,
                limit : 0,
                body : null,
                message : "0 books were found"
            });
        }

    } catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

// @route       GET api/books/:id
// @desc        return a book by its id
// @access      Public
router.get('/:id', async (req, res) => {

    try {
        
        const BookId = req.params.id;
        const {userId} = req.session;

        const result = await pool.query(
            `select * 
            FROM "AvailableBooks" 
            WHERE "AvailableBooks"."ID" = ${BookId}`
        );

        // check if book is in user's saved list
        let exists = false;
        if(userId){
            const saved = await pool.query(`SELECT EXISTS (SELECT * FROM "Saved" 
                                         WHERE "UserId" = $1 AND "BookId" = $2);`, [userId, BookId]); 
            exists = saved.rows[0].exists;
        }

        if(result.rowCount != 0){
            
            res.status(200).json({
                body : {
                    ...result.rows[0],
                    saved : exists               
                },
                message : null
            });

            // add book to user's viewed history
            if(userId) pool.query('INSERT INTO "Viewed" ("UserId", "BookId") VALUES ($1, $2)', [userId, BookId]);

            return;

        }else{
            return res.status(200).json({
                message : "0 books were found"
            });
        }

    } catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

// @route       POST api/books/post
// @desc        post a new book
// @access      Protected
router.post('/post', protected, async (req, res) => {
    
    try {

        // get book data from request
        const {
            Title, Author, Description,
            PublishDate, Genre, Level,
            ISBN, Location, image_url
        } = req.body;

        const {userId} = req.session;

        // check for null values in request (some columns in Books table can't be null)
        if( !Title || !Genre || !Level || !Location){
            return res.status(400).json({message : "invalid post parameters !"});
        }

        const query = `INSERT INTO "Books" ("UserId", "Title", "Author", "Description", "PublishDate", "Genre", "ISBN", "Location", "Image_url") 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) `;

        // add book to database
        const result = await pool.query(
            query, 
            [
                userId, Title, Author || null, Description || null, PublishDate || null,
                Genre, ISBN || null, Location, image_url || null
            ]
        );
        
        if(result.rowCount >= 1){
            return res.status(200).json({message : "added 1 book"});
        }else{
            return res.status(400).json({message : "failed to add book"});
        }

    } catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

// @route       DELETE api/books/:id
// @desc        delete a book
// @access      Protected
router.delete('/:id', protected, async (req, res) => {

    try {

        const BookId = req.params.id;
        const {userId} = req.session;

        // check if a book is already deleted 
        let exists = false;
        if(userId){
            const saved = await pool.query(`SELECT EXISTS (SELECT * FROM "AvailableBooks" 
                                         WHERE "AvailableBooks"."ID" = $1 );`, [BookId]); 
            exists = saved.rows[0].exists;
        }

        let result;
        if(exists) result = await pool.query('UPDATE "Books" SET "DeletedAt" = NOW() WHERE "Books"."ID" = $1', [BookId]); 
        else return res.status(400).json({message : "book not found"});

        if(result.rowCount >= 1){
            return res.status(200).json({message : "deleted 1 book"});
        }else{
            return res.status(400).json({message : "failed to delete book"});
        }
    }
    catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

// @route       POST api/books/save/:id
// @desc        adds/removes a book from saved list
// @access      Protected
router.post('/save/:id', protected, async (req, res) => {

    try {

        const {userId} = req.session;
        const BookId = req.params.id;

        // check if a book is deleted deleted 
        let deleted = false;
        if(userId){
            const saved = await pool.query(`SELECT EXISTS (SELECT * FROM "AvailableBooks" 
                                         WHERE "AvailableBooks"."ID" = $1);`, [BookId]); 
            deleted = !saved.rows[0].exists;
        }

        if(deleted) return res.status(400).json({message : "book not found"})

        // check if book is already in Saved list
        let result = await pool.query(`SELECT EXISTS (SELECT * FROM "Saved" 
                                         WHERE "UserId" = $1 AND "BookId" = $2);`, [userId, BookId]);

        const { exists } = result.rows[0];

        if(!exists){
            // if not, add it to Saved list
            result = await pool.query(`INSERT INTO "Saved" ("UserId", "BookId") VALUES ($1, $2);`, [userId, BookId]);

            if(result.rowCount >= 1){
                return res.status(200).json({message : "saved book"});
            }else{
                return res.status(503).json({message : "failed to save book"});
            }
        }else{
            // else, remove it from saved list
            result = await pool.query(`DELETE FROM "Saved" WHERE "UserId" = $1 AND "BookId" = $2`, [userId, BookId]);

            if(result.rowCount >= 1){
                return res.status(200).json({message : "removed book from saved list"});
            }else{
                return res.status(503).json({message : "failed to remove book from saved list"});
            }
        }

    } catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

module.exports = router;