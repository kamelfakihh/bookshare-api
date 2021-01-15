// TODO : 
// regular expression validation is not enoguh and won't catch all 
// invalid emails, probably needs to add more validation

// validate register or login email
function isEmail(email){
    // email validation regex according to RFC 5322 standards
    // https://emailregex.com/
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
}

// validate register or login password

// at least 1 lowercase alphabetical character
// at least 1 uppercase alphabetical character
// at least 1 numeric character
// The string must be eight characters or longer
function isPassword(password){
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    return regex.test(password);
}

module.exports = {
    isEmail,
    isPassword
};