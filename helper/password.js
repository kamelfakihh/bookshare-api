const crypto = require('crypto');


// generate hash for a password
exports.hashPassword = async function (password){

    return new Promise((resolve, reject) => {

        // generate a 16 bytes long random salt
        const salt = crypto.randomBytes(16).toString("hex");

        // generate hashed password
        crypto.scrypt(password, salt, 64, (error, key) => {
            if(error) reject(error);

            // return hashed password and key
            resolve(salt + ':' + key.toString('hex'));
        })

    })
}

// verify a password
exports.verifyPassword = async function(password, hash){

    return new Promise((resolve, reject) => {
        
        let [salt, key] = hash.split(':');

        // generate new hash from pasword
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {

            if(error) reject(error);

            // return true of derivedKey matched initial key 
            resolve(key === derivedKey.toString('hex'));
        })
    })
}
