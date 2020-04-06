var nodemailer = require('nodemailer');

var nodeMailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'minkyun93@gmail.com',  // gmail 계정 아이디를 입력
      pass: '$@85sfda'          // gmail 계정의 비밀번호를 입력
    }
});
// var mailOptions = {
// from: '인증<minkyun93@gmail.com>',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
// to: address ,                     // 수신 메일 주소
// subject: 'Sending Email using Node.js',   // 제목
// text: 'That was easy!'  // 내용
// };

// 메일전송
var mailVerification = function(from,toWho,subject,text){
    let mailOptions = {
        from: from+'<minkyun93@gmail.com>',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
        to: toWho,                     // 수신 메일 주소
        subject: subject,   // 제목
        text: text  // 내용 
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