const { default: axios } = require("axios");
let VALUE_1000 = 1000;
class Position {
    
    constructor() {

    }
     /*----------------------------------------------------------------------------------------------------
     |  @description: Get trustline position and total trustline including token holding                  |
     |                                                                                                    |
     ----------------------------------------------------------------------------------------------------*/
    getPos(address) {
        return new Promise(function(resolve, reject) {
            var axios                   = require("axios");
            var counter                 = 0;
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
                                    break;
                                }
                                else {
                                    // var xrp_bal = await getAccountBal(axios);
                                    if(counter+1 == res.data.lines.length) {
                                        list[a] = {pos: 0, address: rows[a][0], length: rows.length, 
                                            total: res.data.lines.length, bal: 0};
                                        counter = 0;
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
     /*----------------------------------------------------------------------------------------------------
     |  @note: Change param if xrp or available                                                           |
     |                                                                                                    |
     ----------------------------------------------------------------------------------------------------*/
     async getAccountBal(address) {
        let retries = VALUE_1000;
        let retryDelay = 60 * 100;
        let total = 0;
        let reserved =0;
        let available = 0;
        let xrp = 0;
        let data = {};
        // return new Promise(function(resolve, reject) {    
        //     var axios                   = require("axios");
        //     axios.get("https://data.ripple.com/v2/accounts/"+address+"/balances")
        //     .then((res) => {
        //         setTimeout(function() {
        //             var total = res.data.balances.length - 1;
        //             var reserved = total * 2 + 10;
        //             var xrp =  res.data.balances[0].value;
        //             var available = xrp - reserved;
        //             resolve({available: available, reserved: reserved}); 
        //                               //edit this
        //         }, 900);
                
        //     });
        
        // });
        while (retries > 0) {

            try {
                const response = await axios.get("https://data.ripple.com/v2/accounts/"+address+"/balances");
                total = response.data.balances.length - 1;
                reserved = total * 2 + 10;
                xrp = response.data.balances[0].value;
                available = xrp - reserved;
                data = {available: available, reserved: reserved};
                break;
            } catch (err) {
                if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400)) {
                    console.log(`Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
          
                    //Delay every iteration
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    retries--;
                  } 
                  else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
                                            || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
                      console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
          
                      //Delay every iteration
                      await new Promise(resolve => setTimeout(resolve, retryDelay));
                      retries--;
                  }
                  else {
                    console.log(`Error: ${err.message}`);
                    break;
                  }
                
            }
        }
        return data;

    }

}

module.exports = Position;