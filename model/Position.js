class Position {
    constructor() {

    }
    getPos(address) {
        return new Promise(function(resolve, reject) {
            var axios                   = require("axios");
            var counter                 = 0;
            var found                   = false;
            var list                    = {};
            const readXlsxFile          = require('read-excel-file/node');
            var file                    = "assets/addresses.xlsx";
            console.log("Looking up for your trustline.......")
            readXlsxFile(file).then(async (rows) => {
                axios.get("https://api.xrpscan.com/api/v1/account/"+address+"/trustlines2")
                    .then(res =>  {
                        for(var a = 0 ; a < rows.length ;a++) {
                            
                            for(var x = 0 ; x < res.data.lines.length; x++) {
                                
                                if(res.data.lines[x].account == rows[a][0]) {
                                    // var xrp_bal = await getAccountBal(axios);
                                    list[a] = {pos: counter, address: rows[a][0], length: rows.length, 
                                        total: res.data.lines.length, bal: res.data.lines[x].balance};
                                    
                                    counter = 0;
                                    found = true;
                                    break;
                                }
                                else {
                                    // var xrp_bal = await getAccountBal(axios);
                                    if(counter+1 == res.data.lines.length) {
                                        list[a] = {pos: 0, address: rows[a][0], length: rows.length, 
                                            total: res.data.lines.length, bal: 0};
                                        counter = 0;
                                        found = false;
                                    }
                                    else {
                                        // console.log("counter", counter, "data", res.data.length)
                                        counter++;
                                    }
                                
                                }
                            
                            }
                        }
                        resolve(list);
                        reject("Error");
                    });
            });
        });
        
    }

    getAccountBal(address) {
        return new Promise(function(resolve, reject) {    
            var axios                   = require("axios");    
            axios.get("https://data.ripple.com/v2/accounts/"+address+"/balances")
            .then((res) => {
                setTimeout(function() {
                    var total = res.data.balances.length - 1;
                    var reserved = total * 2 + 10;
                    var xrp =  res.data.balances[0].value;
                    var available = xrp - reserved;
                    resolve(available);
                }, 900);
                
            });
        
        });
    }

}

module.exports = Position;