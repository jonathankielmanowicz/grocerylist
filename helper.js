const { WebClient } = require("@slack/client");

// Import Mongoose for db access
const mongoose = require("mongoose");

// Import Team model for mongoose querying
const Team = mongoose.model("Team");

// An access token (from your Slack app or custom integration - xoxp, xoxb, or xoxa)
let token;
let web;
let team;

// Keywords for message analysis
const greetings = ["hi", "hello", "hey", "greetings"];
const add = ["add"];
const show = ["show", "print", "display", "view"];
const remove = ["remove", "delete"];

function keywordInArray(array, message) {
  if(message.length > 0 && array.indexOf(message.split(" ")[0]) > -1) {
    return true;
  }
  return false;
}

/* Makes API request based on event type */
function actionToMessage(response) {
  // See: https://api.slack.com/methods/chat.postMessage
  web.chat.postMessage({ channel: response.channel, text: response.message, mrkdwn: true })
    .then((res) => {
      // `res` contains information about the posted message
      console.log("Message sent: ", res.ts);
    })
    .catch((error) => {
      switch (error.data.error) {
        case "invalid_auth":
          token = undefined;
          respondToEvent(response.event); // eslint-disable-line no-use-before-define
          break;
        default:
          console.log(error);
      }
    });
}

function eventToAction(event) {
  return new Promise((resolve, reject) => {
    // Different text scenarios
    const userMessage = event.text.toLowerCase();
    let responseMessage;

    if(keywordInArray(greetings, userMessage)) {
      // Respond with greeting
      const response = {
        event: event,
        channel: event.channel,
        message: "Hi there! I'm your grocery list.",
      };
      resolve(response);
    } else if(keywordInArray(add, userMessage)) {
      // Add items to grocery list and respond with confirmation
      const removeFirstWordReg = /\w+\s*(.*)/g;
      const cleanMessageArray = removeFirstWordReg.exec(userMessage);
      const cleanMessage = cleanMessageArray[1];

      // If there are no items following the command, return
      if(cleanMessage.length === 0) return;
      const additions = cleanMessage.split(",");

      // Create an array of item objects containing the name and quantity
      // of each item
      const cleanAdditions = additions.map((item) => {
        const reg = /(\d*)?\s*([\w \s+?]*)/g;
        const currItem = item.trim();

        const itemArray = reg.exec(currItem);

        // If no amount is specified, default to 1 item
        const itemQuanitity = itemArray[1] === undefined ? 1 : parseInt(itemArray[1]);
        const itemName = itemArray[2];
        return {
          itemName: itemName,
          quantity: itemQuanitity,
        };
      });

      Team.findOne({ team_id: team.team_id }, (err, currTeam) => {
        if(err) return console.log(err);

        // Get the team's grocery list map
        const currGroceryList = currTeam.grocery_list;

        const incrementedItems = [];

        /* We now have the current grocery list as currGroceryList and the items
         * to add as cleanAdditions. Now we must go through each addition, check
         * if it's in the existing list, and if so, increment the quantity
        */
        cleanAdditions.forEach((item) => {
          if(currGroceryList.has(item.itemName)) {
            // The item exists in the list already, so increment the quantity
            const itemInList = currGroceryList.get(item.itemName);
            itemInList.quantity = parseInt(itemInList.quantity) + item.quantity;
            incrementedItems.push({
              itemName: item.itemName,
              quantity: itemInList.quantity,
            });
          } else {
            // Add the new item to the list
            currGroceryList.set(item.itemName, { quantity: item.quantity });
          }
        });

        Team.update({ team_id: team.team_id }, {
          $set: {
            grocery_list: currGroceryList,
          },
        }, (error) => {
          if(error) return console.log(error);

          const numAdded = cleanAdditions.length === 1 ? "1 item" : `${cleanAdditions.length} items`;
          responseMessage = `Added *${numAdded}* to your grocery list.`;

          if(incrementedItems.length > 0) {
            responseMessage += "\nThe following quantities have been updated in your list:";
            incrementedItems.forEach((item) => {
              responseMessage += `\n• *${item.itemName}* is now set to *${item.quantity}*`;
            });
          }

          const response = {
            event: event,
            channel: event.channel,
            message: responseMessage,
          };

          resolve(response);
        });
      });
    } else if(keywordInArray(show, userMessage)) {
      // Print items to grocery list

      Team.findOne({ team_id: team.team_id }, (err, currTeam) => {
        if(err) return console.log(err);

        const currGroceryList = currTeam.grocery_list;
        const quantity = currGroceryList.size === 1 ? "1 item" : `${currGroceryList.size} items`;
        responseMessage = `You have *${quantity}* in your grocery list.`;

        currGroceryList.forEach((itemProperties, itemName) => {
          responseMessage += `\n• *${itemProperties.quantity}* x ${itemName}`;
        });

        const response = {
          event: event,
          channel: event.channel,
          message: responseMessage,
        };
        resolve(response);
      });
    } else if(keywordInArray(remove, userMessage)) {
      // Remove an item from the grocery list

      Team.findOne({ team_id: team.team_id }, (err, currTeam) => {
        if(err) return console.log(err);

        const removeFirstWordReg = /\w+\s*(.*)/g;
        const cleanMessageArray = removeFirstWordReg.exec(userMessage);
        const cleanMessage = cleanMessageArray[1];

        // If there are no items following the command, return
        if(cleanMessage.length === 0) return;
        const itemsToRemove = cleanMessage.split(",");

        // Create an array of item objects containing the name and quantity
        // of each item
        const cleanItemsToRemove = itemsToRemove.map((item) => {
          const reg = /(\d*)?\s*([\w \s+?]*)/g;
          const currItem = item.trim();

          const itemArray = reg.exec(currItem);

          // If no amount is specified, default to 1 item
          const itemQuanitity = itemArray[1] === undefined ? -1 : parseInt(itemArray[1]);
          const itemName = itemArray[2];
          return {
            itemName: itemName,
            quantity: itemQuanitity,
          };
        });
        // Get the team's grocery list map
        const currGroceryList = currTeam.grocery_list;
        const invalidItems = [];
        let numItemsRemoved = 0;

        /* We now have the current grocery list as currGroceryList and the items
         * to remove as cleanItemsToRemove. Now we must go through each removal, check
         * if it's in the existing list, and if so, remove it
        */
        cleanItemsToRemove.forEach((item) => {
          if(currGroceryList.has(item.itemName)) {
            if(item.quantity === -1) {
              // The item exists in the list and no quantity specified, so remove it
              currGroceryList.delete(item.itemName);
            } else {
              const itemProperties = currGroceryList.get(item.itemName);
              itemProperties.quantity -= item.quantity;

              // If there are < 0 of an item on the list, delete it from the list
              if(itemProperties.quantity > 0) {
                currGroceryList.set(item.itemName, itemProperties);
              } else {
                currGroceryList.delete(item.itemName);
              }
            }
            numItemsRemoved++;
          } else {
            // Add the new item to the list
            invalidItems.push(item);
          }
        });

        Team.update({ team_id: team.team_id }, {
          $set: {
            grocery_list: currGroceryList,
          },
        }, (error) => {
          if(error) console.log(error);

          const numRemoved = numItemsRemoved === 1 ? "1 item" : `${numItemsRemoved} items`;
          responseMessage = `You have removed *${numRemoved}* from your grocery list.`;

          if(invalidItems.length > 0) {
            responseMessage += "\nThe following items were not present in your grocery list:";
            invalidItems.forEach((remainingItem) => {
              responseMessage += `\n• ${remainingItem}`;
            });
          }

          const response = {
            event: event,
            channel: event.channel,
            message: responseMessage,
          };
          resolve(response);
        });
      });
    } else {
      reject();
    }
  });
}

// If it's the clients first request, set up the web client, then respond
function respondToEvent(event) {
  // Ignore if bot sends message
  if(event.subtype && event.subtype === "bot_message") {
    return;
  }

  if(!token) {
    Team.findOne({ users: event.user }, (err, currTeam) => {
      if(err) return console.log(err);

      if(!currTeam) {
        return console.log("user does not belong to any team");
      }

      token = currTeam.bot_access_token;
      web = new WebClient(token);
      team = currTeam;
      return eventToAction(event).then((response) => {
        actionToMessage(response);
      }, (error) => {
        if(error) console.log(error);
      });
    });
  } else {
    return eventToAction(event).then((response) => {
      actionToMessage(response);
    }, (error) => {
      if(error) console.log(error);
    });
  }
}

module.exports = {
  respondToEvent,
};
