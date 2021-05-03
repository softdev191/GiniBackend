var express = require('express');
var router = express.Router();
const https = require('https');
var request = require('request');
const bodyParser = require('body-parser');
let path = require('path');
var querystring = require('querystring');
const Sequelize = require('sequelize');
var http = require('http');
const Op = Sequelize.Op

const { sequelize, Game, GameParticipant, MemberTeam, IntraGameData , Team, Player, Stat, Member, MemberData } = require('./../sequelize');

// Player Game Stats

router.get('/players-games-stats', function(req, res){
	
	let player_id = req.query.player_id;

	if (!player_id) {
		let result = {success: false, error: 'Bad Data, Player id is required.'};
		return res.status(400).send(result);
	}

	let start_date = req.query.measure_date_start;
	let end_date = req.query.measure_date_end;

	let query = `Select * from v_players_games_stats where player_id='`+player_id+`'`;
	let filter_query = get_filter_query(start_date, end_date);
	query +=filter_query + `;`;

	sequelize.query(query).then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

router.get('/players-summary-stats', function(req, res){
	let team_id = req.query.team_id;

	if (!team_id) {
		let result = {success: false, error: 'Bad Data, Team id is required.'};
		return res.status(400).send(result);
	}

	let start_date = req.query.measure_date_start;
	let end_date = req.query.measure_date_end;

	let query = `Select * from v_players_summary_stats where team_id='`+team_id+`'`;
	let filter_query = get_filter_query(start_date, end_date);
	query += filter_query + ';';

	sequelize.query(query).then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// Call Procedure
router.get('/normalized_team_games/:id', function(req, res){
	let team_id = req.params.id;
	let order_by = req.query.order_by;
	let limit = req.query.limit
	let additional_query = '';
	let order_type = req.query.order_type;
	// let sql = `CALL usp_normalized_team_games('` + team_id+ `')`;
 	let sql = `Select * from v_games_normalized where team_id='`+team_id+`'`;

 	if (order_by) {
		additional_query += ` order by ` + order_by;
		if (order_type) {
			order_type = order_type.toLowerCase();
			if (order_type != 'asc' && order_type != 'desc') {
				order_type = 'asc'
			}
			additional_query += ' ' + order_type;
		}
	}

	if (limit) {
		additional_query += ` limit ` + limit;
	}

	sql += additional_query + ';';

	sequelize.query(sql).then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// App Parameters API

router.get('/app-parameters', function(req, res){
	sequelize.query("SELECT * FROM v_app_parameters").then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// Get Team Statistics
router.get('/team-stats', function(req, res){
	sequelize.query("SELECT * FROM v_teams_statistics").then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

router.get('/team-stats/:id', function(req, res){
	let team_id = req.params.id;
	sequelize.query("SELECT * FROM v_teams_statistics where team_id='"+team_id+"'").then(([results, metadata]) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: results};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// Member Team Association API
router.post('/member-team', function (req, res) {
	let body = req.body;
	let success = true;
	let result = {};
	console.log(body);
	if (body){
		let data = body.data;
		if (data) {
			data.forEach(function(obj){
				obj['is_active_YN'] = 1;
				console.log("OBJ:           " , obj);
				MemberTeam.findOne({where: {member_id: obj.member_id , team_id: obj.team_id}})
				  .then((member) => {
				  	if (member) {
				  		member.update(obj);
				  	}else{
				  		MemberTeam.create(obj);
				  	}
					}).catch(error => {
				  	console.log(error);
				  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
				  		message = error.errors[0].message;
				  	}else{
				  		message = "Something went wrong, could not save team."
				  	}
				  	console.log('ERROR      ' , error);
				  	result = {success: false  , message: message};
				 	});
			});
			result = {success: true};
			return res.status(200).send(result);
		}
	 }else{
	 	result = {success: false  , message: 'Bad data provided.'};
	 	return res.status(400).send(result);

	}
});

router.get('/get-member-team', function(req, res){
<<<<<<< HEAD
	let query= "SELECT m.member_id, m.team_id, t.team_name FROM member_teams_association m inner join teams t on m.team_id = t.team_id WHERE m.is_active_YN = 1;";
=======
	let query= "SELECT m.member_id, m.team_id, t.team_name FROM member_teams_association m inner join teams t on m.team_id = t.team_id where m.is_active_YN=1;";
>>>>>>> origin/hamza_dev
	sequelize.query(query).then((data) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,data: data};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

router.get('/get-teams-by-member-id/:id', function(req, res){
	let member_id = req.params.id;
	let query= "SELECT m.member_id, m.team_id, t.* FROM member_teams_association m inner join teams t on m.team_id = t.team_id where m.is_active_YN=1 and member_id='"+member_id+"';";
	sequelize.query(query).then((data) => {
		// Results will be an empty array and metadata will contain the number of affected rows.
		let result = {success: true, message: "Data retrieved successfully."  ,teams: data[0]};
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });

});

// Member Data Association.
router.post('/members', function (req, res) {
	let body = req.body;
	let member_id = body.member_id;
	let result = {};
	let current_time = get_current_datetime();
	if (body && member_id){
		body['created_datetime'] = current_time;
		Member.findOrCreate({where: {member_id: member_id}, defaults: body})
	  .then(([member, created]) => {
	  	result = {success: true , message: "Member created successfully." , member: member};
	  	return res.status(200).send(result);
		}).catch(error => {
	  	console.log(error);
	  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
	  		message = error.errors[0].message;
	  	}else{
	  		message = "Something went wrong, could not save team."
	  	}
	  	console.log('ERROR      ' , error);
	  	result = {success: false  , message: message};
	  	return res.status(400).send(result);
	 	});
	}else{
		result = {success: false  , message: 'Bad Data Provided.'};
  	return res.status(400).send(result);
	}
});

router.post('/save-members-data', function (req, res) {
	let body = req.body;
	let success = true;
	let result = {};
	if (body){
		let data = body.data;
		if (data) {
			data.forEach(function(obj){
				console.log("OBJ,              " , obj);
				MemberData.create(obj)
			  .then((member_data) => {
			  	result = {success: true , message: "Data added successfully."};
				}).catch(error => {
			  	console.log(error);
			  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
			  		message = error.errors[0].message;
			  	}else{
			  		message = "Something went wrong, could not save team."
			  	}
			  	console.log('ERROR      ' , error);
			  	result = {success: false  , message: message};
			 	});
			});
			result = {success: true};
			return res.status(200).send(result);
		}
	 }else{
	 	result = {success: false  , message: 'Bad data provided.'};
	 	return res.status(400).send(result);

	}
});

router.get("/member/:id", (req, res, next) => {
	let body = req.body;
	let member_id = req.params.id;
	let result;

  Member.findOne({
	  where: {
	    member_id: member_id,
	  },
	  include: [{model: MemberData}]
	}).then(member => {
    let result = {success: true, message: "Member retrieved successfully."  ,member: member};
		return res.status(200).send(result);
  }).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// Intra Game Reporting APIs
router.delete("/game-stats/:id/delete", (req, res, next) => {
	let stat_id = req.params.id;
	let result;
	IntraGameData.update({is_active_YN: 0} , { where: { id: stat_id }})
		.then(function(response){
			if (response[0] == 0) {
				result = {success: false  ,message: "Something went wrong. Could not delete the game stat."};
				return res.status(400).send(result);
			}else{
				result = {success: true  ,message: "Game Stat deleted successfully."};
				return res.status(200).send(result);
			}
		}).catch(function(error){
			result = {success: false  ,message: "Something went wrong. Could not delete the game stat." , error: error};
			return res.status(500).send(result);
		});
});

router.put("/remove_member_team", (req, res, next) => {
	let member_id = req.body.member_id;
	let teams = req.body.team_ids;
	let attr_to_update = {
		'is_active_YN': 0
	};
	if (teams){
		teams.forEach(function(team){
			console.log('TEAM ID   ' , team.team_id);
			MemberTeam.update(attr_to_update , {
				where: {
					"member_id": member_id,
					"team_id": team.team_id
				}
			}).then(response => {
			  console.log("response         " , response);
			});
		});
	}
	result = {success: true , "message": "Team Members have been added in queue. They will be unfollowed shortly."};
	return res.status(200).send(result);
});

router.get("/game-stats/:id", (req, res, next) => {
	let body = req.body;
	let game_id = req.params.id;
	let result;

	// let query = "SELECT ir.id as game_stat_id , players.first_name , players.last_name , players.jersey_number, players.position_description , players.player_id, teams.team_name , teams.team_id, ir.member_id , ir.createdAt as stat_time, games.tournament_name, games.away_team_score , games.home_team_score, games.game_date,stats.statistic_id as statistic_id , stats.statistic_name , stats.stat_UI_short FROM clubsports.intragame_reporting as ir inner join games on games.game_id = ir.game_id left join statistics as stats on ir.statistic_id = stats.statistic_id left join players on ir.player_id=players.player_id left join teams on players.team_id=teams.team_id where ir.is_active_YN != 0 && ir.game_id = '"+ game_id+ "' order by game_stat_id desc;";

	let query = "SELECT * from v_intragame_player_detail where game_id='" + game_id + "' and is_active_YN != 0";

	sequelize
  .query(query, {
    model: Game
  })
  .then(games => {
    let result = {success: true, message: "Game Stats retrieved successfully."  ,games: games};
		return res.status(200).send(result);
  }).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

router.put('/game-stat/:id', function (req, res) {
	let body = req.body;
	let attr_to_update = {};
	var stat_id = req.params.id;
	let result;
	if (body && stat_id){
		if (body.is_active_YN) {
			attr_to_update['is_active_YN'] = body.is_active_YN;
		}
		if (body.player_id) {
			attr_to_update['player_id'] = body.player_id;
		}

		IntraGameData.update(attr_to_update , { where: { id: stat_id }})
		.then(function(response){
			if (response[0] == 0) {
				result = {success: false  ,message: "Could not find the game stat. Bad Id provided."};
				return res.status(400).send(result);
			}else{
				IntraGameData.findOne({
				  where: {
				    id: stat_id
				  }
				}).then(function(stat){
					result = {success: true  ,message: "Game Stat updated successfully." , stat: stat};
					return res.status(200).send(result);
				});
			}
		});
	}else{
		result = {success: false  ,message: "Bad data. Could not update game stat."};
		return res.status(400).send(result);
	}
});

// Games APIs
router.get("/games-by-caspio", (req, res, next) => {
	let param = req.query.member_id;
	let token = req.query.token;

	if (token == undefined || token == null) {
		result = {
  		'success': false,
  		'message': 'Bad token provided.'
  	}
  	return res.status(400).send(result);
	}

	if (token.indexOf("bearer ") < 0){
		token = 'bearer ' + token;
	}

	let additional_query = '';
	if (param != null && param != undefined) {
		additional_query = "?q.where=Member_ID%3D'" + param +"'"
	}else{
		result = {
  		'success': false,
  		'message': 'Member Id not found.'
  	}
  	return res.status(400).send(result);	
	}

	let url = "https://c6ezh201.caspio.com/rest/v2/views/RX_V_mbr_associations/records" + additional_query;

	let headers = {
    Accept: "application/json; charset=utf-8",
    "Authorization": token
	};

	let options = {
    url: url,
    headers: headers
	};

	console.log(options);

	let games= [];
	request(options , function(err, response, body){
  	let result={};
  	if (err) {
  		result = {
	  		'success': false,
	  		'message': 'Something went wrong, teams could not be retrieved.',
	  		'error': err
	  	}
	  	return res.status(400).send(result);
  	}else if(response.statusCode != 200){
  		let res_body = JSON.parse(response.body);
  		res_body = res_body.Message;
  		result = {
	  		'success': false,
	  		'message': 'Something went wrong, teams could not be retrieved.',
	  		'error': res_body
	  	}
	  	return res.status(401).send(result);
  	}else{
  		let teams = JSON.parse(body);
  		let team_ids = [];

	  	if (teams && teams.Result) {
	  		teams = teams.Result;
	  	}

	  	teams.forEach(function(team){
	  		if(team_ids.indexOf(team.Team_ID) < 0){
					team_ids.push(team.Team_ID);
				}
	  	});

	  	additional_query = '';
	  	if (team_ids && team_ids != '' && team_ids != null) {
	  		team_ids = team_ids.join();
	  		team_ids = team_ids.replace(/\,/g, "','");
	  		additional_query = "?q.where=(Home_Team_ID IN ('"+ team_ids +"')) OR (Away_Team_ID IN ('"+team_ids+"'))"
		  	url = "https://c6ezh201.caspio.com/rest/v2/views/LAX_View_Games_Teams_Tournaments/records"+ additional_query;

		  	let options = {
			    url: url,
			    headers: headers
				};

				request(options , function(err, response, body){
					if (err) {
			  		result = {
				  		'success': false,
				  		'message': 'Something went wrong, games could not be retrieved.',
				  		'error': err
				  	}
				  	return res.status(400).send(result);
			  	}else if(response.statusCode != 200){
			  		let res_body = JSON.parse(response.body);
			  		res_body = res_body.Message;
			  		result = {
				  		'success': false,
				  		'message': 'Something went wrong, teams could not be retrieved.',
				  		'error': res_body
				  	}
				  	return res.status(401).send(result);
			  	}else{
						games = JSON.parse(body);
						if (games && games.Result) {
				  		games = games.Result;
				  	}
			  		result = {
				  		'success': true,
				  		'message': 'Team retrieved successfully.',
				  		'teams': teams,
				  		'games': games
				  	}
				  	// io.emit('games_event', { teams, teams, games, games });
			  		return res.status(200).send(result);
					}
				});
			}else{
				result = {
		  		'success': true,
		  		'message': 'No Team found by the member id.',
		  		'teams': teams,
		  		'games': games
		  	}
	  		return res.status(200).send(result);
			}
		}
	});
});

router.get("/games", (req, res, next) => {
	let member_id = req.query.created_by;
	let team_ids = '';
	var todayDate = new Date().toISOString().slice(0,10);
	let result;

	if (member_id) {
		MemberTeam.findAll({
			attributes: ['team_id']
			}, {
			where: {
				member_id: member_id
			}
		}).then(function(ids){
			if (ids.length == 0) {
				result = {success: false  ,message: 'No team found by the member id.'};
				return res.status(400).send(result);
			}else{

				ids.forEach(function(team_id){
					// team_ids.push(team_id.team_id);
					if (team_ids == '') {
						team_ids = "'" + team_id.team_id  + "'";
					}else{
						team_ids += ",'" + team_id.team_id + "'";
					}
				});
				let query = "SELECT * from v_teams_games where (v_teams_games.home_team_id IN ("+team_ids+") OR v_teams_games.away_team_id IN ("+team_ids+")) AND v_teams_games.is_active_YN != 0";

				let date_query = "AND game_date < '"+todayDate+"'";
				let order_query = " limit 12";

				query = query + order_query;

				sequelize
			  .query(query, {
			    model: Game
			  })
			  .then(games => {
			    let result = {success: true, message: "Games retrieved successfully."  ,games: games};
					return res.status(200).send(result);
			  });
			}
		});
	}else{
		let result = {success: false  ,message: 'Member Id not found. '};
		return res.status(200).send(result);
	}
});

router.put('/game/:id', function (req, res) {
	let body = req.body;
	let attr_to_update = {};
	let game_id = req.params.id;
	let result;
	if (body && game_id){
		if (body.home_team_id && body.home_team_id != null && body.home_team_id != '') {
			attr_to_update['home_team_id'] = body.home_team_id;
		}
		if (body.away_team_id && body.away_team_id != null && body.away_team_id != '') {
			attr_to_update['away_team_id'] = body.away_team_id;
		}
		// if (body.home_team_score) {
		// 	attr_to_update['home_team_score'] = body.home_team_score;
		// }
		// if (body.away_team_score) {
		// 	attr_to_update['away_team_score'] = body.away_team_score;
		// }
		// if (body.is_active_YN) {
		// 	attr_to_update['is_active_YN'] = body.is_active_YN;
		// }
		if(Object.keys(attr_to_update).length == 0){
			result = {success: false  ,message: "No valid data found to update."};
			return res.status(400).send(result);	
		}
		Game.update(attr_to_update , { where: { game_id: game_id }})
		.then(function(response){
			if (response[0] == 0) {
				result = {success: false  ,message: "Something went wrong. Could not find the game."};
				return res.status(400).send(result);
			}else{
				Game.findOne({
				  where: {
				    game_id: game_id
				  }
				}).then(function(game){
					result = {success: true  ,message: "Game updated successfully." , game: game};
					return res.status(200).send(result);
				});
			}
		});
	}else{
		result = {success: false  ,message: "Bad data. Could not update game."};
		return res.status(400).send(result);
	}
});

// Teams API
router.post('/team', function (req, res) {
	let body = req.body;
	let team_name = body.team_name;
	let message = 'Team Created successfully.';
	let success = true;
	if (body && team_name) {
		let id = makeid(8);
		body['team_id'] = id;
		body['created_by'] = body.member_id;
		Team.findOrCreate({where: {team_name: team_name}, defaults: body})
	  .then(([team, created]) => {
	    if (created == false) {
	    	success = false;
	    	message = 'Team already exist with ' + team_name;
	    }
	    result = {success: success  , message: message, team: team};
	 		return res.status(200).send(result);
	  }).catch(error => {
	  	if (error && error.errors  && error.errors.length > 0 && error.errors[0].message) {
	  		message = error.errors[0].message;
	  	}else{
	  		message = "Something went wrong, could not save team."
	  	}

	  	console.log('ERROR      ' , error.errors[0].message);
	  	result = {success: false  , message: message};
	 		return res.status(400).send(result);
	  	// return res.json({success: false  , message: message});
		});
	 }else{
	 	result = {success: false  , message: 'Bad Data, Team Name cannot be empty.'};
	 	return res.status(400).send(result);

	 }
});

router.get('/teams' , function(req, res){
	let member_id = req.query.member_id;
	let players;
	Team.findAll({
	  where: {
	    created_by: member_id,
	    is_active_YN: {
	    	[Op.ne]: 0
	    }
	  },
	  include: [
	  	{
	  		model: Player
	  	}
	  ],
	  order: [
	  	[Player, 'jersey_number', 'ASC']
	  ]
	}).then(function(teams){
		let result = {success: true  ,teams: teams};
	 	return res.status(200).send(result);
	});
});

router.get('/all_teams' , function(req, res){
	Team.findAll({
	  where: {
	    is_active_YN: {
	    	[Op.ne]: 0
	    }
	  }
	}).then(function(teams){
		let result = {success: true  ,teams: teams};
	 	return res.status(200).send(result);
	});
});

router.get('/team/:id' , function(req, res){
	let team_id = req.params.id;
	Team.findOne({
	  where: {
	    team_id: team_id,
	    is_active_YN: {
	    	[Op.ne]: 0
	    }
	  },
	  include: [{model: Player}],
	  order: [
	  	[Player, 'jersey_number', 'ASC'],
	  ]
	}).then(function(team){
		let result = {success: true  ,team: team};
	 	return res.status(200).send(result);
	});
});

// Players API
router.post('/player', function (req, res) {
	let body = req.body;
	let team_id = body.team_id;
	players = body.players;
	
	players.forEach(function(player){
		let id = makeid(8);
		player['player_id'] = id;
	});

	if (players) {
		Player.bulkCreate(players , {returning: true, individualHooks: true})
	  .then(() => {
	 		Player.findAll({
			  where: {
			    team_id: team_id,
			    active_YN: {
			    	[Op.ne]: 0
			    }
			  },
			  order: [
		      ['jersey_number', 'ASC'],
				]
			}).then(function(all_players){
				let result = {success: true  ,players: all_players};
			 	return res.status(200).send(result);
			});
	  }).catch(error => {
	  	console.log(error);
	  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
	  		message = error.errors[0].message;
	  	}else{
	  		message = "Something went wrong, could not save players."
	  	}

	  	console.log('ERROR      ' , error);
	  	result = {success: false  , message: message};
	 		return res.status(400).send(result);
		});
	}else{
		message = "Something went wrong, could not create players."
		result = {success: false  , message: message};
 		return res.status(400).send(result);
	}
});

// Edit multiple player
router.put('/players/edit', function (req, res) {
	let body = req.body;
	players = body.players;
	let attr_to_update = {};
	let message;
	if (players) {
		players.forEach(function(player){
			attr_to_update = {};
			if (player && player.player_id) {
				if (player.first_name) {
					attr_to_update['first_name'] = player.first_name;
				}
				if (player.last_name) {
					attr_to_update['last_name'] = player.last_name;
				}
				if (player.active_YN && player.active_YN != null) {
					attr_to_update['active_YN'] = player.active_YN;
				}
				// console.log("PLAYER:      " , attr_to_update);
				Player.update(attr_to_update , 
					{
						where: {
							player_id: player.player_id
						}
				});
			}
		});
		message = "Player are added in the queue to update. Players will be updated shortly."
		result = {success: true  , message: message};
		return res.status(200).send(result);

	}else{
		message = "Something went wrong, could not create players."
		result = {success: false  , message: message};
 		return res.status(400).send(result);
	}
});


router.put('/player/:id', function (req, res) {
	let body = req.body;
	let attr_to_update = {};
	let player_id = req.params.id;
	let result;
	if (body && player_id){
		if (body.first_name) {
			attr_to_update['first_name'] = body.first_name;
		}
		if (body.last_name) {
			attr_to_update['last_name'] = body.last_name;
		}
		if (body.jersey_number) {
			attr_to_update['jersey_number'] = body.jersey_number;
		}
		if (body.position_description) {
			attr_to_update['position_description'] = body.position_description;
		}

		if (body.active_YN) {
			attr_to_update['active_YN'] = body.active_YN;
		}

		Player.update(attr_to_update , { where: { player_id: player_id }})
		.then(function(response){
			if (response[0] == 0) {
				result = {success: false  ,message: "Could not find the player. Bad Id provided."};
				return res.status(400).send(result);
			}else{
				Player.findOne({
				  where: {
				    player_id: player_id
				  }
				}).then(function(player){
					result = {success: true  ,message: "Player updated successfully." , player: player};
					return res.status(200).send(result);
				});
			}
		});
	}else{
		result = {success: false  ,message: "Bad data. Could not update player."};
		return res.status(400).send(result);
	}
});

router.get('/players' , function(req, res){
	let team_id = req.query.team_id;
	Player.findAll({
	  where: {
	    team_id: team_id,
	    active_YN: {
	    	[Op.ne]: 0
	    }
	  },
	  order: [
      ['jersey_number', 'ASC'],
		]
	}).then(function(players){
		let result = {success: true  ,players: players};
	 	return res.status(200).send(result);
	});
});

// Stats API
router.get('/stats' , function(req, res){
	Stat.findAll({
	  where: {
	    is_active_YN: {
	    	[Op.ne]: 0
	    }
	  }
	}).then(function(stats){
		let result = {success: true  ,stats: stats};
	 	return res.status(200).send(result);
	});
});

// Game Participants
router.post('/game_participants', function (req, res) {
	let body = req.body;
	let game_id = body.game_id;
	let member_id = body.member_id;
	let message;
	players = body.players;
	
	players.forEach(function(player){
		body = {
			game_id: game_id, 
			reporting_member_id: member_id ,
			player_id: player.player_id,
			player_first_name: player.player_first_name,
			player_last_name: player.player_last_name,
			player_jersey_num: player.player_jersey_num
		}
		GameParticipant.findOrCreate({where: {game_id: game_id , player_id: player.player_id}, defaults: body }).then(([participant, created]) => {
	    console.log(participant.get({
	      plain: true
	    }))
		}).catch(function(error){
			console.log(error);
	  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
	  		message = error.errors[0].message;
	  	}else{
	  		message = "Something went wrong, could not save team."
	  	}

	  	console.log('ERROR      ' , error);
	  	result = {success: false  , message: message};
	 		return res.status(400).send(result);
		});
	});
	result = {success: true  , message: 'Records are added in the queue. Game Participants will be updated shortly.'};
	return res.status(200).send(result);
});

router.get('/game_participants/:id' , function(req, res){
	let game_id = req.params.id;
	GameParticipant.findAll({
	  where: {
	    game_id: game_id
	  }
	}).then(function(stats){
		let result = {success: true  ,stats: stats};
	 	return res.status(200).send(result);
	});
});

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function get_current_datetime(){
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date+' '+time;
	return dateTime;
}

function get_filter_query(start_date , end_date){
	let filter_query = '';
	
	if (start_date) {
		filter_query += ` measure_date>='` +start_date+ `' and`
	}
	if (end_date) {
		filter_query += ` measure_date<='` +end_date+`'`;
	}

	if (filter_query.endsWith('and')) {
		filter_query = filter_query.replace(/and([^_]*)$/,'');
	}

	return filter_query;
}

var delay = ( function() {
  var timer = 0;
  return function(callback, ms) {
      clearTimeout (timer);
      timer = setTimeout(callback, ms);
  };
})();
module.exports = router;