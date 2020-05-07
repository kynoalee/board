function setQnaHtml(){
    if($('#qnaKind').val() == 'nego'){
        $('#nego').css({"display":"block"});
        $('#nego').children('div').children("input[name=price]").prop("disabled",false);
    } else{
        $('#nego').css({"display":"none"});
        $('#nego').children('div').children("input[name=price]").prop("disabled",true);
    }
    if(!$('#qnaKind').val()){
        $('#submitBtn').prop('disabled',true);
    } else{
        $('#submitBtn').prop('disabled',false);
    }
}

function exQnaList(){
    
}