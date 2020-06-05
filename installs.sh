#!/bin/bash
#this is a list of required modules and installs to make the website work
#hopefilly i can just run this file and it would install all of the files
#needed for the entire project

sudo apt-get update
sudo apt install curl
curl -sL https://deb.nodesource.com/setup_14.x | bash -
apt-get install -y nodejs
npm install -g nodemon
npm install body-parser
npm install ejs
#bellow are all for mongodb
curl https://www.mongodb.org/static/pgp/server-4.0.asc | sudo apt-key add -
sudo nano /etc/apt/sources.list.d/mongodb-org-4.0.list
deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main
sudo apt update
sudo apt-get install mongodb-org
#end of mongodb commands
npm install mongoose
npm install express-session
npm install passport-local-mongoose
npm install passport-google-oauth20
npm install findOrCreate
