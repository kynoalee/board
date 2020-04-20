var config = {
    server:{
        local:"http://localhost:3000"
    },
    file:{
        local:"../files/"  
    },
    db:{
        mongo:{
            test:"mongodb+srv://kynoa:1004kyno@cluster0-onkr1.mongodb.net/test?retryWrites=true&w=majority",
            main:"mongodb+srv://kynoa:1004kyno@cluster0-onkr1.mongodb.net/main?retryWrites=true&w=majority",
        }
    },
    mail:{
        service: 'gmail',
        auth: {
          user: 'mohandasgo93@gmail.com',  // gmail 계정 아이디를 입력
          pass: '12qwaszx!'          // gmail 계정의 비밀번호를 입력
        }
    }
};

module.exports = config;