$(document).ready(()=>{
    $('input[name=price]').keyup(()=>{
        var nowPrice = $('.nowPrice').text();
        var inputPrice = $('input[name=price]').val();
        var diffPrice = (inputPrice - nowPrice);
        var diffPer = Math.abs(diffPrice) / nowPrice * 100;
        var innerText = '<span class="';
        var tmpPer = '';
        var tmpChange = '';
        if(diffPrice > 0){
            innerText += 'red">';
            tmpChange = "인상";
            tmpPer = '<span class="red">▲'+diffPer.toFixed(2)+'%</span>';
        } else if (diffPrice < 0){
            innerText += 'blue">';
            tmpChange = "인하";
            tmpPer = '<span class="blue">▼'+diffPer.toFixed(2)+'%</span>';
        } else {
            innerText += '">';
            tmpChange = "변동 없음";
            tmpPer = '<span>-'+diffPer.toFixed(2)+'%</span>';
        }
        innerText += "("+ Math.abs(diffPrice) + "원 "+tmpChange+" "+tmpPer +")"
        $('.diffPer').html(innerText);
    });

    $('#qnaKind').change(()=>{
        if($('#qnaKind').val() == 'nego'){
            $('#nego').removeClass('display-none');
            $('#nego').children('div').children("input[name=price]").prop("disabled",false);
        } else{
            $('#nego').addClass('display-none');
            $('#nego').children('div').children("input[name=price]").prop("disabled",true);
        }
        if(!$('#qnaKind').val()){
            $('.requiredDiv').addClass('display-none');
        } else{
            $('.requiredDiv').removeClass('display-none');
        }
    })

    $('#rejectBtn').click(()=>{
        // 파일 업로드 안보이게 , 거절은 무조건 거절만, 멘트 변경만 가능.
        $('#qnaSelect').addClass('display-none');
        $('#fileUpload').addClass('display-none');
        $('input[name=summary]').val('입찰내용 변경을 거절합니다.');
        $('#contents').text('입찰 내용 변경을 거절하겠습니다.');
        $('#inputName').html("<h2>거절</h2>");
        $('.requiredDiv').removeClass('display-none');
        var $option = $('<option value="reject" selected>거절</option>');
        $('#qnaKind *').remove();
        $('#qnaKind').append($option);
    });

    $('#acceptBtn').click(()=>{
        // 승인 시 
        $('#qnaSelect').addClass('display-none');
        $('#fileUpload').addClass('display-none');
        $('input[name=summary]').val('입찰내용 변경을 수락합니다.');
        $('#contents').text('입찰 내용 변경을 수락하겠습니다.');
        $('#inputName').html("<h2>수락</h2>");
        $('.requiredDiv').removeClass('display-none');
        var $option = $('<option value="accept" selected>수락</option>');
        $('#qnaKind *').remove();
        $('#qnaKind').append($option);
    });

    $('#reNegoBtn').click(()=>{
        // 재협의
        $('#inputName').html("<h2>재협의</h2>");
        var $option1 = $('<option value="">--문의 종류--</option>');
        var $option2 = $('<option value="negoqna">단순 질의</option>');
        var $option3 = $('<option value="nego">입찰 내용 협상</option>');
        $('#qnaKind *').remove();
        $('#qnaKind').append($option1);
        $('#qnaKind').append($option2);
        $('#qnaKind').append($option3);
        $('#qnaSelect').removeClass('display-none');
    });

    $('#submitBtn').click(()=>{
        if($('#submitBtn').hasClass('negoqna')===true){
            $('#qnaKind').off('change');
            $('#qnaKind').val('nego').trigger('change');
        }
        $('#qnaForm').submit();
    });
});

function exQnaList(linknum,endnum){
    var item1 = $( "div.waiting" );
    item1.css({"display":"block"});
    $.ajax({
        url : "/ajax/getQnaList",
        type : "POST",
        data : {
            linknum : linknum,
            qnanum : endnum
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