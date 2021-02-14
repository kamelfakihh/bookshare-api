// a user is logged in if its id is stored in session

// calls next if user is not logged in
const loggedIn = (req, res, next) => {
    
    if(req.session.userId){
        res.status(400).json({message : 'already logged in'});
    }else{
        next(); 
    }
}

// calls next if a user is logged in
const protected = (req, res, next) => {

    if(req.session.userId){
        next(); 
    }else{
        res.status(403).json({message : 'you have to log in first'});
    }
}

module.exports = {
    loggedIn,
    protected
}