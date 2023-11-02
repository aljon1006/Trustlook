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
const retry                 = require('async-retry'); 
const { all }               = require("./routes");
var fs                      = require("fs");
var accountWorthOnOff       = 'N';    // N off Y on
const prompt                = require('prompt-sync')();

// url = 'http://data.ripple.com/v2/accounts/rGfz8KHtNVTEpYN1jnPCmfGhe4k8zmR4ew/balances';
// axios.get(url).then(res => {
//     for(var x = 1 ; x < res.data.balances.length ; x++) {
//         var currency = res.data.balances[x].currency;
//         var issuer = res.data.balances[x].counterparty;
//         var value = res.data.balances[x].value;
//         // console.log("currency", currency, issuer)
//         axios("http://data.ripple.com/v2/exchange_rates/XRP/"+currency+"+"+issuer)
//             .then(result => {
//                 console.log(result);
//             })
        
//     }
    
// })


// account worth
async function get_data (fileEmptyRes) {
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
                    var url = 'http://data.ripple.com/v2/accounts/'+rows[a][0]+'/balances';
                    let res = await axios.get(url);
                    result = res.data.balances;
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
                rate_ = parseFloat(rate_);
                exchange_rates = value/rate_;
                exchange_rates = (isNaN(exchange_rates) || rate_.toFixed(6) == 0.000000) ? 0 : exchange_rates;
                exchange_rates = parseFloat(exchange_rates);
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
                }
                console.log("issuer", currency,"rate",rate_,"value", value, "exchange", "=", exchange_rates.toFixed(2), "total: ", total);
            }
            
            total_xrp = total_xrp + parseFloat(result[0].value);
            console.log(`Total XRP: ${total_xrp}`)
            console.log("DONEEE NEXT PLEASE.....")
            retries = VALUE_1000;

            //Delay 3500ms every iteration
            await new Promise(resolve => setTimeout(resolve, 3500));
        }
        console.log("Total exchanges: ", total, "Total xrp reserved + available: ", total_xrp)
        totExchange = total;
        total = total + total_xrp;
        var res_convert_php =  await axios.get("http://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=php");
        var convert_php = parseFloat(res_convert_php.data.ripple.php);
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
    let rate;
    let retries = VALUE_1000;
    let retryDelay = 60 * 100;
    let fetchDelay = 0;

    /* Retry if encountered rate limit or internet connection issues */
    while (retries > 0) {
      try {
        // await new Promise(resolve => setTimeout(resolve, fetchDelay));
        const response = await axios(`http://data.ripple.com/v2/exchange_rates/XRP/${currency}+${issuer}`);


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
        rate = response.data.rate;
        //   }
        /* FOUND BUG  END*/

        break;
      } catch (err) {
        if (err.response && (err.response.status === 429 || err.response.status === 500 || err.response.status === 400)) {
          console.log(`Retrying in ${retryDelay}ms, attempts remaining: ${retries}`);

          //Delay every iteration
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
          console.log(`Error: ${err.message}`);
          break;
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
                    writeFinalReport(object2, file + "1.txt", data, token_compare_file)
                    clearFile(file + "1.txt")
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

compareTokenPrice

checkEmpty("assets/token_price1.txt", function(result) {
    accountWorthOnOff = prompt("Want to use account worth? Y/N: ")
    if (accountWorthOnOff.toLowerCase() === 'y') {
        get_data(result) 
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



