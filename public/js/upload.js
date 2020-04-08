var formArray = {};  //파일을 담을 객체 key, value 형태로 파일을 담든다.
var fileList = new Object();

function displayByCheckbox(id,target){
    if($("#"+id).prop('checked')){
        $("#"+target).attr('type','text');
    } else{
        $("#"+target).attr('type','hidden');
        $("#"+target).val('');

    }
}

function listFiles(id,list) {
    fileList = $("#"+id)[0].files;  //파일 대상이 리스트 형태로 넘어온다.
    for(var i=0;i < fileList.length;i++){
        var file = fileList[i];
        // const formData = new FormData();
        // formData.append('유니크한아이디', file);  //파일을 더해준다.
        //만약 여기서 유니크한이이디를 사용하여 테그(노드)를 만든다면
        //각각 파일에 대해 프로그래싱이 가능하다.
        $('#'+list).append(
            '<div>'
            +'<span>'+file.name+'</span>'
            +'<span>&nbsp;'+calculateByte(file.size)+'</span>'
            +'</div>'
        );
    }
}

function calculateByte(byte){
    let calByte = 0;
    let stringByte = 'Byte';
    if(byte>=1000 && byte < 1000000){
        calByte = (byte / 1000).toFixed(2);
        stringByte = "KB";
    } else if(byte >1000000){
        calByte = (byte / 1000000).toFixed(2);
        stringByte = "MB";
    } else {
        calByte = byte;
    }
    calByte.toString();
    return calByte+stringByte;
}