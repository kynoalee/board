$(document).ready(()=>{
    createStatus(statusNow,getStatus);
    $('#statusOp').change(()=>{
        if($('#statusOp').val() != getStatus){
            if($('#statusOp').val()==2){
                window.open("/bid/bidList");
                $('#statusOp').val(1);
            }
            var newForm = $('<form></form>');
            newForm.attr('name','newForm');
            newForm.attr('method','get');
            newForm.append($('#statusOp'));
            newForm.append($('input[name=ordernum]'));
            newForm.appendTo('body');
    
            newForm.submit();
        }
       
    });
    
    // 페이지 최상단 이동
    $('#goTop').click(()=>{
        $('html').scrollTop(0);
    });
});

function createStatus(statusNow,getStatus){
    let temp = statusNow.split(',');
    for(let i = 1; i <= temp.length;i++){
        let selected = '';
        if(i == getStatus){
            selected = 'selected'; 
        }
        let html = `<option value = '`+i+`' `+selected+`>`+temp[i-1]+`</option>`;
        $('#statusOp').append(html);
    }
}

function alertTest(){
    alert('test');
}

function goLastOrder(num){
    window.location.href ="/order/list?ordernum="+num;
}

function goPopup(ordernum){
    window.open("/order/detail?ordernum="+ordernum);
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
                } else if(result.result == "mongo error"){
                    alert("DB Error");
                } else if(result.result == "noFiles"){
                    alert("no files");
                }
            }
        });
    }

}

function uploadMoreData(ordernum){
    window.open("/order?ordernum="+ordernum);
}
var buttonOneClickPrototype = false;
function setPrototype(ordernum){
    if(!buttonOneClick){
        buttonOneClick = true;
        if(confirm('생산품의 프로토타입을 신청하시겠습니까?')){
            window.location.href ="/order/detail/proto?ordernum="+ordernum;
        } else {
            buttonOneClick = false;
        }
    }
}

function uploadManufacture(ordernum){
    window.open("/order/manufacture?ordernum="+ordernum);
}

function requestDelivery(ordernum){
    window.location.href = "/order/delivery"
}

function setQnA(ordernum){
    window.open("/order/qna?ordernum="+ordernum);
}

