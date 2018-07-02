const mongoose = require("mongoose");

const Team = new mongoose.Schema({
  access_token: String,
  team_name: String,
  team_id: String,
  users: [String],
  incoming_channel: String,
  incoming_channel_id: String,
  incoming_config_url: String,
  incoming_url: String,
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
