/** Express API router for users in get5.
 * @module routes/servers
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

/** AES Module for Encryption/Decryption
 * @const
 */
const aes = require('aes-js');

/** Crypto for assigning random  */
const crypto = require('crypto');

/** Config to get database key.
 * @const
 */
const config = require('config');


/** Ensures the user was authenticated through steam OAuth.
 * @function
 * @memberof module:routes/servers
 * @function
 * @inner */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/steam');
}

/** GET - Route serving to get all game servers.
 * @name router.get('/')
 * @function
 * @memberof module:routes/servers
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 * @param {int} user_id - The user ID that is querying the data.
 */
router.get("/", async (req, res, next) => {
  try {
    // Check if admin, if they are use this query.
    let sql = "SELECT gs.id, gs.in_use, gs.display_name, gs.ip_string, gs.port, usr.name FROM game_server gs, user usr where gs.public_server=1 AND usr.id = gs.user_id";
    const allServers = await db.query(sql);
    res.json(allServers);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});


/** GET - Route serving to get all game servers.
 * @name router.get('/myservers')
 * @function
 * @memberof module:routes/servers
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 * @param {int} user_id - The user ID that is querying the data.
 */
router.get("/myservers", ensureAuthenticated, async (req, res, next) => {
  try {
    // Check if admin, if they are use this query.
    let sql = "SELECT * FROM game_server where id = ?";
    const allServers = await db.query(sql, [req.user.id]);
    for(let serverRow of allServers) {
      serverRow.rcon_password = await decrypt(serverRow.rcon_password);
    }
    res.json(allServers);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** GET - Route serving to get one game server by database id.
 * @name router.get('/:server_id')
 * @memberof module:routes/servers
 * @function
 * @param {string} path - Express path
 * @param {number} request.param.server_id - The ID of the game server.
 * @param {callback} middleware - Express middleware.
 * @param {int} user_id - The user ID that is querying the data. Check if they own it or are an admin.
 */
router.get("/:server_id", ensureAuthenticated, async (req, res, next) => {
  try {
    // 
    serverID = req.params.server_id;
    let sql = "SELECT * FROM game_server where id = ? AND user_id = ?";
    const server = await db.query(sql, [serverID, req.user.id]);
    server[0].rcon_password = await decrypt(server[0].rcon_password);
    res.json(server);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

/** POST - Create a game server in the database, and encrypt the password. 
 * @name router.post('/create')
 * @memberof module:routes/servers
 * @function
 * @param {int} req.body[0].user_id - The ID of the user creating the server to claim ownership.
 * @param {string} req.body[0].ip_string - The host of the server. Can be a URL or IP Address.
 * @param {int} req.body[0].port - The port that the server is used to connect with.
 * @param {string} req.body[0].display_name - The name that people will see on the game panel.
 * @param {string} req.body[0].rcon_password - The RCON password of the server. This will be encrypted on the server side.
 * @param {int} req.body[0].public_server - Integer value evaluating if the server is public.
 *
*/
router.post("/create", async (req, res, next) => {
  try{
    await db.withTransaction(db, async () => {
      let userId = req.body[0].user_id;
      let ipString = req.body[0].ip_string;
      let port = req.body[0].port;
      let displayName =  req.body[0].display_name;
      let rconPass = await encrypt(req.body[0].rcon_password);
      let publicServer = req.body[0].public_server;
      let sql = "INSERT INTO game_server (user_id, ip_string, port, rcon_password, display_name, public_server) VALUES (?,?,?,?,?,?)";
      await db.query(sql, [userId, ipString, port, displayName, rconPass, publicServer]);
      res.json("Game server inserted successfully!");
    });
  } catch ( err ) {
    res.status(500).json({message: err})
  }
});

/** PUT - Update a game server in the database, and encrypt the password. 
 * @name router.put('/update')
 * @memberof module:routes/servers
 * @function
* @param {int} req.body[0].user_id - The ID of the user creating the server to claim ownership.
 * @param {int} req.body[0].server_id - The ID of the server being updated.
 * @param {string} req.body[0].ip_string - The host of the server. Can be a URL or IP Address.
 * @param {int} req.body[0].port - The port that the server is used to connect with.
 * @param {string} req.body[0].display_name - The name that people will see on the game panel.
 * @param {string} req.body[0].rcon_password - The RCON password of the server. This will be encrypted on the server side.
 * @param {int} req.body[0].public_server - Integer value evaluating if the server is public.
 *
*/
router.put("/update", ensureAuthenticated, async (req, res, next) => {
  let userCheckSql = "SELECT * FROM game_server WHERE user_id = ?";
  const checkUser = await db.query(userCheckSql, [req.user.id]);
  if (checkUser.length < 1 || req.user.super_admin !== 1){
    res.status(401).json({message: "User is not authorized to perform action."});
  }
  try{
    await db.withTransaction(db, async () => {
      let userId =  req.body[0].user_id;
      let serverId = req.body[0].server_id;
      let updateStmt = {
      ipString: req.body[0].ip_string,
      port: req.body[0].port,
      displayName: req.body[0].display_name,
      rconPass: await encrypt(req.body[0].rcon_password),
      publicServer: req.body[0].public_server
      };
      // Remove any unwanted nulls.
      updateStmt = await db.buildUpdateStatement(updateStmt);
      let sql = "UPDATE game_server SET ? WHERE user_id = ? AND id = ?";
      updatedServer = await db.query(sql, [updateStmt, userId, server_id]);
      if (updatedServer.affectedRows > 0)
        res.json("Game server updated successfully!");
      else
        res.status(401).json({message: "ERROR - Game server not updated."});
    });
  } catch ( err ) {
    res.status(500).json({message: err});
  }
});

/** DEL - Delete a game server in the database.
 * @name router.delete('/delete')
 * @memberof module:routes/servers
 * @function
 * @param {int} req.body[0].user_id - The ID of the user creating the server to claim ownership.
 * @param {int} req.body[0].server_id - The ID of the server being updated.
 *
*/
router.delete("/delete", ensureAuthenticated, async (req,res,next) => {
  try {
    let checkUserSql = "SELECT * FROM game_server WHERE user_id = ?";
    const checkUser = await db.query(checkUserSql, [req.user.id]);
    if (checkUser.length < 1 || req.user.super_admin !== 1) {
      res.status(401).json({message: "User is not authorized to perform action."});
    }
    await db.withTransaction (db, async () => {
      let userId = req.body[0].user_id;
      let serverId = req.body[0].server_id;
      let sql = "DELETE FROM game_server WHERE id = ? AND user_id = ?"
      const delRows = await db.query(sql, [serverId, userId]);
      if (delRows.affectedRows > 0)
        res.json("Game server deleted successfully!");
      else
        res.status(401).json("ERR - Unauthorized to delete.");
    });
  } catch( err ){
    console.log(err);
    res.statuss(500).json({message: err});
  }
});


/** Inner function - Supports encryption and decryption for the database keys to get server RCON passwords.
 * @name decrypt
 * @function
 * @inner
 * @memberof module:routes/servers
 * @param {string} source - The source to be decrypted.
 */
async function decrypt(source) {
  try{
    if(source === null)
      return;
    let byteSource = aes.utils.hex.toBytes(source.substring(32));
    let IV = aes.utils.hex.toBytes(source.substring(0,32));
    let key = aes.utils.utf8.toBytes(config.get("Keys.dbKey"));
    let aesCbc = new aes.ModeOfOperation.ofb(key, IV);
    let decryptedBytes = aesCbc.decrypt(byteSource);
    let decryptedText = aes.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText;
  } catch ( err ){
    console.log(err);
    // fail silently.
    return null;
  }
}

/** Inner function - Supports encryption and decryption for the database keys to get server RCON passwords.
 * @name encrypt
 * @function
 * @inner
 * @memberof module:routes/servers
 * @param {string} source - The source to be decrypted.
 */
async function encrypt(source) {
  try{
    if(source === null)
      return;
    
    let byteSource = aes.utils.utf8.toBytes(source);
    let IV = crypto.randomBytes(16);
    let key = aes.utils.utf8.toBytes(config.get("Keys.dbKey"));
    let aesCbc = new aes.ModeOfOperation.ofb(key, IV);
    let encryptedBytes = aesCbc.encrypt(byteSource);
    let encryptedHex = aes.utils.hex.fromBytes(encryptedBytes);
    let hexIV = aes.utils.hex.fromBytes(IV);
    console.log(encryptedHex);
    encryptedHex = hexIV + encryptedHex;
    console.log(encryptedHex);
    return encryptedHex;
  } catch ( err ){
    console.log(err);
    throw err
  }
}

module.exports = router;