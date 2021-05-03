const express = require('express');
var path = require('path');
var cron = require('node-cron');
// var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let config = require('./services/config.json');
require('dotenv').config();

// Initializing for AWS Cognito Authorization.
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

const poolData = {
  UserPoolId : config.poolId, // Your user pool id here
  ClientId : config.clientId // Your client id here
};

const pool_region = config.region;

// Init App
var app = express();

var cors = require('cors')

var whitelist = [
  'https://apps.clublacrosse.org',
  'http://localhost:3000', // Local Development
  'http://club-lacrosse-website-stage.s3-website-us-east-1.amazonaws.com', // Staging S3 bucket
  'https://dy8zvdrrzxveo.cloudfront.net', // Staging CloudFront
  'https://staging.clublacrosse.org', // Staging
  'http://club-lacrosse-website-production.s3-website-us-east-1.amazonaws.com', // Production S3 Bucket
  'https://d2f51lg1y2b6dm.cloudfront.net', // Production CloudFront
  'https://members.clublacrosse.org', // Production
]

var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
// CORS had been throwing error on APIs, so, commented it for now until other priority tasks are done.
// app.use(cors(corsOptions));
// View Engine
app.set('views', path.join(__dirname, 'views'));
// app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'ejs');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());

//Listen on port 3000
const server = app.listen(3000, () => {
  console.log('listening on *:3000');
});
app.get('/abc.html', function(req, res){
  res.sendFile(__dirname + '/abc.html');
});
const https = require('https');
var routes = require('./routes/routes');

const { sequelize, Game, GameParticipant, MemberTeam, IntraGameData , Team, Player, Stat, Member, MemberData, Event, MemberEvent, MemberLoginAudit, MemberToken, EventLocation, EventFormat, GamesBracket, GamesBracketDisplay, MemberPlayer, MemberAssociation, MemberAssociationType, Organization } = require('./sequelize');

var io = require('socket.io')(server);

var interVal;
var tournamentInterVal;
let obj = {};
io.use(function(socket, next){
  let token = socket.handshake.query.token;
  if (socket.handshake.query && token){
    ValidateToken(token, next);
  } else {
    next(new Error('Authentication error'));
  }
}).on('connection', function(socket){
  var client_id = socket.id;
  console.log('A user connected.', process.env['KEY_ID']);

  socket.on('sub', function(data){
    socket.emit('hello' , data);
    console.log("data          " , data);
  });

  socket.on('join-room' , function(data){
    if (data.game_id) {
      socket.join(data.game_id);
      // socket.emit('room' , 'User joined the room.');
    }else if(data.event_id){
      var event_id = data.event_id;
      let division_id = data.division_id;
      get_tournament_games(socket , event_id, division_id);
      socket.join(data.event_id);
      // socket.emit('room' , 'User joined the events room.');
      io.in(data.event_id).clients((err , clients) => {
        // clients will be array of socket ids , currently available in given room
        if (clients.length == 1) {
          // If Interval not already exist then create one. Otherwise when user kills the app without leaving the room, 
          // interval keeps on going and multiple intervals are created for single user.
          if (obj[event_id]) {
            clearInterval(obj[event_id]['intervalId']);
          }
          tournamentInterVal = setInterval(function () {
            get_tournament_games(socket , data.event_id, division_id);
          }, 4000);
          obj[event_id] = {
            "client": [client_id],
            "intervalId": tournamentInterVal,
            "roomId": event_id
          }
        }
        console.log("OBJ:           " , obj[event_id]);
      });
    }else{
      socket.emit('room' , 'Room name not found.');
    }
  });

  socket.on('leave-room' , function(data){
    if (data.game_id) {
      socket.emit('room' , 'User left the room.');
      socket.leave(data.game_id);
    }else if(data.event_id){
      socket.leave(data.event_id);
      socket.emit('room' , 'User left the events room.');
      let event_id = data.event_id;
      io.in(event_id).clients((err , clients) => {
        if (clients.length == 0) {
          tournamentInterVal = null;
          if (obj[event_id]) {
            console.log("Clearing the interval from object.");
            clearInterval(obj[event_id]['intervalId']);
          }else{
            console.log("Clearing the interval from variable.");
            clearInterval(tournamentInterVal);
          }
          // Deleting the room object if there is no client in the room.
          delete obj[event_id];
          console.log("OBJ:   " , obj);
        }
      });
    }else{
      socket.emit('room' , 'Room name not found.');
    }
  });

  socket.on('save-game-stat', function(data){
    let result = {};
    if (data && data.game_id && data.statistic_id && data.member_id && data.player_id) {
      let game_room = data.game_id;
      data['created_datetime'] = Date.now();
      // socket.join(game_room);
      IntraGameData.create(data).then(function(game_stat){
        let query = "SELECT * from v_intragame_player_detail where IRid='" + game_stat.id + "';";
        sequelize.query(query).then(stat => {
          result = {success: true, message: "Game Stats retrieved successfully."  ,stat: stat[0], game_stat: game_stat};
          socket.emit("save-stat" , result);
          io.to(game_room).emit('new_event' , result);
          if (game_stat.statistic_id == 1 || game_stat.statistic_id == 10 || game_stat.statistic_id == 11 || game_stat.statistic_id == 12) {
            let query = `CALL usp_update_games_table('`+ game_stat.game_id +`');`;
            sequelize.query(query)
          }
        }).catch(function(error){
          console.log("ERROR:      " , error);
          result = {success: false, message: "Something went wrong."  ,stat: stat};
          socket.emit("save-stat" , result);
        });

      }).catch(function(error){
        console.log("THE ERROR IS   " , error);
        result = {success: false, error: error}
        socket.emit('save-stat' , result);
      });
    }else{
      result = {success: false, message: "Could not add the game stat. Required data is missing."}
      socket.emit('save-stat' , result);
    }
  });

  // Get Tournament Game
  socket.on('get-tournament-games', function(data){
    let event_id = data.event_id;
    let division_id = data.division_id;
    if (event_id) {
      get_tournament_games(socket , event_id, division_id);
    }else{
      result = {success: false  , message: 'Event Id not found.'};
      socket.emit('get-tournament-games' , result);
    }
  });

  // Get all games of user teams. and return data every 4 seconds.
  socket.on('get-games', function(data){
    let member_id = data.created_by;
    let team_ids = '';
    let result;
    let sport_id;
    if (member_id) {
      Member.findOne({
        where: {
          member_id: member_id
        }
      }).then(function(member){
        sport_id = member.sport_id_default;
        MemberAssociation.findAll({
          attributes: ['association_fk_id']
          }, {
          where: {
            member_id: member_id
          }
        }).then(function(ids){
          if (ids.length == 0) {
            result = {success: false  ,message: 'No team found by the member id.'};
            socket.emit('get-games' , result);
          }else{
            ids.forEach(function(team_id){
              // team_ids.push(team_id.team_id);
              if (team_id.team_id != undefined) {
                if (team_ids == '') {
                  team_ids = "'" + team_id.team_id  + "'";
                }else{
                  team_ids += ",'" + team_id.team_id + "'";
                } 
              }
            });
            get_games(team_ids , socket , sport_id);
            if(team_ids != ''){
              interVal = setInterval(function () {
                get_games(team_ids , socket , sport_id);
              }, 4000);
            }
          }
        });
      })
    }else{
      let result = {success: false  ,message: 'Member Id not found. '};
      socket.emit('get-games' , result);
    }
  });

  socket.on('disconnect', function(){
    console.log('User disconnected...');
    for (let event_id in obj) {
      io.in(event_id).clients((err , clients) => {
        if (clients.length == 0) {
          tournamentInterVal = null;
          if (obj[event_id]) {
            clearInterval(obj[event_id]['intervalId']);
          }else{
            clearInterval(tournamentInterVal);
          }
          // Deleting the room object if there is no client in the room.
          delete obj[event_id];
        }
      });
    }
    clearInterval(interVal);
  });
});

function get_tournament_games(socket, tournament_id, division_id){
  let additional_query = '';
  if (division_id) {
    additional_query = " and division_id='"+division_id+"'";
  }
  let query = "SELECT * from v_teams_games where v_teams_games.is_active_YN != 0 and tournament_id='"+tournament_id+"'";
  query = query + additional_query;
  let order_query = " order by game_date DESC , home_team_name , away_team_name desc;";
  query += order_query;
  let games_data;
  sequelize
    .query(query, {
      model: Game
    })
    .then(games => {
      let result = {success: true, message: "Games retrieved successfully."  ,games: games};
      io.to(tournament_id).emit('get-tournament-games' , result);
    });
}

function get_games(team_ids, socket , sport_id){

  var todayDate = new Date().toISOString().slice(0,10);
  // let query = "SELECT games.* , home_team.team_name as home_team_name , away_team.team_name as away_team_name FROM games left join teams as home_team on home_team.team_id = games.home_team_id left join teams as away_team on away_team.team_id = games.away_team_id  where (games.home_team_id IN ("+team_ids+") OR games.away_team_id IN ("+team_ids+"))";
  if (team_ids == '') {
    let games = [];
    let result = {success: true, message: "No Games found for the member."  ,games: games};
    socket.emit('get-games' , result);
  }else{

    let query = "SELECT * from v_teams_games where (v_teams_games.home_team_id IN ("+team_ids+") OR v_teams_games.away_team_id IN ("+team_ids+")) AND v_teams_games.is_active_YN != 0";
    let date_query = "AND game_date < '"+todayDate+"'";
    let sport_query = '';
    if (sport_id) {
      sport_query = " AND sport_id="+sport_id;
    }
    let order_query = " order by game_date DESC , home_team_name , away_team_name desc;";

    query += sport_query + order_query;
    let games_data;
    sequelize
      .query(query, {
        model: Game
      })
      .then(games => {
        let result = {success: true, message: "Games retrieved successfully."  ,games: games};
        socket.emit('get-games' , result);
      });
  }
}

app.use('/api/v1', routes);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function caspio_authenticate(callback){
  let result;
  let url = "https://c6ezh201.caspio.com/oauth/token";
  request.post({url, form: 
    { 
      'grant_type': 'client_credentials',
      'client_id': '6ebecb886f924ab59cb076c9f74042ed47dc84e14b73fed57f',
      'client_secret': '6911e3c715fb471e8752eff26a603d5c0da3b45a99a7a9c6df'
    }
  }, function(err, response, body){
    if (err) {
      console.log("ERROR IS  " , err);
      callback(null);
    }else{
      let json_body = JSON.parse(body);
      callback(json_body.access_token);
    }
  });
}

function get_request_options(url, token){
  if (token && token.indexOf("bearer ") < 0){
    token = 'bearer ' + token;
  }
  let headers = {
    Accept: "application/json; charset=utf-8",
    "Authorization": token
  };
  let options = {
    url: url,
    headers: headers
  };
  return options;
}

function send_request_to_caspio(options){
  let result;
  return new Promise((resolve, reject) => {
    request(options , function(err, response, body){
      if (err) reject(err);
      if (response.statusCode != 200) {
        reject('Invalid status code <' + response.statusCode + '>');
      }
      data = JSON.parse(body);
      if (data && data.Result) {
        data = data.Result;
      }
      resolve(data);
      // save_games_to_db(games);
      // return games;
    });
  });
}

async function caspio_get_games(token){
  var all_games = [];
  let games = [];
  let page = 1;
  try{
    do {
      let url = "https://c6ezh201.caspio.com/rest/v2/views/LAX_View_Games_Teams_Tournaments/records?q.limit=1000";
      if (page > 1) {
        url = 'https://c6ezh201.caspio.com/rest/v2/views/LAX_View_Games_Teams_Tournaments/records?q.limit=1000&q.pageSize=1000&q.pageNumber='+page;
      }
      let options = get_request_options(url , token);
      let games = await send_request_to_caspio(options);
      all_games = all_games.concat(games)
      page += 1;
    }
    while (games.length >= 1000);
    save_games_to_db(all_games);
  }catch (error) {
    console.error('ERROR:');
    console.error(error);
  }
}

async function save_games_to_db(games){
  let game_data;

  for(const game of games){
    game_data = await save_game_records(game);
  }
}

function save_game_records(game){
  let obj = {
    "game_id": game.Game_ID,
    "tournament_id": game.Tournament_ID ,
    "sport_id": '1',
    "tournament_name": game.Tournament_Name,
    "away_team_id": game.Away_Team_ID,
    "home_team_id": game.Home_Team_ID,
    "away_team_score": game.Away_Team_Score,
    "home_team_score": game.Home_Team_Score,
    "game_location_lat": game.game_location_lat,
    "game_location_long": game.game_location_long,
    "game_date": game.Game_Date,
    "is_active_YN": 1
  }
  Game.findOne({where: {game_id: game.Game_ID}})
  .then((game_obj) => {
    if (game_obj){
      console.log("Game Already Exist.");
      // game.update(obj);
    }else{
      console.log("OBJ:   ", obj);
      Game.create(obj).then(function(created_game){

      });
    }
  });
}

async function caspio_get_teams(token){
  var all_teams = [];
  let teams = [];
  let page = 1;
  try{
    do {
      let url = 'https://c6ezh201.caspio.com/rest/v2/views/RX_V_Team_List/records?q.limit=1000';
      if (page > 1) {
        url = 'https://c6ezh201.caspio.com/rest/v2/views/RX_V_Team_List/records?q.limit=1000&q.pageSize=1000&q.pageNumber='+page;
      }
      let options = get_request_options(url , token);
      teams = await send_request_to_caspio(options);
      all_teams = all_teams.concat(teams)
      page += 1;
    }
    while (teams.length >= 1000);
    save_teams_to_db(all_teams);
  }catch (error) {
    console.error('ERROR:');
    console.error(error);
  }
}

async function save_teams_to_db(teams){
  console.log("TEAMS LENGTH:             " , teams.length);
  let teams_data;
  for(const team of teams){
    teams_data = await save_teams_records(team);
  }
}

function save_teams_records(team){
  let obj = {
    "team_id": team.Team_ID ,
    "sport_id": team.Sport_Type,
    "gender": team.Gender,
    "team_name": team.Team_Name,
    "team_level": team.Team_Level,
    "team_year": team.Team_Year,
    "parent_team_id": team.Parent_Org_ID,
    "parent_team_name": team.Parent_Org_Name,
    "is_active_YN": 1,
    "created_by": 'script'
  }
  Team.findOne({where: {team_id: team.Team_ID}})
  .then((team_obj) => {
    if (team_obj){
      console.log("Team Already Exist.");
      // team.update(obj);
    }else{
      // console.log("OBJ:   ", obj);
      Team.create(obj).then(function(created_team){
        console.log('Team Created');
      }).catch(function(err){
        // console.log("COULD NOT CREATE TEAM:             " , obj);

      });
    }
  });
}

async function caspio_get_players(token){
  var all_players = [];
  let players = [];
  let page = 1;
  try{
    do {
      let url = 'https://c6ezh201.caspio.com/rest/v2/views/RX_V_Teams_Player_Mapping_Mobile/records?q.limit=1000';
      if (page > 1) {
        url = 'https://c6ezh201.caspio.com/rest/v2/views/RX_V_Teams_Player_Mapping_Mobile/records?q.limit=1000&q.pageSize=1000&q.pageNumber='+page;
      }
      let options = get_request_options(url , token);
      let players = await send_request_to_caspio(options);
      all_players = all_players.concat(players)
      page += 1;
    }
    while (players.length >= 1000);
    save_players_to_db(all_players);
  }catch (error) {
    console.error('ERROR:');
    console.error(error);
  }
}

async function save_players_to_db(players){
  let players_data;
  for(const player of players){
    players_data = await save_players_records(player);
  }
}

function save_players_records(player){
  let is_active = 1;
  if (player.is_active_YN && player.is_active_YN == true) {
    is_active = 1;
  }else{
    is_active = 0;
  }
  let obj = {
    "player_id": player.player_id,
    "team_id": player.Team_ID,
    "first_name": player.player_first_name,
    "last_name": player.player_last_name,
    "jersey_number": player.jersey_number,
    "position_description": player.position_description,
    "is_active_YN": is_active,
    "created_by": "script"
  }
  Player.findOrCreate({where: {player_id: player.player_id}, defaults: obj})
  .then(([player, created]) => {
    console.log("CREATED:         " , created);
  });
}

var delay = ( function() {
  var timer = 0;
  return function(callback, ms) {
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
  };
})();

function ValidateToken(token, next) {
  if (!process.env['KEY_ID'] || !process.env['MODULUS'] || !process.env['EXPONENT'] || !process.env['KEY_TYPE']) {
    let url = `https://cognito-idp.${pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`;
    request({
        url: url,
        json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var keys = body['keys'];

        for(var i = 0; i < keys.length; i++) {
          //Convert each key to PEM
          var key_id = keys[i].kid;
          var modulus = keys[i].n;
          var exponent = keys[i].e;
          var key_type = keys[i].kty;

          process.env['KEY_ID'] = keys[i].kid;
          process.env['MODULUS'] = keys[i].n;
          process.env['EXPONENT'] = keys[i].e;
          process.env['KEY_TYPE'] = keys[i].kty;
        }
        verify_cognito_token(token, next);
      } else {
        console.log("Error! Unable to download JWKs");
        return next(new Error('Error! Unable to download JWKs.'));
      }
    }); 
  }else{
    verify_cognito_token(token, next);
  }
}

function verify_cognito_token(token, next){
  pems = {};
  var jwk = { kty: process.env['KEY_TYPE'], n: process.env['MODULUS'], e: process.env['EXPONENT']};
  var pem = jwkToPem(jwk);
  pems[process.env['KEY_ID']] = pem;

  //validate the token
  var decodedJwt = jwt.decode(token, {complete: true});
  if (!decodedJwt) {
    console.log("Not a valid JWT token");
    return next(new Error('Not a valid JWT token.'));
  }

  var kid = decodedJwt.header.kid;
  var pem = pems[kid];
  if (!pem) {
    console.log('Invalid token');
    return next(new Error('Invalid Token. Pem not found.'));
  }

  jwt.verify(token, pem, function(err, payload) {
    if(err) {
      console.log("Invalid Token.");
      return next(new Error('Invalid Token.'));
    } else {
      console.log("Valid Token.");
      console.log(payload);
      next();
    }
  });
}
