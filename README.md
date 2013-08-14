## Pod Architecture

![x](https://raw.github.com/alexandraorth/server_architecture/master/public/screenshot2.png)

This "Pod Architecture" app was built to show the communications between servers and applications within an AppFirst pod.

This app was built using a Sinatra backend coupled with a MongoDB database. It uses backbone.js for the frontend/UI. The Sinatra part acts as a custom "api" for the app. It makes calls to the AppFirst API (using the credentials specified in app.rb) and stores the modified results in the database. The app would be extremely slow if it needed to contact the AppFirst API every time a node was modified, and using a database to store the data is a good way to speed up load times.

The backbone.js frontend loads the topology data for whatever time you specify using the slider. Please note that data is only available if you have made a call to the topology API. As such, the first step when using this app would be to populate your database using api calls. If this app were to be used by a client, I would recommend automating this process so that the topology data is called and stored in the database every minute. This would give the user of the application access to a larger amount, and more varied, data.

## To start application:

Make sure you have ruby and mongodb installed. The easiest way to do this on osx is to use homebrew. 

* clone git repo
* add authentication information (api key and password) to "app.rb"
* run 'bundle install'
* run 'foreman start'
* go to localhost:4567
* (Make sure you have populated your database before using the application)

## To Populate Database (api calls)

###localhost:4567/api/appfirst

This API call will store all of the topology data from the last collector upload in the database. 

This is the only API call that should be made more than once, and the one that should be automated if this system is ever used permanently.

###localhost:4567/api/appfirstApplication

Make this API call once to populate the database with information about the applicaitons in your pod. If you wish to update this data, please empty the "application" collection in your database first. 

###localhost:4567/api/appfirstServerSets

Make this API call once to populate the database with information about the server sets in your pod. If you wish to update this data, please empty the "Serverset" collection in your database first. 



![x](https://raw.github.com/alexandraorth/server_architecture/master/public/screenshot.png)


Please take a look at my first application from the summer, AppFirst Alerting, [here](https://github.com/appfirst/automated_alerting_app). 