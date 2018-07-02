const mongoose = require("mongoose");

const Team = new mongoose.Schema({
  access_token: String,
  team_name: String,
  team_id: String,
  users: [String],
  bot_user_id: String,
  bot_access_token: String,
  raw_json: String,
  grocery_list: {
    type: Map,
    of: {
      quantity: Number,
    },
  },
});

module.exports = Team;
