var common = {
    calculateByte : function(byte){
        let tempByte = parseInt(byte);
        let calByte = 0;
        let stringByte = 'Byte';
        if(tempByte>=1000 && tempByte < 1000000){
            calByte = (tempByte / 1000).toFixed(2);
            stringByte = "KB";
        } else if(tempByte >1000000){
            calByte = (tempByte / 1000000).toFixed(2);
            stringByte = "MB";
        } else {
            calByte = tempByte;
        }
        calByte.toString();
        return calByte+stringByte;
    },
    test : "1",
    numberWithCommas : function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
};

module.exports = common;