// order/list 제어 함수 모음
function alertTest(){
    alert('test');
}

function goLastOrder(num){
    window.location.href ="/order/list?ordernum="+num;
}

function goPopup(ordernum,status){
    window.open("/pop/detail?ordernum="+ordernum+"&status="+status,"popId"+status,'width=430,height=500,location=no,status=no,scrollbars=yes');
}

function bidIn(ordernum,orderid){
    window.open("/pop/bid?ordernum="+ordernum+"&orderid="+orderid,"bidId"+ordernum,'width=430,height=500,location=no,status=no,scrollbars=yes');
}

function getDetailInfo(ordernum,fileLinks){
    if($(this).attr('class') == 'detail'+ordernum){
        $(this).attr('class','');
        var item1 = $( "div.done");
        $("#detailOrder"+ordernum).find(item1).css({"display":"none"});
    } else{
        $(this).attr('class','detail'+ordernum);
        var item1 = $( "div.waiting" );

        $("#detailOrder"+ordernum).find(item1).css({"display":"block"});
        $.ajax({
            url : "/ajax/getFiles",
            type : "POST",
            data : {fileLinks : fileLinks},
            success : function(result){
                if(result.result == "success"){
                    var item1 = $( "div.waiting" );
                    var item2 = $( "div.done");
                    $("#detailOrder"+ordernum).find(item1).css({"display":"none"});
                    var html = "";
                    for(let val of result.data){
                        html += "<div><a href='/order/bidVenderIn/"+val.server+"'>";
                        html += val.origin+"</a> ("+val.byte+")</div>";
                        $("#detailOrder"+ordernum).find(item2).children(".file-list").html(html);
                    }
                    $("#detailOrder"+ordernum).find(item2).css({"display":"block"});
                }
            }
        })
    }

}

var buttonDoubleCheck = false;

function selectThisOrder(ordernum,vender,status){
    if(buttonDoubleCheck){
        return buttonDoubleCheck;
    } else{
        buttonDoubleCheck = true;
        var statusName = status =="select"?'선정':status =="reject"?'거절':'오류';
        if(confirm("정말 해당 입찰을 "+statusName +"하시겠습니까?")){
            $('input[name=status]').val(status);
            $('input[name=ordernum]').val(ordernum);
            $('input[name=vender]').val(vender);
            $('#selectForm').submit();
        }else {
            buttonDoubleCheck = false;
        }
    }
}