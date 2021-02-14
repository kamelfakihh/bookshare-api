const {Pool} = require('pg');
const express = require('express');
const {Router} = require('express');
const {protected, loggedIn} = require('../middlewares/protection');

const dotenv = require('dotenv');

dotenv.config();

const {
    DB_PORT,
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

// @route       GET api/books/
// @desc        return a list of books
// @access      Public
router.get('/', async (req, res) => {
    try {

        const limit = req.query.limit <= 10 ? req.query.limit : 10;
        const offset = req.query.offset <= 10 ? req.query.offset : 10;

        // fetch books from db, sorted by date 
        const result = await pool.query(`select "ID", "Title", "Author" from "Books" WHERE "Books"."DeletedAt" is null ORDER BY "CreatedAt" DESC OFFSET ${offset} LIMIT ${limit};`);
    
        // return result to client
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
        
        // get book id from params
        const BookId = req.params.id;
        const {userId} = req.session;

        // fetch book from db
        const result = await pool.query(
            `select "Books"."ID", "Books"."Title", "Books"."Author", "Books"."Description", 
            "Books"."PublishDate", "Books"."Image_url", "Books"."ISBN", "Books"."Available", 
            "Genres"."Name" AS "Genre", "Levels"."Name" AS "Level", "Books"."Location", "Books"."CreatedAt" 
            from "Books", "Genres", "Levels" 
            WHERE "Books"."Level" = "Levels"."ID" and "Books"."Genre" = "Genres"."ID" and "Books"."ID" = ${BookId} and "Books"."DeletedAt" is null`
        );

        // check if book is in user's favourites list
        let exists = false;
        if(userId){
            const fav = await pool.query(`SELECT EXISTS (SELECT * FROM "Favourites" 
                                         WHERE "UserId" = $1 AND "BookId" = $2);`, [userId, BookId]); 
            exists = fav.rows[0].exists;
        }

        // return result
        if(result.rowCount != 0){
            
            res.status(200).json({
                body : {
                    ...result.rows[0],
                    favourite : exists                },
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

        // check for null values in request (columns that are NOT NULL in the Books table)
        if( !Title || !Genre || !Level || !Location){
            return res.status(400).json({message : "invalid post parameters !"});
        }

        const query = `INSERT INTO "Books" ("UserId", "Title", "Author", "Description", "PublishDate", "Genre", "Level", "ISBN", "Location", "Image_url") 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) `;

        // add book to db
        const result = await pool.query(
            query, 
            [
                userId, Title, Author || null, Description || null, PublishDate || null,
                Genre, Level, ISBN || null, Location, image_url || null
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

        const result = await pool.query('UPDATE "Books" SET "DeletedAt" = NOW() WHERE "Books"."ID" = $1', [BookId]); 

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

// @route       POST api/books/fav/:id
// @desc        adds/removes a book from favourites list
// @access      Protected
router.post('/fav/:id', protected, async (req, res) => {

    try {

        const {userId} = req.session;
        const BookId = req.params.id;

        // check if book is already in favourites list
        let result = await pool.query(`SELECT EXISTS (SELECT * FROM "Favourites" 
                                         WHERE "UserId" = $1 AND "BookId" = $2);`, [userId, BookId]);

        const { exists } = result.rows[0];

        if(!exists){
            // if not, add it to favourites
            result = await pool.query(`INSERT INTO "Favourites" ("UserId", "BookId") VALUES ($1, $2);`, [userId, BookId]);

            if(result.rowCount >= 1){
                return res.status(200).json({message : "added book to favourites"});
            }else{
                return res.status(503).json({message : "failed to add book to favourites"});
            }
        }else{
            // else, remove it from favourites
            result = await pool.query(`DELETE FROM "Favourites" WHERE "UserId" = $1 AND "BookId" = $2`, [userId, BookId]);

            if(result.rowCount >= 1){
                return res.status(200).json({message : "removed book from favourites"});
            }else{
                return res.status(503).json({message : "failed to remove book from favourites"});
            }
        }

    } catch(error){
        console.log(error);
        res.status(500).json({message : 'internal error, please try again !'});
    }
});

module.exports = router;