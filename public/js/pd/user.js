function popupDetail(where,userid){
    window.open("/pd/user/"+where+"/detail?userid="+userid,"pdUserDetail"+where+userid,'width=600,height=800,location=no,status=no,scrollbars=yes');
}

var doubleCheckBlock = false;

function forceVerified(userid){
    if(confirm('정말로 이메일 인증하겠습니까?')){
        if(doubleCheckBlock){
            break;
        }
        doubleCheckBlock = true;
        $.ajax({
            url : "/ajax/pd/forceVerified",
            type : "POST",
            data : {
                userid : userid
            },
            success : function(result){
                if(result.result == 'success'){

                } else if (result.result == 'mongo'){
                    
                }
            }
        });
    }
}