const crypto = require('crypto');

exports.hashPassword = async function (password){

    return new Promise((resolve, reject) => {

        // generate a 16 bytes long random salt
        const salt = crypto.randomBytes(16).toString("hex");

        // generate hashed password
        crypto.scrypt(password, salt, 64, (error, key) => {
            if(error) reject(error);

            // add key to hashed password
            resolve(salt + ':' + key.toString('hex'));
        })

    })
}

exports.verifyPassword = async function(password, hash){

    return new Promise((resolve, reject) => {
        
        let [salt, key] = hash.split(':');

        // generate hash from same salt
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {

            if(error) reject(error);

            // check if new hash matches with one stored in db
            resolve(key === derivedKey.toString('hex'));
        })
    })
}
