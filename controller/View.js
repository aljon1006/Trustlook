const PosModel = require("../model/Position");
const position = new PosModel();

class View {
    constructor() {
    }
    
    home(req, res) {
        res.render("home");
    }

    to_look(req, res) {
        var address = req.query.address;
        res.redirect("/look/"+address);
    }

    async look(req, res) {
        var address = req.params.address;
        var data = await position.getPos(address);

        res.render("look", {data: data});  
    }

    /*----------------------------------------------------------------------------------------------------
     |  @note: Change label if ALL or Available                                                          |
     |  @note: Change file allxrp_file or available_file                                                 |
     ----------------------------------------------------------------------------------------------------*/
    async account_balance(req, res) {
        var file                    = "assets/addresses.xlsx";
        var available_file          = "assets/available.txt";
        var allxrp_file             = "assets/allxrp.txt";
        var balance_                = "assets/balance_.json";
        const readXlsxFile          = require('read-excel-file/node');
        const fs                    = require("fs");
        // const ExcelJS               = require('exceljs');
        // const workbook              = new ExcelJS.Workbook();
        var list                    = {};
        var available               = 0;
        var reserved                = 0;
        var datetime                = new Date();
        var jsonData                = [];
        var label                   = "AVAILABLE";  //AVAILABLE or ALL
        var count_ret               = 0;
        var total_all_xrp           = 0;
        readXlsxFile(file).then(async (rows) => {
            for(var x = 0 ; x < rows.length ; x++) {
                var address                     = rows[x][0]
                var xrp                         = await position.getAccountBal(address);
               
                if(xrp.reserved != 10 && label != "ALL") {
                    available = available + parseFloat(xrp.available);
                    reserved = reserved + parseFloat(xrp.reserved);
                    // var tempjsonData =  {bal: xrp, length: rows.length, address: address, total: available, 
                    //     date: datetime.toISOString().slice(0,10)};
                    list[x] = {bal: xrp.available, length: rows.length, address: address, total: available, 
                            reserved: xrp.reserved, date: datetime.toISOString().slice(0,10)};
                    // jsonData.push(tempjsonData);
                    console.log("Available: ", available, "Reserved: ", xrp.reserved)
                    count_ret = 0;
                }
                else if(label == "ALL") {
                    available = available + parseFloat(xrp.available);
                    // var tempjsonData =  {bal: xrp, length: rows.length, address: address, total: available, 
                    //     date: datetime.toISOString().slice(0,10)};
                    list[x] = {bal: xrp.available, length: rows.length, address: address, total: available, 
                            reserved: xrp.reserved, date: datetime.toISOString().slice(0,10)};
                    // jsonData.push(tempjsonData);
                    console.log("Available: ", available, "Reserved: ", xrp.reserved)
                }
                else {
                    x--;
                    count_ret++;
                    console.log("Available: ", available, "Reserved: ", xrp.reserved, "Retry Count: ", count_ret)
                }
               
            }
            total_all_xrp = parseFloat(available) + parseFloat(reserved);
            // workbook.xlsx.readFile(available_file)
            // .then(function() {
            //     var worksheet = workbook.getWorksheet(1);
            //     var lastRow = worksheet.lastRow;
            //     var getRowInsert = worksheet.getRow(++(lastRow.number));
            //     getRowInsert.getCell('A').value = 'yo';
            //     getRowInsert.commit();
            //     return workbook.xlsx.writeFile(available_file);
            // })
            var jsonContent = JSON.parse(JSON.stringify(list));
            
            
            fs.appendFile(available_file
                , available.toFixed(2)+" --- "+datetime.toISOString().slice(0,10)+"\n", err =>{
                if(err){
                    console.log(err)
                    return;
                }
            });
            fs.appendFile(allxrp_file
                , total_all_xrp.toFixed(2)+" --- "+datetime.toISOString().slice(0,10)+"\n", err =>{
                if(err){
                    console.log(err)
                    return;
                }
            });
            fs.appendFile(balance_, 
                label+"----------------------------------------------------------------------------------"+label+"\n"+
                JSON.stringify(jsonContent, null, 2)+"\n"+
                label+"----------------------------------------------------------------------------------"+label+"\n", 
                'utf8', err =>{
                if(err){
                    console.log(err)
                    return;
                }
            });
            res.render("accountbalance", {data: list});
            
           
        });
        
    }
}
module.exports = View;