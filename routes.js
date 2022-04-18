const Express = require("express");
const Router = Express.Router();
const View = require("./controller/View.js");
const ControlView = new View();

Router.get("/", ControlView.home);
Router.get("/to_look", ControlView.to_look);
Router.get("/look/:address", ControlView.look);
Router.get("/account_balance", ControlView.account_balance);

module.exports = Router;