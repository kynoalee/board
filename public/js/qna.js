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
        if($('#qnaKind').val() == 'nego' ||$('#qnaKind').val() == 'reNego'){
            $('#nego').removeClass('display-none');
            $('#nego').children('div').children("input[name=price]").prop("disabled",false);
            $('#nego').children('div').children("input[name=deadline]").prop("disabled",false);

        } else{
            $('#nego').addClass('display-none');
            $('#nego').children('div').children("input[name=price]").prop("disabled",true);
            $('#nego').children('div').children("input[name=deadline]").prop("disabled",false);
        }
        if(!$('#qnaKind').val()){
            $('.requiredDiv').addClass('display-none');
        } else{
            $('.requiredDiv').removeClass('display-none');
        }
    })

    $('.buttonDiv').children('button').click((event)=>{
        var btn = event.target || event.srcElement;

        $('input[name=summary]').val('');
        $('#contents').text('');
        $('.requiredDiv').addClass('display-none');
        $('#nego').addClass('display-none');
        $('input[name=price]').val('');
        $('input[name=deadline]').val('');
        switch(btn.id){
            case 'rejectBtn' : 
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
            break;

            case 'acceptBtn' : 
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
            break;
            
            case 'reNegoBtn' : 
                // 재협의
                $('#inputName').html("<h2>재협의</h2>");
                var $option1 = $('<option value="">--문의 종류--</option>');
                var $option2 = $('<option value="negoQ">단순 질의</option>');
                var $option3 = $('<option value="reNego">입찰 내용 협상</option>');
                $('#qnaKind *').remove();
                $('#qnaKind').append($option1);
                $('#qnaKind').append($option2);
                $('#qnaKind').append($option3);
                $('#qnaSelect').removeClass('display-none');
            break;
            default : break;
        }
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
                    if(val.nego){
                        if(val.price){
                            html += '<div>제안된 가격'+ val.price+'</div>';
                        }
                        if(val.deadline){
                            html += '<div>제안된 마감시기'+ val.deadline+'</div>';
                        }                        
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

function getQnaDetail(linknum,endnum){
    $.ajax({
        url : "/ajax/getQnaDetail",
        type : "POST",
        data : {
            linknum : linknum,
            qnanum : endnum
        },
        success : function(result){
            if(result.result == "success"){
                if(result.data.length !=0){
                    var html = `<table class="table">
                        <thead>
                            <tr>
                                <td>상태</td>
                                <td>글쓴이</td>
                                <td>변경 내용</td>
                                <td>제목</td>
                                <td>작성일자</td>
                                <td></td>
                            </tr>
                        </thead>
                        <tbody>
                    `;
                    let num=0;
                    for(let val of result.data){
                        // 상태 ,글쓴이, 제목, 작성일자, 변경 내용
                        html += "<tr>";
                        // 상태 
                        let status = '';
                        switch(val.status){
                            case 'question' : status = '질문';break;
                            case 'answer' : status = '답변';break;
                            case 'negoQ' : status = '네고질의 질문';break;
                            case 'negoA' : status = '네고질의 답변';break;
                            case 'nego' : status = '네고 신청';break;
                            case 'reNego' : status = '재 네고';break;
                            case 'reject' : status = '변경거절';break;
                            case 'accept' : status = '변경승인';break;
                            default:break;
                        }
                        let wdate = new Date(val.wdate);
                        var tmpText ='';
                        // 변경사항있는지 파악 ( 네고인지 )
                        if(val.status == "nego" || val.status == "reNego"){
                            tmpText += '변경 신청';
                            if(val.price){
                                tmpText += " | 가격 "+val.price;
                            }
                            if(val.deadline){
                                tmpText += " | 마감시간 "+val.deadline;
                            }
                        }
                        // 확정
                        if(val.status == "accept"){
                            tmpText += '변경됨';
                            if(val.price){
                                tmpText += " | 가격 "+val.price;
                            }
                            if(val.deadline){
                                tmpText += " | 마감시간 "+val.deadline;
                            }
                        }
                        
                        html += "<td>"+status+"</td>";
                        html += "<td>"+val.userid+"</td>";
                        html += "<td>"+val.summary+"</td>";
                        html += "<td>"+tmpText+"</td>";
                        html += "<td>"+wdate.format('yyyy-MM-dd hh:mm:ss')+"</td>";
                        if(num == 0){
                            html+= "<td rowspan="+result.data.length+" class='height-max'><button class='btn height-max' type='button' onclick=\"goQna('"+val.linknum+"','"+val.where+"')\">상세보기</button></td>";
                            num+=1;
                        }
                        html += "</tr>";
                    }
                    html += "</tbody></table>";
                    
                    $('div#linkedQna'+endnum).html(html);
                    $('div#linkedQna'+endnum).removeClass('display-none');
                } else {
                    $('tr#qnaEnd'+endnum).removeAttr('onclick');
                }
            } else if(result.result == "mongo error"){
                alert('mongo error');
            }
        }
    });
}

function goQna(linknum,where){
    window.open("/qna/qna?linknum="+linknum+"&where="+where);
}