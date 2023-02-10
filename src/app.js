const express = require("express");
const cors = require('cors')
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const chalk = require('chalk');
// app.use(cors());
const uuid = require('uuid');
const { now } = require("moment");
const { response } = require("express");
//Create connectiuon 
let con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "rian",
  database: "holidayDB",
  port: "3306",
  
})

app.use(cors());
//Connect to MySql
try {
  con.connect(function (err) {
    if (err) {
      if (err.code = 'ERR_INVALID_ARG_TYPE') {
        console.log("DB Error :  Unable to connect DB 2","err.code",err.code);
      }else if(err.code === "ECONNREFUSED"){
        res.send({
          Message: "  Unable to connect DB 2",
          status: 500,
        })
      }
    }
    else {
      console.log("");
    }
  });
} catch (error) {
  console.log(error)
}
// const { on } = require("events");
const locationValArray = ["ALL LOCATION",  "BETTENDORF,IA","INDIA"]
const locationDBObj = { "ALL LOCATION": "ALL LOCATION", "BETTENDORF,IA": "BETTENDORF,IA","INDIA": "INDIA",  }
const typeArray = ["FIXED", "OPTIONAL"]
const typeDBObj = { "FIXED": "F", "OPTIONAL": "O" }

//app.use(express.static(publicDirectoryPath));
app.use(bodyParser.urlencoded({ extended: true }));
// To parse json data
app.use(bodyParser.json());
app.use((req, res, next) => {
  //if (req.header("Content-Type") == "application/json" && req.header("Accept") == "application/json") {
  if (true) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "*");
    next();
  } else {
    res.status(415).send({ Message: "Unsupported header", status: 415 });
  }
})

app.use((error, req, res, next) => {

  if (error instanceof SyntaxError && error.status == 400 && "body" in error) {
    res.status(400).send({
      Message: " JSON format invalid",
      status: 400,
    })
  }
  next();
})



// For Filter year
app.get("/holidays/year/:value", cors(), (req, res) => {
  let value = req.params.value;
  let message = "";
  con.connect(function (req) {
    // con.query("SELECT HOLIDAY_ID as id, DATE_FORMAT(HOLIDAY, '%m-%d-%Y') as date,CASE WHEN LOC_CD ='IND' THEN 'India' WHEN LOC_CD ='ALL' THEN 'All Location' ELSE 'Bettendorf,IA' END as location , CASE WHEN HOLIDAY_TYPE = 'F' THEN 'Fixed' ELSE 'Optional' END as type,HOLIDAY_DESC as description FROM ETT_HOLIDAY   where YEAR(HOLIDAY) = " + value + " ORDER BY HOLIDAY", function (err, result, fields) {
      con.query("SELECT HOLIDAY_ID as id, DATE_FORMAT(HOLIDAY, '%m-%d-%Y') as date,CASE WHEN LOC_CD ='India' THEN 'India' WHEN (LOC_CD ='ALL Location' OR LOC_CD ='ALL')  THEN 'All Location' ELSE 'Bettendorf,IA' END as location , CASE WHEN HOLIDAY_TYPE = 'F' THEN 'Fixed' ELSE 'Optional' END as type,HOLIDAY_DESC as description FROM ETT_HOLIDAY   where YEAR(HOLIDAY) = " + value + " ORDER BY HOLIDAY", function (err, result, fields) {
      if (err) {
       
        res.status(500).send({ message: "DB  Connection not available", status: 500 });
      } else if (result.length == 0) {
        message = "Holidays not available for Year : " + value;
       res.status(404).send({ message: message, status: 404 });
      } else {
        message = "Holiday found of year: " + value;
        res.status(200).send({ message: message + value, status: 200, holidays: result, });
      }

    });
  });
});
app.get("/holidays/CheckConnection", (req, res) => {
  con.connect(function (req) {
    con.query("Select 'test' from dual", function (err, result, fields) {
      if (err) {
        res.status(500).send({ Message: "DB  Connection not available", status: 500 });
      }else
      res.status(200).send({ Message: "DB  Connection not available", status: 200 });
     
    });
  });
});

app.get("/holidays/:id", (req, res) => {
  let id = req.params.id;
  con.connect(function (req) {
    con.query("SELECT HOLIDAY_ID as id, DATE_FORMAT(HOLIDAY, '%Y-%m-%d') as date,CASE WHEN LOC_CD ='India' THEN 'India' WHEN LOC_CD ='All Location' THEN 'All Location' ELSE 'Bettendorf,IA' END as location , CASE WHEN HOLIDAY_TYPE = 'F' THEN 'Fixed' ELSE 'Optional' END as type,HOLIDAY_DESC as description FROM ETT_HOLIDAY   where HOLIDAY_ID = '" + id + "'", function (err, result, fields) {
      if (err) {
        res.status(500).send({ Message: "DB  Connection not available", status: 500 });
      }else
        if(result.length>0)
          res.status(200).send({  id:id,location:result[0].location ,description:result[0].description,type:result[0].type,date:result[0].date});
     
    });
  });

});
app.get("/health-check", function (req, res) { 
   res.status(200).send("Kicking and alive!!");
  });
// insert data
app.post("/holidays", cors(),(req, res) => {
  let successMessage = ""
  errorMessage = ""
  let id = uuid.v4();
  let reqDataNotProvided = req.body.type == "" || req.body.location == "" || req.body.date == "" || req.body.description == "" || (!locationValArray.includes((req.body.location).toUpperCase())) || (!typeArray.includes((req.body.type).toUpperCase()));
  if (reqDataNotProvided) {
    res.status(400).send({
      errorMessage: errorMessage,
      status: 400,
      holidays:{id:req.body.id,location:req.body.location ,description:req.body.description,type:req.body.type,date:req.body.date,errorMessage: "Please provide all required fields with valid values",}
      
    });
  }
  else {
    let query = "INSERT INTO `holidayDB`.`ETT_HOLIDAY`(`HOLIDAY_ID`,`ORG_CD`,`LOC_CD`,`HOLIDAY`,`HOLIDAY_TYPE`,`HOLIDAY_DESC`,`CRT_BY_USER`,`UPD_BY_USER`,`CRT_BY_TS`,`UPD_BY_TS`)VALUES(?,?,?,DATE(?),?,?,?,?,NOW(),NOW())";
   
    con.query(query, [id, 'CBP', locationDBObj[(req.body.location).toUpperCase()], req.body.date, typeDBObj[(req.body.type).toUpperCase()], req.body.description, 'SS', 'SS'], function (err, result) {
   

      if (err) {
      errorMessage = "DB Connection not available3" ;
        // <div class="text-danger pt-3 text-center">{{errorMessage}}</div>
        if (err.code == 'ER_DUP_ENTRY') {
  
          errorMessage = "Holiday already exist !"
        } 
        else if (err.code == 'ER_TRUNCATED_WRONG_VALUE') {
          errorMessage = err.sqlMessage;
        }
        res.send({
          errorMessage: errorMessage
        });
      }
      else {

        successMessage = "Holiday Created Successfully.";
        result = { "id":  id, "date": req.body.date, "location": req.body.location, "type": req.body.type, "description": req.body.description }
       
        res.status(201).send({
          successMessage: successMessage,
          status: 201,
          holidayData: {id,location:req.body.location ,description:req.body.description,type:req.body.type,date:req.body.date,successMessage}
          
        });
     
      }
    });
  }
}
);

app.put("/holidays/:id", (req, res) => {
  let errorMessage = "";
  successMessage = "";
  let reqDataNotProvided = req.body.type == "" || req.body.location == "" || req.body.date == "" || req.body.description == "" || (!locationValArray.includes((req.body.location).toUpperCase())) || (!typeArray.includes((req.body.type).toUpperCase()));
 if (reqDataNotProvided) {
    res.status(400).send({
     errorMessage: "Please provide all required fields with valid values"
    });
  } else {
    let query = "UPDATE ETT_HOLIDAY SET LOC_CD = ? , HOLIDAY = DATE(?), HOLIDAY_TYPE = ?, HOLIDAY_DESC = ?, UPD_BY_USER = 'SS', UPD_BY_TS = NOW() where HOLIDAY_ID  = ?";
    con.query(query, [locationDBObj[(req.body.location).toUpperCase()], req.body.date, typeDBObj[(req.body.type).toUpperCase()], req.body.description, req.body.id], function (err, result, fields) {
      if (err) {
        errorMessage = "DB Connection not available";
        if (err.code == 'ER_DUP_ENTRY') {
          errorMessage = "Holiday already exist!";
          res.status(406).send({ errorMessage: errorMessage });
        } else if (err.code == 'ER_TRUNCATED_WRONG_VALUE') {
          errorMessage = err.sqlMessage;
          res.send({ errorMessage: errorMessage });
          console.log("response.status 186",response.status)
        }else if (err.code = 'ERR_CONNECTION_REFUSED') {
          console.log("ERR_CONNECTION_REFUSED 188,",err.code)
          errorMessage = "DB Connection not available !";
          console.log("errorMessage",errorMessage)
    }
      } else {
      res.status(200).send({
       successMessage: "Holiday has been updated Successfully",
          status: 200,
          holiday: {
            "id": req.body.id,
            "date": req.body.date,
            "location": req.body.location,
            "type": req.body.type,
            "successMessage": "Holiday has been updated Successfully",
            "description": req.body.description
          }
          
        });
       
      }
    });
  }
})

app.delete("/holidays/:id", (req, res) => {
  let message = "";

  con.query(" DELETE FROM ETT_HOLIDAY where HOLIDAY_ID  = '" + req.params.id + "'", function (err, result, fields) {
    if (err) {
      message = "unable to delete";
    } else {
      message = "Holiday deleted";
    }
    res.status(200).send({
      message,
      status: 200,
      holiday: { "id": req.params.id }
    });
  });
});
app.listen(3002, () => {
  console.log("server is up on port 3002");
}).on('error', function (err) {
  if (err.code == "EADDRINUSE") {
    console.log("Port is already in use: 3002");
  }
});
