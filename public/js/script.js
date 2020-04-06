// public/js/script.js

$(function(){
  function get2digits (num){
    return ('0' + num).slice(-2);
  }

  function getDate(dateObj){
    if(dateObj instanceof Date)
      return dateObj.getFullYear() + '-' + get2digits(dateObj.getMonth()+1)+ '-' + get2digits(dateObj.getDate());
  }

  function getTime(dateObj){
    if(dateObj instanceof Date)
      return get2digits(dateObj.getHours()) + ':' + get2digits(dateObj.getMinutes())+ ':' + get2digits(dateObj.getSeconds());
  }

  function convertDate(){
    $('[data-date]').each(function(index,element){
      var dateString = $(element).data('date');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date));
      }
    });
  }

  function convertDateTime(){
    $('[data-date-time]').each(function(index,element){
      var dateString = $(element).data('date-time');
      if(dateString){
        var date = new Date(dateString);
        $(element).html(getDate(date)+' '+getTime(date));
      }
    });
  }

  
  convertDate();
  convertDateTime();
});

// users/new.ejs 관련 함수
function initiateError(id){
  var target = $("#"+id);
  target.removeClass("is-invalid");
}

// mail 인증
function verifyMail(){
  alert("Mail has been sent.");
  var verifyCode = $("#verifyCode");
  verifyCode.removeClass("display-none");

  var mailAddress = $("#email").val();
  $.ajax({
    url:"/users/mail",
    type:"POST",
    async:true,
    data:{
      mailAddress:mailAddress
    },
    dataType:"text"
  })
  .done(function(res){
    if(res == 'error'){
      alert('Mail transform failed. Please try agagin.');
      return;
    }
    
    console.log(res);
  })
  .fail(function(err){
    onsole.log(err);
    // console.log(req);
    // console.log(status);
    alert("Error");
  });
  
}