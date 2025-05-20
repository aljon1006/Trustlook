const Express = require("express");
const Router = Express.Router();
const View = require("./controller/View.js");
const ControlView = new View();

/* Address upload */
const multer                = require('multer');
const path                  = require('path');
const ASSET                 = "/assets"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname + ASSET)); // Current dir
  },
  filename: function (req, file, cb) {
    cb(null, "addresses.xlsx"); // Use original filename
  }
});
const upload = multer({ storage });

Router.get("/", ControlView.home);
Router.get("/to_look", ControlView.to_look);
Router.get("/look", (req, res) => {
    res.status(400).send("Error: Address parameter is required.");
});
Router.get("/look/:address", ControlView.look);
Router.get("/account_balance", ControlView.account_balance);

Router.post("/upload", upload.single("myfile"), ControlView.uploadFile);
Router.get("/upload", ControlView.home);
module.exports = Router;