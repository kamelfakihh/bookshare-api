const loggedIn = (req, res, next) => {
    // check if a user is logged in 
    if(req.session.userId){
        res.status(400).json({message : 'already logged in'});
    }else{
        next();
    }
}

const protected = (req, res, next) => {
    // check if user id exists in session

    if(req.session.userId){
        next(); // call next function to handle request
    }else{
        res.status(403).json({message : 'you have to log in first'});
    }
}

module.exports = {
    loggedIn,
    protected
}