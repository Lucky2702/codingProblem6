const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

// API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select 
                            *
                         from 
                            player_details;`;
  const playerArr = await db.all(getPlayerQuery);
  response.send(
    playerArr.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `select 
                                       *
                                    from 
                                       player_details
                                    where
                                       player_id = ${playerId};`;
  const playerDetail = await db.get(getPlayerByIdQuery);
  response.send({
    playerId: playerDetail.player_id,
    playerName: playerDetail.player_name,
  });
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `update
                                    player_details
                                  set 
                                    player_name = '${playerName}'
                                  where
                                    player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select
                                *
                             from 
                                match_details
                             where
                                match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

// API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `select
                                       match_details.match_id,
                                       match_details.match,
                                       match_details.year
                                    from 
                                       match_details
                                       left join player_match_score
                                       on match_details.match_id =  player_match_score.match_id
                                    where
                                        player_match_score.player_id = ${playerId};`;
  const playerMatch = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatch.map((eachMatch) => ({
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    }))
  );
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `select
                                       player_details.player_id as playerId,
                                       player_details.player_name as playerName
                                    from 
                                       player_match_score natural join player_details
                                    where
                                        player_match_score.match_id = ${matchId};`;
  const matchPlayer = await db.all(getMatchPlayerQuery);
  response.send(
    matchPlayer.map((eachPlayer) => ({
      playerId: eachPlayer.playerId,
      PlayerName: eachPlayer.playerName,
    }))
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `select
                                       player_details.player_id,
                                       player_details.player_name as playerName,
                                       SUM(player_match_score.score) as score,
                                       SUM(player_match_score.fours) as four,
                                       SUM(player_match_score.sixes) as six
                                    from 
                                       player_details
                                       inner join player_match_score
                                       on player_details.player_id =  player_match_score.player_id
                                    where
                                        player_details.player_id = ${playerId};`;
  const matchPlayer = await db.get(getMatchPlayerQuery);
  response.send({
    playerId: matchPlayer["player_id"],
    PlayerName: matchPlayer["playerName"],
    totalScore: matchPlayer["score"],
    totalFour: matchPlayer["four"],
    totalSix: matchPlayer["six"],
  });
});

module.exports = app;
