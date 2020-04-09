// public/js/script.js
jQuery.browser = {};
(function () {
    jQuery.browser.msie = false;
    jQuery.browser.version = 0;
    if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
        jQuery.browser.msie = true;
        jQuery.browser.version = RegExp.$1;
    }
})();

$(document).ready(function () {
  $.datepicker.setDefaults($.datepicker.regional['ko']); 
  $( "#startDate" ).datepicker({
       changeMonth: true, 
       changeYear: true,
       nextText: '다음 달',
       prevText: '이전 달', 
       dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
       dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'], 
       monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
       monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
       dateFormat: "yy-mm-dd",
       maxDate: 365,                       // 선택할수있는 최소날짜, ( 0 : 오늘 이후 날짜 선택 불가)
       onClose: function( selectedDate ) {    
            //시작일(startDate) datepicker가 닫힐때
            //종료일(endDate)의 선택할수있는 최소 날짜(minDate)를 선택한 시작일로 지정
           $("#endDate").datepicker( "option", "minDate", selectedDate );
       }    

  });
  $( "#endDate" ).datepicker({
       changeMonth: true, 
       changeYear: true,
       nextText: '다음 달',
       prevText: '이전 달', 
       dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
       dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'], 
       monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
       monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
       dateFormat: "yy-mm-dd",
       maxDate: 365,                       // 선택할수있는 최대날짜, ( 0 : 오늘 이후 날짜 선택 불가)
       onClose: function( selectedDate ) {    
           // 종료일(endDate) datepicker가 닫힐때
           // 시작일(startDate)의 선택할수있는 최대 날짜(maxDate)를 선택한 시작일로 지정
           $("#startDate").datepicker( "option", "maxDate", selectedDate );
       }    

  });    
});

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

function goPage(des){
  if(des == 'login'){
    window.location.replace('/login');
  } else if(des == 'upload'){
    window.location.replace('/upload');
  }
}
