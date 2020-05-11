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

function exQnaList(linknum,startnum){
    var item1 = $( "div.waiting" );
    item1.css({"display":"block"});
    $.ajax({
        url : "/ajax/getQnaList",
        type : "POST",
        data : {
            linknum : linknum,
            qnanum : startnum
        },
        success : function(result){
            if(result.result == "success"){
                var item2 = $( "div.done");
                var item3 = $(".exQnaBtn");
                item1.css({"display":"none"});
                item3.css({"display":"none"});
                var html = "";
                for(let val of result.data){
                    let whereName ='';
                    if(val.where == 'bid'){
                        whereName = "입찰";
                    }
                    var wdate = new Date(val.wdate);
                    var mdate = new Date(val.mdate);

                    html += '<div class="border-red">';
                    html += '<div>qna번호'+ val.qnanum+'</div>';
                    html += '<div>연결된'+ whereName + '번호 ' + val.linknum +'</div>';
                    html += '<div>날짜(수정)'+ wdate.format('yyyy-MM-dd hh:mm:ss') +'('+mdate.format('yyyy-MM-dd hh:mm:ss')+')'+'</div>';
                    html += '<div>문의자'+ val.userid+'</div>';
                    html += '<div>요약'+ val.summary+'</div>';
                    html += '<div>내용'+ val.contents+'</div>';
                    if(val.nego == true){
                        html += '<div>제안된 가격'+ val.price+'</div>';
                        html += '<div>제안된 마감시기'+ val.deadline+'</div>';
                    }
                    html += '</div>';
                    item2.children(".qnaList").html(html);
                }
                item2.css({"display":"block"});
            } else if(result.result == "mongo error"){
                alert('mongo error');
            }
        }
    });
}