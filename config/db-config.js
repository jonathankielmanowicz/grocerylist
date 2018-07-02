const mongoose = require("mongoose");
const dbCredentials = require("./db-credentials.json");
const Team = require("./schemas/team.js");

mongoose.model("Team", Team);


let envDb;
if(process.env.NODE_ENV === "PRODUCTION") {
  envDb = dbCredentials.prod_db;
} else {
  envDb = dbCredentials.dev_db;
}

mongoose.connect(envDb);
