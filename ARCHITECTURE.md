#ARCHITECTURE
Current state of development and application architecture.

##HTML
The HTML should allow dynamic features and accessibility. 

###Style
Using tabs indented by the level of the DOM. ARIA should be used where it's needed made dynamic using JavaScript.

##JavaScript

Third party:
 - jQuery 2.*
 - JQuery UI tabs/core only no CSS

Currently the JavaScript exists as two parts one part for the UI(`ui.js`) and another part hosting the application(`app.js`). 

`ui.js` should contains all dynamic UI features that's a result of a consciously action made by an user. Such as menu dropdowns. Notifications/alerts should go into `app.js` because they might be unexpected and contain application error messages.

`app.js` should contain all application functionality such as API communication and input. Currently `app.js` has two methods.

###`init`
Initializes the application checking for API availability should in the future check things such as cookies and settings. 

```
warper.init();
``` 

###`alert`
Throws alerts(notifications). Takes notification type and message as input. Available types are `negative`, `progressive` and `default`.
```
warper.alert('negative', 'An error occurred');

warper.alert('progressive', 'Weeeeehoooo :-)');

warper.alert('default', 'Whatever we want to tell the user.');
```


Currently the `app.js` is written as object oriented but the `ui.js` is not, this is likely to change.

###Style
See [Airbnb JavaScript Style](https://github.com/airbnb/javascript).

##CSS

Third party: 
 - Wikimedia UI

All forms, buttons tables and equal is styled with the Wikimedia UI and is not likely to change. Layout and interface features not included in the Wikimedia UI is located in `wikimaps-style.css`.

###Style
Two spaces always. Write vanilla CSS with no preprocessing step. Browser support can be discussed for minor non breaking enhancements for other changes the three most recent browser releases should be supported.
