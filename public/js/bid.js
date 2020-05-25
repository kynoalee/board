var buttonDoubleCheck = false;

function selectThisOrder(ordernum,vender,customer,status){
    if(buttonDoubleCheck){
        return buttonDoubleCheck;
    } else{
        buttonDoubleCheck = true;
        var statusName = status =="select"?'선정':status =="reject"?'거절':'취소';
        if(confirm("정말 해당 입찰을 "+statusName +"하시겠습니까?")){
            $('input[name=status]').val(status);
            $('input[name=ordernum]').val(ordernum);
            $('input[name=vender]').val(vender);
            $('input[name=customer]').val(customer);
            $('#selectForm').submit();
        }else {
            buttonDoubleCheck = false;
        }
    }
}

function goQna(linknum,where){
    window.open("/qna/qna?linknum="+linknum+"&where="+where);
}

$(document).ready(()=>{
    $('td.negoAcceptList').css({"background-color":"#00ff8c"});
    // 리스트 색깔 주기 위함.
    for(let val of $('tr')){
        if($(val).attr('id')){
            let newId = $(val).attr('id').replace('ing','');
            let numericId = parseInt(newId);
            if(numericId % 2 == 0){
                $(val).css({'background-color':'#00d9ff'});
            } else{
                $(val).css({'background-color':'#ff0800'});
            }
        }
    }
});