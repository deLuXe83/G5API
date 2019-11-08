/** Express API router for users in get5.
 * @module routes/playerstats
 * @requires express
 * @requires db
 */
const express = require("express");

/** Express module
 * @const
 */

const router = express.Router();
/** Database module.
 * @const
 */

const db = require("../db");

/** GET - Route serving to get all player statistics.
 * @name router.get('/')
 * @function
 * @memberof module:routes/playerstats
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 * @param {int} user_id - The user ID that is querying the data.
 */
// TODO: Once users are taken care of, and we track which user is logged in whe need to give a different SQL string, one for all matches, one for user matches.
router.get("/", async (req, res, next) => {
  try {
    // Check if admin, if they are use this query.
    let sql = "SELECT * FROM player_stats";
    const playerStats = await db.query(sql);
    res.json(playerStats);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** GET - Route serving to get all player stats via a given user.
 * @name router.get('/:steam_id')
 * @memberof module:routes/playerstats
 * @function
 * @param {string} path - Express path
 * @param {number} request.param.steam_id - The ID of the match containing the statistics.
 * @param {callback} middleware - Express middleware.
 */
router.get("/:steam_id", async (req, res, next) => {
  try {
    //
    steamID = req.params.steam_id;
    let sql = "SELECT * FROM player_stats where steam_id = ?";
    const playerStats = await db.query(sql, steamID);
    res.json(playerStats);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** GET - Route serving to get all player stats within a match.
 * @name router.get('/match/:match_id')
 * @memberof module:routes/playerstats
 * @function
 * @param {string} path - Express path
 * @param {number} request.param.match_id - The ID of the match containing the statistics.
 * @param {callback} middleware - Express middleware.
 */
router.get("/match/:match_id", async (req, res, next) => {
  try {
    //
    matchID = req.params.match_id;
    let sql = "SELECT * FROM player_stats where match_id = ?";
    const playerStats = await db.query(sql, matchID);
    res.json(playerStats);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** POST - Create a veto object from a given match.
 * @name router.post('/create')
 * @memberof module:routes/playerstats
 * @function
 * @param {int} req.body[0].match_id - The ID of the match.
 * @param {int} req.body[0].map_id - The ID of the map being played in the match, used in series.
 * @param {int} req.body[0].team_id - The team ID the player is being registered as.
 * @param {string} req.body[0].steam_id - The users' steam ID.
 * @param {string} req.body[0].name - The users' in game name.
 * @param {int} [req.body[0].kills] - Optional amount of kills.
 * @param {int} [req.body[0].deaths] - Optional amount of deaths.
 * @param {int} [req.body[0].roundsplayed] - Optional amount of rounds played
 * @param {int} [req.body[0].assists] - Amount of assists.
 * @param {int} [req.body[0].flashbang_assists] - Amount of registered flashbang assists.
 * @param {int} [req.body[0].teamkills] - Amount of teamkills player has given.
 * @param {int} [req.body[0].suicides] - Amount of player suicides.
 * @param {int} [req.body[0].headshot_kills] - Amount of headshot kills.
 * @param {int} [req.body[0].damage] - Total damage the player has given.
 * @param {int} [req.body[0].bomb_plants] - Amount of bomb plants within given map/match.
 * @param {int} [req.body[0].bomb_defuses] - Amount of bomb defuses within given map/match.
 * @param {int} [req.body[0].v1] - Amount of 1v1 situations won.
 * @param {int} [req.body[0].v2] - Amount of 1v2 situations won.
 * @param {int} [req.body[0].v3] - Amount of 1v3 situations won.
 * @param {int} [req.body[0].v4] - Amount of 1v4 situations won.
 * @param {int} [req.body[0].v5] - Amount of 1v5 situations won.
 * @param {int} [req.body[0].k1] - Amount of 1 kill rounds.
 * @param {int} [req.body[0].k2] - Amount of 2 kill rounds.
 * @param {int} [req.body[0].k3] - Amount of 3 kill rounds.
 * @param {int} [req.body[0].k4] - Amount of 4 kill rounds.
 * @param {int} [req.body[0].k5] - Amount of ace (5 kill) rounds.
 * @param {int} [req.body[0].firstdeath_Ct] - Amount of times player died first as Counter-Terrorist.
 * @param {int} [req.body[0].firstdeath_t] - Amount of times player died first as Terrorist.
 * @param {int} [req.body[0].firstkill_ct] - Amount of times player has gotten first kill as Counter-Terrorist.
 * @param {int} [req.body[0].firstkill_t] - Amount of times player has gotten first kill as Terrorist.
 */
router.post("/create", async (req, res, next) => {
  try {
    await withTransaction(db, async () => {
      let insertSet = {
        match_id: req.body[0].match_id,
        map_id: req.body[0].map_id,
        team_id: req.body[0].team_id,
        steam_id: req.body[0].steam_id,
        name: req.body[0].name || null,
        kills: req.body[0].kills || null,
        deaths: req.body[0].deaths || null,
        roundsplayed: req.body[0].roundsplayed || null,
        assists: req.body[0].assists || null,
        flashbang_assists: req.body[0].flashbang_assists || null,
        teamkills: req.body[0].teamkills || null,
        suicides: req.body[0].suicides || null,
        headshot_kills: req.body[0].headshot_kills || null,
        damage: req.body[0].damage || null,
        bomb_plants: req.body[0].bomb_plants || null,
        bomb_defuses: req.body[0].bomb_defuses || null,
        v1: req.body[0].v1 || null,
        v2: req.body[0].v2 || null,
        v3: req.body[0].v3 || null,
        v4: req.body[0].v4 || null,
        v5: req.body[0].v5 || null,
        k1: req.body[0].k1 || null,
        k2: req.body[0].k2 || null,
        k3: req.body[0].k3 || null,
        k4: req.body[0].k4 || null,
        k5: req.body[0].k5 || null,
        firstdeath_Ct: req.body[0].firstdeath_Ct || null,
        firstdeath_t: req.body[0].firstdeath_t || null,
        firstkill_ct: req.body[0].firstkill_ct || null,
        firstkill_t: req.body[0].firstkill_t || null
      };
      let sql = "INSERT INTO player_stats SET ?";
      // Remove any values that may not be inserted off the hop.
      for (let key in updateStmt) {
        if (updateStmt[key] === null) delete updateStmt[key];
      }
      await db.query(sql, [insertSet]);
      res.json("Player Stats inserted successfully!");
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** PUT - Create a veto object from a given match.
 * @name router.post('/update')
 * @memberof module:routes/playerstats
 * @function
 * @param {int} req.body[0].match_id - The ID of the match.
 * @param {int} req.body[0].map_id - The ID of the map being played in the match, used in series.
 * @param {string} req.body[0].steam_id - The users' steam ID.
 * @param {string} req.body[0].name - The users' in game name.
 * @param {int} [req.body[0].kills] - Optional amount of kills.
 * @param {int} [req.body[0].deaths] - Optional amount of deaths.
 * @param {int} [req.body[0].roundsplayed] - Optional amount of rounds played
 * @param {int} [req.body[0].assists] - Amount of assists.
 * @param {int} [req.body[0].flashbang_assists] - Amount of registered flashbang assists.
 * @param {int} [req.body[0].teamkills] - Amount of teamkills player has given.
 * @param {int} [req.body[0].suicides] - Amount of player suicides.
 * @param {int} [req.body[0].headshot_kills] - Amount of headshot kills.
 * @param {int} [req.body[0].damage] - Total damage the player has given.
 * @param {int} [req.body[0].bomb_plants] - Amount of bomb plants within given map/match.
 * @param {int} [req.body[0].bomb_defuses] - Amount of bomb defuses within given map/match.
 * @param {int} [req.body[0].v1] - Amount of 1v1 situations won.
 * @param {int} [req.body[0].v2] - Amount of 1v2 situations won.
 * @param {int} [req.body[0].v3] - Amount of 1v3 situations won.
 * @param {int} [req.body[0].v4] - Amount of 1v4 situations won.
 * @param {int} [req.body[0].v5] - Amount of 1v5 situations won.
 * @param {int} [req.body[0].k1] - Amount of 1 kill rounds.
 * @param {int} [req.body[0].k2] - Amount of 2 kill rounds.
 * @param {int} [req.body[0].k3] - Amount of 3 kill rounds.
 * @param {int} [req.body[0].k4] - Amount of 4 kill rounds.
 * @param {int} [req.body[0].k5] - Amount of ace (5 kill) rounds.
 * @param {int} [req.body[0].firstdeath_Ct] - Amount of times player died first as Counter-Terrorist.
 * @param {int} [req.body[0].firstdeath_t] - Amount of times player died first as Terrorist.
 * @param {int} [req.body[0].firstkill_ct] - Amount of times player has gotten first kill as Counter-Terrorist.
 * @param {int} [req.body[0].firstkill_t] - Amount of times player has gotten first kill as Terrorist.
 */
router.put("/update", async (req, res, next) => {
  try {
    await withTransaction(db, async () => {
      let updateStmt = {
        name: req.body[0].name || null,
        kills: req.body[0].kills || null,
        deaths: req.body[0].deaths || null,
        roundsplayed: req.body[0].roundsplayed || null,
        assists: req.body[0].assists || null,
        flashbang_assists: req.body[0].flashbang_assists || null,
        teamkills: req.body[0].teamkills || null,
        suicides: req.body[0].suicides || null,
        headshot_kills: req.body[0].headshot_kills || null,
        damage: req.body[0].damage || null,
        bomb_plants: req.body[0].bomb_plants || null,
        bomb_defuses: req.body[0].bomb_defuses || null,
        v1: req.body[0].v1 || null,
        v2: req.body[0].v2 || null,
        v3: req.body[0].v3 || null,
        v4: req.body[0].v4 || null,
        v5: req.body[0].v5 || null,
        k1: req.body[0].k1 || null,
        k2: req.body[0].k2 || null,
        k3: req.body[0].k3 || null,
        k4: req.body[0].k4 || null,
        k5: req.body[0].k5 || null,
        firstdeath_Ct: req.body[0].firstdeath_Ct || null,
        firstdeath_t: req.body[0].firstdeath_t || null,
        firstkill_ct: req.body[0].firstkill_ct || null,
        firstkill_t: req.body[0].firstkill_t || null
      };
      // Remove any values that may not be updated.
      for (let key in updateStmt) {
        if (updateStmt[key] === null) delete updateStmt[key];
      }
      let sql =
        "UPDATE player_stats SET ? WHERE map_id = ? AND match_id = ? AND steam_id = ?";
      const updatedPlayerStats = await db.query(sql, [
        updateStmt,
        req.body[0].map_id,
        req.body[0].match_id,
        req.body[0].steam_id
      ]);
      if (updatedPlayerStats.affectedRows > 0)
        res.json("Player Stats were updated successfully!");
      else {
        sql = "INSERT INTO player_stats SET ?";
        // Update values to include match/map/steam_id.
        updateStmt.steam_id = req.body[0].steam_id;
        updateStmt.map_id = req.body[0].map_id;
        updateStmt.match_id = req.body[0].match_id;
        // Does the new player HAVE to be on a team? Technically not... Even if they are a standin.
        // updateStmt.team_id = req.body[0].team_id;
        await db.query(sql, [updateStmt]);
        res.json("Player Stats Inserted Successfully!");
      }
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** DEL - Delete all match data associated with a match, including stats, vetoes, etc. **NOT IMPLEMENTED**
 * @name router.delete('/delete')
 * @memberof module:routes/playerstats
 * @function
 * @param {int} req.body[0].user_id - The ID of the user deleteing. Can check if admin when implemented.
 * @param {int} req.body[0].match_id - The ID of the match to remove all values pertaining to the match.
 *
 */
router.delete("/delete", async (req, res, next) => {
  try {
    throw "NOT IMPLEMENTED";
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** Inner function - boilerplate transaction call.
 * @name withTransaction
 * @function
 * @inner
 * @memberof module:routes/vetoes
 * @param {*} db - The database object.
 * @param {*} callback - The callback function that is operated on, usually a db.query()
 */
async function withTransaction(db, callback) {
  try {
    await db.beginTransaction();
    await callback();
    await db.commit();
  } catch (err) {
    await db.rollback();
    throw err;
  } /*finally {
    await db.close();
  }*/
}

module.exports = router;
