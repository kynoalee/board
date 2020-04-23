var common = {
    calculateByte : function(byte){
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
        },
    test : "1"
};

module.exports = common;