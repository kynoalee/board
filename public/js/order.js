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
function test(test){
    if($(this).attr('class') == 'test'){
        $(this).attr('class','');
    } else{
        $(this).attr('class','test');
    }
    alert($(this).attr('class'));

}