var express                 = require("express");
const app                   = express();
var routes                  = require("./routes");
var bodyParser              = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views'); 
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/assets"));

app.use(routes);
var server                  = app.listen(1337);
console.log("Connected to 1337.....")
var axios                   = require("axios"); 
const { all } = require("./routes");

var fs = require("fs");

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

// async function get_data () {
//     const readXlsxFile          = require('read-excel-file/node');
//     var file                    = "assets/addresses.xlsx";
//     readXlsxFile(file).then(async (rows) => {
//         var total = 0;
//         var total_xrp = 0
//         for(var a = 0 ; a < rows.length ; a++) {
//             console.log("Address", rows[a][0]);
//             var url = 'http://data.ripple.com/v2/accounts/'+rows[a][0]+'/balances';
//             let res = await axios.get(url);
//             let result  = res.data.balances;
//             for(var x = 1 ; x < result.length ; x++) {
//                 var currency = result[x].currency;
//                 var issuer = result[x].counterparty;
//                 var value = parseFloat(result[x].value);
//                 var rate_ = await rate(currency, issuer);
//                 rate_ = parseFloat(rate_);
//                 var exchange_rates = value/rate_;
//                 exchange_rates = (isNaN(exchange_rates) || rate_.toFixed(6) == 0.000000) ? 0 : exchange_rates;
//                 exchange_rates = parseFloat(exchange_rates);
//                 total = total + exchange_rates;
//                 console.log("issuer", currency,"rate",rate_,"value", value, "exchange", "=", exchange_rates.toFixed(2), "total: ", total);
//             }
//             console.log("DONEEE NEXT PLEASE.....")
//             total_xrp = total_xrp + parseFloat(result[0].value);
//         }
//         console.log("Total exchanges: ", total, "Total xrp: ", total_xrp)
//         total = total + total_xrp;
//         var res_convert_php =  await axios.get("http://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=php");
//         var convert_php = parseFloat(res_convert_php.data.ripple.php);
//         total = total * convert_php;
//         console.log("PHP: ", convert_php)
//         console.log("Final result: ", total);
//     })  
    
// }

// function rate(currency, issuer) {
//     return new Promise(function(resolve, reject) {
//         axios("http://data.ripple.com/v2/exchange_rates/XRP/"+currency+"+"+issuer)
//         .then(new_res => {
//             setTimeout(function() {
//                 resolve(new_res.data.rate);
//             }, 1500)
            
//         })
//     })
   
// }
// get_data() 

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



