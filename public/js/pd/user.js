function popupDetail(where,userid){
    window.open("/pd/user/"+where+"/detail?userid="+userid,"pdUserDetail"+where+userid,'width=600,height=800,location=no,status=no,scrollbars=yes');
}
var doubleCheckBlock = false;
function forceVerified(userid){
    if(confirm('정말로 이메일 인증하겠습니까?')){
        if(doubleCheckBlock){
            return;
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
                    alert('메일 인증되었습니다.');
                    doubleCheckBlock = false;
                    window.location.href = window.location.href;
                } else if (result.result == 'mongo'){
                    
                }
            }
        });
    }
}

function setData(userClass){
    if(confirm('수정하시겠습니까?')){
        if(userClass=='normal'){
            $('input[name=where]').val('customer');
        }else if(userClass=='vender'){
            $('input[name=where]').val('vender');
        } else {
            $('input[name=where]').val('pd');
        }
        $('#mainForm').submit();
    }
}

var doubleCheckBlockA = false;

function setUserAccepted(userid){
    if(confirm('회원 승인하겠습니까?')){
        if(doubleCheckBlockA){
            return;
        }
        doubleCheckBlockA = true;
        $.ajax({
            url : "/ajax/pd/accepted",
            type : "POST",
            data : {
                userid : userid
            },
            success : function(result){
                if(result.result == 'success'){
                    alert('승인되었습니다..');
                    doubleCheckBlockA = false;
                    window.location.href = window.location.href;
                } else if (result.result == 'mongo'){
                    
                }
            }
        });
    }
}

var doubleCheckBlockB = false;
function setTempPassword(userid,email){
    if(confirm('임시비밀번호를 발행하겠습니까?')){
        if(doubleCheckBlockB){
            return;
        }
        doubleCheckBlockB = true;
        $.ajax({
            url : "/ajax/pd/password",
            type : "POST",
            data : {
                userid : userid,
                email : email
            },
            success : function(result){
                if(result.result == 'success'){
                    alert('발행 후 이메일 전송됨.');
                    doubleCheckBlockB = false;
                    window.location.href = window.location.href;
                } else if (result.result == 'mongo'){
                    
                }
            }
        });
    }
}