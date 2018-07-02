require("dotenv").config();
require("./config/db-config.js");

// Initialize using verification token from environment variables
const createSlackEventAdapter = require("@slack/events-api").createSlackEventAdapter; // eslint-disable-line prefer-destructuring
const { WebClient } = require("@slack/client");

// Create Slack Event Adapter
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);


const client = new WebClient();
const clientId = process.env.SLACK_CLIENT_ID;
const clientSecret = process.env.SLACK_CLIENT_SECRET;
const PORT = process.env.PORT || 8765;


// Import express app
const express = require("express");
const bodyParser = require("body-parser");

// Import Mongoose for db access
const mongoose = require("mongoose");

// Import Team model for mongoose querying
const Team = mongoose.model("Team");

// Import the helper and db files
const respondToEvent = require("./helper.js");

// Instantiates Express and assigns our app variable to it
const app = express();
app.use(bodyParser.json());

// Mount the event handler on a route
app.use("/event", slackEvents.expressMiddleware());

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on("message", (event) => {
  console.log(event);
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
  respondToEvent(event);
});

// Handle errors (see `errorCodes` export)
slackEvents.on("error", console.error);

// Lets start our server
app.listen(PORT, () => {
  // Callback triggered when server is successfully listening. Hurray!
  console.log(`Grocery List listening on port ${PORT}`);
});

// This route handles GET requests to our root address and responds with message
app.get("/", (req, res) => {
  res.send(`Server is up and running! Path: ${req.url}`);
});

// This route handles get request to a /oauth endpoint.
// We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get("/oauth", (req, res) => {
  console.log("hitting oauth");
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint.
  // If that code is not there, we respond with an error message
  if(!req.query.code) {
    res.status(500);
    res.send({ Error: "Looks like we're not getting code." });
    console.log("Looks like we're not getting code.");
  } else {
    // If it's there...
    console.log("got the code!");
    client.oauth.access({
      client_id: clientId,
      client_secret: clientSecret,
      code: req.query.code,
    }).then((responseText) => {
      // Good idea to save the access token to your database
      const accessToken = responseText.access_token;
      const teamName = responseText.team_name;
      const teamId = responseText.team_id;
      const userId = responseText.user_id;

      const botUserId = responseText.bot.bot_user_id;
      const botAccessToken = responseText.bot.bot_access_token;

      const newTeam = {
        access_token: accessToken,
        team_name: teamName,
        team_id: teamId,
        users: [userId],
        bot_user_id: botUserId,
        bot_access_token: botAccessToken,
        raw_json: JSON.stringify(responseText),
        grocery_list: {},
      };

      // make a new team entry or update existing one
      Team.findOneAndUpdate({ team_id: teamId }, newTeam, { upsert: true, new: true }, (err) => {
        if(err) console.log(err);

        console.log("saved:", newTeam);
      });
    }).catch(console.error);
    res.send("Successfully installed Grocery List!");
  }
});
