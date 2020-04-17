// order/list 제어 함수 모음
function alertTest(){
    alert('test');
}
function goLastOrder(num){
    window.location.href ="/order/list?ordernum="+num;
}
function goPopup(ordernum,status){
    window.open("/pop/detail?ordernum="+ordernum+"&status="+status,"123",'width=430,height=500,location=no,status=no,scrollbars=yes');
}
