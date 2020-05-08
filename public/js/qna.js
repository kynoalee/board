function setQnaHtml(){
    if($('#qnaKind').val() == 'nego'){
        $('#nego').removeClass('display-none');
        $('#nego').children('div').children("input[name=price]").prop("disabled",false);
    } else{
        $('#nego').addClass('display-none');
        $('#nego').children('div').children("input[name=price]").prop("disabled",true);
    }
    if(!$('#qnaKind').val()){
        $('#submitBtn').addClass('display-none');
    } else{
        $('#submitBtn').removeClass('display-none');
    }
}

function exQnaList(){
    
}