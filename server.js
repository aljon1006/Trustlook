var express                 = require("express");
const app                   = express();
var routes                  = require("./routes");
var bodyParser              = require('body-parser');
let VALUE_1000              = 1000;

app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views'); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/assets"));

app.use(routes);
var server                  = app.listen(1337, ["192.168.100.3" || "localhost"], () =>{
    console.log("Connected to 1337.....")
});

var axios                   = require("axios");
const https                 = require('https');
const agent = new https.Agent({ keepAlive: true });
const axiosInstance = axios.create({ httpsAgent: agent });

const retry                 = require('async-retry'); 
const { all }               = require("./routes");
var fs                      = require("fs");
var accountWorthOnOff       = 'N';    // N: off, Y: on
const prompt                = require('prompt-sync')();


/* Account Worth */

//Get php rate using livecoinwatch api

async function getPhpRate() {
    const url = 'https://api.livecoinwatch.com/coins/single';
    const apiKey = 'ac73f434-dcd0-449d-a1f9-ed3302dd832b';
    let retries                 = VALUE_1000;
    let retryDelay              = 60 * 500;
    const requestData = {
        currency: 'PHP',
        code: 'XRP',
        meta: true,
    };
    while (retries > 0) {
        try {
            const response = await axiosInstance.post(url, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
            });
    
            // Return the rate from the response data
            return response.data.rate;
        } catch (err) {
            if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400 || err.response.status === 502 || err.response.status === 504)) {
                console.log(`Retrying for account cause rate limit ${err} ${retryDelay}ms, attempts remaining: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries--;
            }
            else if(err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
                         || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED'
                         || err.status === 500) {
                console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries--;
            }
            else {
                console.log(`Error: ${err.message}`)
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retries--;
            }
        }
    }
    
}


async function get_data (fileEmptyRes) {
    console.log('\x1b[32m%s\x1b[0m', "CHECKING ACCOUNT WORTH.......")
    const readXlsxFile          = require('read-excel-file/node');
    var file                    = "assets/addresses.xlsx";
    let result;
    let retries                 = VALUE_1000;
    let retryDelay              = 60 * 500;
    const accountWorthFile      = "assets/account_worth.txt"
    let tokenPriceFIle          = "assets/token_price"
    var datetime                = new Date();
    let finalRes                = 0;
    let totExchange             = 0;
    

    //rate variables
    var currency                = 0;
    var issuer                  = 0;
    var value                   = 0;
    var rate_                   = 0;
    var exchange_rates          = 0;
    let currencyObj             = {};
    let tagForFile              = 0;
    let resXrp                  = 0;
    //check if file is empty
    tagForFile = (fileEmptyRes == true) ? 1 : 2;
    
    readXlsxFile(file).then(async (rows) => {
        var total = 0;
        var total_xrp = 0
        for(var a = 0 ; a < rows.length ; a++) {
            console.log("Address", rows[a][0]);

            /* Retry if encountered rate limit or internet connection issues */
            //TODO: ETIMEDOUT
            while(retries > 0) {
                try {
                    // var url = 'http://data.ripple.com/v2/accounts/'+rows[a][0]+'/balances';
                    var url = "https://api.xrpscan.com/api/v1/account/"+rows[a][0]+"/assets";
                    let res = await axiosInstance.get(url);
                        // console.log(res)
                    result = res.data;
                    break;
                } catch (err) {
                    if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400)) {
                        console.log(`Retrying for account cause rate limit ${rows[a][0]} ${retryDelay}ms, attempts remaining: ${retries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                    else if(err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
                                 || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED'
                                 || err.status === 500) {
                        console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                    else {
                        console.log(`Error: ${err.message}`)
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                }
            }
           
            /* Get the results and calculate the total XRP,
               total exchanges XRP base on the result length 
            */
            for(var x = 1 ; x < result.length ; x++) {
                let tempCurrencyObjMainData     = {};
                let tempExchangeRate = 0;
                currency = result[x].currency;
                issuer = result[x].counterparty;
                value = parseFloat(result[x].value);
                rate_ = await rate(currency, issuer);
                // rate_ = parseFloat(rate_);
                // exchange_rates = value/rate_;
                exchange_rates = value*rate_;
                console.log('\x1b[32m%s\x1b[0m', "exchange_rates: " , exchange_rates)
                /*Commented out for debugging */
                // exchange_rates = (isNaN(exchange_rates) || rate_.toFixed(6) == 0.000000) ? 0 : exchange_rates; 
                /*Commented out for debugging */
                exchange_rates = (isNaN(exchange_rates)) ? 0 : exchange_rates;
                // console.log('\x1b[32m%s\x1b[0m', "after first exchange_rates: " , exchange_rates)
                exchange_rates = parseFloat(exchange_rates);
                // console.log('\x1b[32m%s\x1b[0m', "after second exchange_rates: " , exchange_rates)
                total = total + exchange_rates;
                if (currencyObj !== null && currency in currencyObj) {
                    tempExchangeRate = parseFloat(currencyObj[currency][currency]);
                    tempExchangeRate = tempExchangeRate + exchange_rates;
                    tempCurrencyObjMainData[currency] = tempExchangeRate;
                    tempCurrencyObjMainData[tagForFile] = tagForFile;
                    currencyObj[currency] = tempCurrencyObjMainData;
                }
                else {
                    tempCurrencyObjMainData[currency] = exchange_rates;
                    tempCurrencyObjMainData[tagForFile] = tagForFile;
                    currencyObj[currency] = tempCurrencyObjMainData;
                    // console.log("DEBUGGING[currencyObj[currency]]: ", currencyObj[currency])
                }
                console.log("issuer", currency,"rate",rate_,"value", value, "exchange", "=", exchange_rates.toFixed(2), "total: ", total);
            }
            while(retries > 0) {
                try {
                    var urlXrp = "https://api.xrpscan.com/api/v1/account/"+rows[a][0];
                    let res = await axiosInstance.get(urlXrp);
                    resXrp = res.data.xrpBalance;
                    break;
                    
                } catch (err) {
                    if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400)) {
                        console.log(`Retrying for account cause rate limit ${rows[a][0]} ${retryDelay}ms, attempts remaining: ${retries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                    else if(err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
                                 || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED'
                                 || err.status === 500) {
                        console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                    else {
                        console.log(`Error: ${err.message}`)
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retries--;
                    }
                }

            }
           
            total_xrp = total_xrp + parseFloat(resXrp);
            // console.log("result[0].value ", result[0].value)
            console.log(`Total XRP: ${total_xrp}`)
            console.log("DONEEE NEXT PLEASE.....")
            retries = VALUE_1000;

            //Delay 3500ms every iteration
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
        console.log("Total exchanges: ", total, "Total xrp reserved + available: ", total_xrp)
        totExchange = total;
        total = total + total_xrp;
        //temp
        total = total - 4000
        // var res_convert_php =  await axios.get("http://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=php");
        let res_convert_php = await getPhpRate();
        
        let convert_php = parseFloat(res_convert_php);
        finalRes = total * convert_php;
        
        /* Load account worth */
        fs.readFile(accountWorthFile, function(err, data) {
            if(err) {
                console.log(err)
                throw err;
            }
            const newData = datetime.toISOString().slice(0,10)+"\n" + "Total exchanges: " + totExchange.toFixed(2) +
            " Total xrp reserved + available: "+ total_xrp.toFixed(2) + "\n" +  "PHP: " + convert_php + "\n" +
            "Total XRP: " + total + "\n" +
            "Final result: "+ finalRes + "\n\n\n";
            
            const fileData = data.toString();
            const updatedData = newData + fileData;

            /* Write result into txt file */
            fs.writeFileSync(accountWorthFile
                ,updatedData, err =>{
                if(err){
                    console.log(err)
                    return;
                }
            });
            
        })
        
        var jsonContent = JSON.parse(JSON.stringify(currencyObj));
        tokenPriceFIle = tokenPriceFIle + tagForFile + ".txt";
        fs.appendFile(tokenPriceFIle, 
            JSON.stringify(jsonContent, null, 2), 
            'utf8', err =>{
            if(err){
                console.log(err)
                return;
            }
        });
        compareTokenPrice();
        console.log("Total XRP: " + total)
        console.log("PHP: ", convert_php)
        console.log("Final result: ", finalRes);
    })  
    
}

async function rate(currency, issuer) {
    // console.log("currency ", currency, "issuer ", issuer)
    let rate = 0;
    let retries = VALUE_1000;
    let delayForFetchingPrice = 1500;
    let retryDelay = 60 * 100;
    let fetchDelay = 0;
    let fakePrice = 10000;
    /* Retry if encountered rate limit or internet connection issues */
    while (retries > 0) {
      try {
        /* XRPL META*/
        const response = await axiosInstance("https://data.xrplf.org/v1/iou/exchange_rates/"+issuer+"_"+currency+"/XRP");
        // console.log('\x1b[32m%s\x1b[0m', "Price: " , response.data.rate)
        rate = response.data.rate;
        if (rate !== undefined) {
            rate = parseFloat(rate);
        }
        /* XRPL META*/
        // await new Promise(resolve => setTimeout(resolve, fetchDelay));
        // const response = await axios(`http://data.ripple.com/v2/exchange_rates/XRP/${currency}+${issuer}`);

        /* OnTheDex REST API START */
        // const response = await axios("https://api.onthedex.live/public/v1/ticker/"+currency+"." +issuer);
        // for (let index = 0; index < response.data.pairs.length; index++) {
        //     if (response.data.pairs[index].quote == "XRP") {
        //         var hiPrice = parseFloat(response.data.pairs[index].price_hi);
        //         var loPrice = parseFloat(response.data.pairs[index].price_lo);
        //         console.log("hi: ", hiPrice, " lo: ", loPrice)
        //         rate = ( hiPrice > fakePrice ) ? loPrice : hiPrice;
        //         // console.log(index," ",response.data.pairs[index].quote)
        //         // console.log("rate ", rate)
        //         break;
        //     } 

        // }
        /* OnTheDex REST API END*/

        /* FOUND BUG  START */
        /* Get the remaining rate limit in headers  
           and check if its zero or negative. 
           Get the ratelimit reset time 
        */
        // let rateLimitRemaining = response.headers['x-ratelimit-remaining'];
        // if (parseInt(rateLimitRemaining) === 0 || parseInt(rateLimitRemaining) < 0) {
        //     console.log(`Rate limit exceeded. Waiting for reset, attempts remaining: ${retries}`);
        //     let resetTime = parseInt(response.headers['x-ratelimit-reset'])
        //     let waitTime =  resetTime - Math.floor(Date.now() / VALUE_1000);
        //     console.log(`Waiting time .... ${waitTime}`)

        //     //Delay 1000ms every iteration
        //     await new Promise(resolve => setTimeout(resolve, VALUE_1000));
        //     retries--;
        //   } else {
            // Do something with the response
        // console.log("response.data.pairs ", response.data.pairs)
       

        //   }
        /* FOUND BUG  END*/
        await new Promise(resolve => setTimeout(resolve, delayForFetchingPrice));
        break;
      } catch (err) {
        console.log("Error status in rate " + err)
        if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400)) {
          console.log(`Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
            
          //Delay every iteration
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retries--;
        } 
        else if(err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
                                 || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' 
                                 || err.status === 500 || err.status == 522) {
            console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retries--;
        }
        else {
            console.log(`Error connecting to the server${err.code}. Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retries--;
        }
      }
    }
  
    return rate;
}

function checkEmpty(file, callback) {
    fs.readFile(file, "utf8", function (err, data) {
        if (err) throw err;
        if (data === "") {
            callback(true);
        }
        else {
            callback(false);
        }
        
      });
}

function compareTokenPrice() {
    const file = "assets/token_price"
    const token_compare_file = "assets/token_compare.txt"
    let counterFlag = 0
    fs.readFile(file + "1.txt", "utf8", function (err, data1) {
        if (err) throw err;
        if (data1 !== "") {
            var object1 = JSON.parse(data1);
            fs.readFile(file + "2.txt", "utf8", function (err, data2) {
                if (err) throw err;
                if (data2 !== "") {
                    var object2 = JSON.parse(data2);
                    let data = {};
                    for (var key1 in object1) {
                       
                        for (var key2 in object2) {
                            if (key1 === key2) {
                                if (object1[key1][key1] == object2[key2][key2]) {
                                    console.log("tied");
                                }
                                else if (object1[key1][key1] < object2[key2][key2]) {
                                    console.log(object2[key2]);
                                    counterFlag++
                                    data[counterFlag] = object2[key2];
                                }
                                else if (object1[key1][key1] > object2[key2][key2]) {
                                    console.log(object1[key1]);
                                    counterFlag++
                                    data[counterFlag] = object1[key1];
                                }
                                else {
                                    // do nothing
                                }
                            }
                        }
                    }
                    clearFile(file + "1.txt")
                    writeFinalReport(object2, file + "1.txt", data, token_compare_file)
                    clearFile(file + "2.txt")
                }
                
                
              });
        }
        
      });
     
}
/* brief: dataObj - data of file2, dataObjTokenCompare data of token compare
    @param: object datObj, string fileSwitch, object dataObjTokenCompare, string fileTokenCompare
*/

function writeFinalReport(dataObj, fileSwitch, dataObjTokenCompare, fileTokenCompare) {
    let objToSwitch = {}
    let flag = "1";
    for(let key in dataObj) {
        let tempObj = {}
        tempObj[key] = dataObj[key][key];
        tempObj[flag] = flag;
        objToSwitch[key] = tempObj;
    }

    let jsonContent1 = JSON.parse(JSON.stringify(objToSwitch));
    fs.appendFile(fileSwitch, 
    JSON.stringify(jsonContent1, null, 2), 
    'utf8', err =>{
        if(err){
            console.log(err)
            return;
        }
    });
    var jsonContent2 = JSON.parse(JSON.stringify(dataObjTokenCompare));
    fs.appendFile(fileTokenCompare,
        "---------------------------------------------------------------------------------- " + 
    JSON.stringify(jsonContent2 , null, 2) +
        "\n ---------------------------------------------------------------------------------- \n\n\n\n" , 
    'utf8', err =>{
        if(err){
            console.log(err)
            return;
        }
    });
}

function clearFile(file) {
    fs.writeFile(file, "", function (err) {
        if (err) throw err;
        console.log(`The ${file} has been cleared.`);
      });
}

checkEmpty("assets/token_price1.txt", function(result) { //callback function
    var breakFlag = true;
    while(breakFlag) {
        accountWorthOnOff = prompt("Want to use account worth? Y/N: ")
        if (accountWorthOnOff.toLowerCase() === 'y') {
            get_data(result) 
            breakFlag = false;
        }
        else if (accountWorthOnOff.toLowerCase() === 'n') {
            console.log('\x1b[32m%s\x1b[0m', "PROGRAM HAS BEEN STARTED.......")
            breakFlag = false;
        }
        else {
    
        }
    }
    
})  


// fs.readFile("assets/order.json", function(err, data) {
      
//     // Check for errors
//     if (err) throw err;
   
//     // Converting to JSON
//     const orders = JSON.parse(data);
//     var tot = 0;
//     for(var x = 0 ; x < orders.length; x++) {
//         var text = orders[x].orderHistory.totalPrice;
//         console.log(x, ".) ",text);
//         var price = text.substr(1, text.length)
//         tot = tot + parseInt(price);
//     }
//     console.log("Total is: ", tot)
// });



