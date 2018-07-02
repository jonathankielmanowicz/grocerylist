# Grocery List

This project was designed for me to practice using the Slack API with NodeJS.

## Notable Tools Used
* NodeJS
* Express
* Babel
* ESLint (using Airbnb's best practices with minor customizations)
* MongoDB & Mongoose
* Dotenv (for setting environment variables)

## How To Interact with Grocery List
At the moment, the bot functions on a one-list-per-workspace basis. When installing the bot into your workspace, it will save your team along with all of its members to the database. From there, you can add @grocerylist to any channel, or message it directly.  
  
Simply begin a message with any of the following commands:

* add \< item1, item2, ... >
* show
* remove \< item1, item2, ... >

#### Adding Items with a Single Quantity
Begin a message with the word *add* followed by items seperated by commas. Each item will be added to the list with a quantity of 1. For example:

* *add cake*  
* *add milk, eggs, butter*

#### Adding Items of various Quantities
To add multiple of a single item (ex: *3 bananas*), simply add the quantity before the item. For example:

* *add 3 cookies, 2 apples*

You can also mix the two. For example:  

* *add milk, 2 pears, 5 avocados*

If you add an item that already exists in the list, it will increment the quantity and Grocery List will alert you of the updated count.

#### Removing Items completely
Begin a message with any of the words *remove, delete* followed by items seperated by commas. If no quantity is present before an item, it will be removed completely. For example:

*Existing List:*

* **3** x bananas
* **4** x apples

*Command:*
*remove apples*

*Updated List:*

* **3** x bananas

#### Decreasing the Quantity of an Item
If you include a number prior to the item name with any remove command, it will decrease the quantity by that value (if you remove more than is on the list, the entire item will be removed). For example:

*Existing List:*

* **3** x bananas
* **4** x apples

*Command:*
*remove 2 apples, 1 banana*

*Updated List:*

* **2** x bananas
* **2** x apples

#### Printing Out the List
Begin a message with any of the words *show, print, display, view*. Grocery List will respond with the number of items in your list followed by the list itself.

## Upcoming Improvements

- [ ] Multiple shared lists per workspace  
- [ ] Private lists for individual users


## FAQ

#### Why did I choose to make a grocery list bot?

My roommates and tend to pick up groceries on-the-go, and tend to message one another at rather inconvenient times asking which items to buy. With this Slackbot, we can communally add things to the list as they come to mind without interfering with each other's schedule.

#### Aren't there many Slackbots that can make lists?

Yes! I've goen through a few, but they tend to revolve around task lists or have other structures that don't align well with my household dynamic.

## Helpful Resources I Used

* [Slack Web API](https://api.slack.com/web)
* [Slack Events API](https://api.slack.com/events-api)
* [Ginger](http://integratedinnovation.xsead.cmu.edu/gallery/projects/ginger-the-grocery-bot)
