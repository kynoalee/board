var nodemailer = require('nodemailer');
var config = require('../config/config')
var nodeMailer = nodemailer.createTransport(config.mail);

// 메일전송
var mailVerification = function(from,toWho,subject,text){
    let mailOptions = {
        from: from+'<mohandasgo93@gmail.com>',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
        to: toWho,                     // 수신 메일 주소
        subject: subject,   // 제목
        html: text  // 내용 
      }
      nodeMailer.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        }
        else {
          console.log('Email sent: ' + info.response);
        }
      });
}

module.exports = nodeMailer;
module.exports.mailVerification = mailVerification;