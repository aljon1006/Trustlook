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
        // for(var x = 0 ; x < data[0].length ; x++) {
        //     var address_account = data[x].address;
        //     var xrp = await position.getAccountBal(address_account);
        //     new_data[x] = {pos: data[x].pos, address: address_account, length: data[x].length, 
        //     total: data[x].total, bal: data[x].bal, xrp: xrp};
        // }
        res.render("look", {data: data});
        // res.render("look")       
    }

    async account_balance(req, res) {
        var file                    = "assets/addresses.xlsx";
        var available_file          = "assets/available.txt";
        var allxrp_file             = "assets/allxrp.txt";
        const readXlsxFile          = require('read-excel-file/node');
        const fs                    = require("fs");
        // const ExcelJS               = require('exceljs');
        // const workbook              = new ExcelJS.Workbook();
        var list                    = {};
        var available               = 0;
        var datetime                = new Date();
        readXlsxFile(file).then(async (rows) => {
            for(var x = 0 ; x < rows.length ; x++) {
                var address = rows[x][0]
                var xrp = await position.getAccountBal(address);
                list[x] = {bal: xrp, length: rows.length, address: address, total: available}
                available = available + parseFloat(xrp);
                console.log(available)
            }
            // console.log(list);
            // workbook.xlsx.readFile(available_file)
            // .then(function() {
            //     var worksheet = workbook.getWorksheet(1);
            //     var lastRow = worksheet.lastRow;
            //     var getRowInsert = worksheet.getRow(++(lastRow.number));
            //     getRowInsert.getCell('A').value = 'yo';
            //     getRowInsert.commit();
            //     return workbook.xlsx.writeFile(available_file);
            // })
           
            console.log();
            fs.appendFile(available_file, available.toFixed(2)+" --- "+datetime.toISOString().slice(0,10)+"\n", err =>{
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