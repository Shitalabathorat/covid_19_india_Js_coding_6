const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET API 1
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
 SELECT
 *
 FROM
 state;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(
    stateArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//API 2

const convertStateResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * 
    FROM state
    WHERE state_id=${stateId};`;
  let state = await db.get(getStateQuery);
  response.send(convertStateResponseObject(state));
});

//Get post 3
app.post("/districts/", async (request, response) => {
  const statesDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = statesDetails;
  const addStatesQuery = `
    INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths )
        VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addStatesQuery);
  console.log(dbResponse);

  const playerId = dbResponse.lastID;
  response.send("District Successfully Added");
});

//API 4th

const convertDistrictResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * 
    FROM district
    WHERE district_id=${districtId};`;
  let district = await db.get(getDistrictQuery);
  response.send(convertDistrictResponseObject(district));
});

//Delete API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictsQuery = `
    DELETE FROM
      district
    WHERE
      district_id=${districtId};`;
  await db.run(deleteDistrictsQuery);
  response.send("District Removed");
});

//APP PUT 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const updatedDistrictsQuery = `
    UPDATE 
    district
    SET
    district_name ='${districtName}' ,
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE 
        district_id=${districtId};`;
  await db.run(updatedDistrictsQuery);
  response.send("District Details Updated");
});

//7 API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
         SUM(cases),
         SUM(cured),
         SUM(active),
         SUM(deaths)
    FROM district
    WHERE state_id=${stateId};`;
  let stats = await db.get(getStateStatsQuery);

  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCases: stats["SUM(cured)"],
    totalCases: stats["SUM(active)"],
    totalCases: stats["SUM(deaths)"],
  });
});

//API 8

const convertResponseOfState = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
SELECT state_id from district
where district_id = ${districtId};`; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};`; //With this we will get state_name as stateName using the state_id
  const stateName = await db.get(getStateNameQuery);
  response.send(convertResponseOfState(stateName));
}); //sending the required response

module.exports = app;
