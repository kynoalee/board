module.exports = (function(){
    return{
        users: {
            userid : /^[A-Za-z0-9+]{4,12}$/,
            password : /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
            name : /^.{1,12}$/,
            contactnumber :/^([0-9]{2,4}-[0-9]{3,4}-[0-9]{4})$|^([0-9]{11})$/,
            email : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        }
    }
})();