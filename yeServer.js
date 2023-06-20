process.stdin.setEncoding("utf8");
let http = require("http");
const path = require("path");
let express = require("express"); /* Accessing express module */
var fs = require("fs");
let app = express(); /* app is a request handler function */
const publicDirectoryPath = path.join(__dirname, '/templates');
const staticDirectory =  express.static(publicDirectoryPath);
app.use(staticDirectory);


let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 


app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

/*if (process.argv.length != 3) {
    process.stdout.write(`Usage summerCampServer.js portNum`);
    process.exit(1);
}

const portNum = process.argv[2];*/
const portNum = process.env.PORT || 4005
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { json } = require("express/lib/response");

const uri = `mongodb+srv://${userName}:${password}@cluster0.h3ibh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


let prompt = "Type stop to shutdown the server: ";
console.log(prompt);
process.stdin.on("readable", function () {
    let input = process.stdin.read();
    if (input !== null) {
        let command = input.trim();
        if (command === "stop") {
            console.log("Shutting down the server\n");
            process.exit(0);
        } 
        else {
            console.log(`Invalid command: ${command}\n`);
        }
    }
    console.log(prompt);
    process.stdin.resume();
});

app.get("/", function (request, response) {
    console.log(request);
    response.render("index.ejs");
});

app.get("/apply", function (request, response) {
    console.log(request);
    let pNum = {port: "/processApp"};
    response.render("application.ejs", pNum);
});

app.post("/processApp", async function (request, response) {
    await client.connect();

    console.log("***** Processing application *****");
    console.log(request.body);
    let applicant = {name: request.body.name, email: request.body.email, quote: request.body.quote};
    const result = await client.db(db).collection(collection).insertOne(applicant);
    
    response.render("processApp.ejs", applicant);
    
});

app.get("/review", function (request, response) {
    console.log(request);
    let pNum = {port: "/processReview"};
    response.render("review.ejs", pNum);
});

app.post("/processReview", async function (request, response) {
    await client.connect();

    console.log("***** Looking up applicant *****");
    let filter = {email: request.body.email};
    const result = await client.db(db).collection(collection).findOne(filter);
    
    if (!result){
        let noneResult = {name: "NONE", email: "NONE", quote:"NONE"};
        response.render("processReview.ejs", noneResult);
    }
    else{
        response.render("processReview.ejs", result);
    }
    
});
/*
app.get("/gpa", function (request, response) {
    console.log(request);
    variable = {port: "http://localhost:"+portNum+"/processGPA"};
    response.render("GPA.ejs", variable);
});

app.post("/processGPA", async function (request, response) {
    await client.connect();

    let newTable = `<table border="1">
                    <tr>
                        <td><strong>Name</strong></td>
                        <td><strong>GPA</strong></td>
                    </tr>`

    console.log("***** Processing GPA request *****");
    let filter = {gpa: {$gte: request.body.gpa} };
    const cursor = await client.db(db).collection(collection).find(filter);
    
    const result = await cursor.toArray();
    result.forEach(applicant => {
        newTable += `<tr>
                    <td>${applicant.name}</td>
                    <td>${applicant.gpa}</td>
                  </tr>`;
    });
    newTable += `</table>`;
    let variable = {table: newTable}
    response.render("processGPA.ejs", variable);
    
});


app.get("/remove", function (request, response) {
    console.log(request);
    variable = {port: "http://localhost:"+portNum+"/processRemove"};
    response.render("remove.ejs", variable);
});

app.post("/processRemove", async function (request, response) {
    await client.connect();

    console.log("***** Removing applications *****");
    const result = await client.db(db).collection(collection).deleteMany({});
    variable = {deleted: result.deletedCount}
    response.render("processRemove.ejs", variable);
    
});
*/
console.log(`Server started on port ${portNum}`);
http.createServer(app).listen(portNum);