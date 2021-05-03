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
const jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
let config = require('../services/config.json');
require('dotenv').config();
var sub;
// For Cognito Authorization
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const jwkToPem = require('jwk-to-pem');
global.fetch = require('node-fetch');

const poolData = {    
	UserPoolId : config.poolId, // Your user pool id here    
	ClientId : config.clientId // Your client id here
}; 

const pool_region = config.region;

const { sequelize, Game, GameParticipant, MemberTeam, IntraGameData , Team, Player, Stat, Member, MemberData, Event, MemberEvent, MemberLoginAudit, MemberToken, EventLocation, EventFormat, GamesBracket, GamesBracketDisplay, MemberPlayer, MemberAssociation, MemberAssociationType, Organization, MemberMedia, MemberMediaReaction } = require('./../sequelize');

const stripe = require("stripe")(config.STRIPE_SECRET_KEY);

// Get players claimed by a member 
router.get('/players/claim', ValidateToken, function(req, res){
	let member_id = req.query.member_id;
	let player_id = req.query.player_id;

	if (player_id || member_id) {
		let query = '';
		if (player_id) {
			query = "Select * from v_member_player_team_map where member_id=(Select member_id from v_member_player_team_map where player_id='"+player_id+"')";
		}else{
			query = "Select * from v_member_player_team_map where member_id='"+member_id+"'";
		}

		sequelize
	    .query(query)
	    .then(data => {
	    	let result = {success: true, data: data[0]};
	    	return res.status(200).send(result);	  
	    }).catch(function(error){
			console.log("ERROR:     " , error);
			result = {success: false  , message: 'Something went wrong.' , error: error};
			return res.status(500).send(result);
		});
	}else{
		result = {success: false  , 'error': 'Bad Data Provided.' };
		return res.status(400).send(result);
	}
});

// Search Tags by Tag value
router.post('/tags/search', ValidateToken, function(req, res){
	let term = req.body.term;

	if (term) {
		let query = "Select * from tags where tag_value LIKE '%" + term+ "%'";

		sequelize
	    .query(query)
	    .then(tags => {
	    	let result = {success: true, tags: tags[0]};
	    	return res.status(200).send(result);
	    }).catch(function(error){
			console.log("ERROR:     " , error);
			result = {success: false  , message: 'Something went wrong.' , error: error};
			return res.status(500).send(result);
		});
	}else{
		result = {success: false  , 'error': 'Please pass the tag to search for.' };
		return res.status(400).send(result);
	}
});

// Create Payment Intent
router.post('/create-payment-intent', ValidateToken, function(req, res){
	const amount = req.body.amount;
  
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
  }).then(function(paymentIntent){
	  // Send publishable key and PaymentIntent details to client
	  // console.log("-========================           ", paymentIntent);
	  result = {success: true, publishableKey: config.STRIPE_PUBLISHABLE_KEY, clientSecret: paymentIntent.client_secret};
		return res.status(200).send(result);
  }).catch(function(error){
  	result = {success: false, error: error};
		return res.status(500).send(result);	
  });
});

// Get all universities
router.get('/universities', ValidateToken, function(req, res){
	let query = "Select * from universities;";

	sequelize
    .query(query)
    .then(universities => {
    	let result = {success: true, universities: universities[0]};
    	return res.status(200).send(result);
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.' , error: error};
		return res.status(500).send(result);
	});
});


// Get num of Followers of Player
router.get('/get-players-followers-count/:player_id', ValidateToken, function(req, res){
	let player_id = req.params.player_id;
	let query = "Select count(DISTINCT(member_id)) as count from member_associations where association_id =2 and association_fk_id='"+ player_id+"'";

	sequelize
    .query(query)
    .then(data => {
    	let result = {success: true, followers_count: data[0][0]['count']};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.' , error: error};
		return res.status(500).send(result);
	});
});

// Get num of Followers of Player
router.get('/get-players-followers-count-by-member-id/:member_id', function(req, res){
	let member_id = req.params.member_id;
	let query = "Select player_id from v_member_player_team_map where member_id='"+member_id+"'";
	
	sequelize
    .query(query)
    .then(data => {
    	let ids = "";
    	data[0].forEach(function(player_id){
    		console.log("PLayer ID:      ", player_id['player_id']);
    		ids += "'" + player_id['player_id'] + "',";
    	});
    	if (ids.endsWith(',')) {
				ids = ids.replace(/.$/,"");
			}
			if (ids == '') {
				// As there is no players found by the member id, the count will 0. It is the case where user sends invalid member id.
				let result = {success: true, followers_count: 0};
				return res.status(200).send(result);
			}
			query = "Select count(DISTINCT(member_id)) as count from member_associations where association_id =2 and association_fk_id IN ("+ids+")";
			sequelize
	    .query(query)
	    .then(data => {
	    	let result = {success: true, followers_count: data[0][0]['count']};
    		return res.status(200).send(result);	  	
	    }).catch(function(error){
				console.log("ERROR:     " , error);
				result = {success: false  , message: 'Something went wrong.' , error: error};
				return res.status(500).send(result);
			});
    	
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.' , error: error};
		return res.status(500).send(result);
	});
});


// Save Reaction to media 
router.post('/media/reaction', ValidateToken, function(req, res){
	let body = req.body;
	let member_id = body.member_id;
	let member_media_id = body.member_media_id;
	let created_by = body.created_by;

	if (member_id && created_by && member_media_id) {
		body['created_datetime'] = get_current_datetime();
		body['is_active_YN'] = 1;

		MemberMediaReaction.findOne({ where: {member_id: member_id , member_media_id: member_media_id} }).then(function(reaction){
			if (reaction) {
				reaction.is_active_YN = 1;
				reaction.updated_datetime = get_current_datetime();
				reaction.updated_by = created_by;
				
				reaction.save().then(function(member_reaction){
					result = {success: true  , message: 'Media Liked successfully', reaction: member_reaction };
					return res.status(200).send(result);
				}).catch(function(error){
					result = {success: false  , 'message': 'Something went wrong..', error: error };
					return res.status(500).send(result);
				});
			}else{
				MemberMediaReaction.create(body).then(function(member_reaction){
					result = {success: true  , message: 'Media Liked successfully', reaction: member_reaction };
					return res.status(200).send(result);
				}).catch(function(error){
					result = {success: false  , 'message': 'Something went wrong..', error: error };
					return res.status(500).send(result);
				});
			}
		}).catch(function(err){
			result = {success: false  , 'error': err, message: 'Something went wrong.' };
			return res.status(500).send(result);
		});
	}else{
		result = {success: false  , 'error': 'Bad Data Provided. Member Id, Created by and member media id fields are mandatory.' };
		return res.status(400).send(result);
	}
});

// Save Media of Member
router.post('/member/media', ValidateToken, function(req, res){
	let body = req.body;
	let member_id = body.member_id;
	let media_type = body.media_type;
	let media_thumbnail_url = body.media_thumbnail_url;
	let media_file_url = body.media_file_url;
	let created_by = body.created_by;

	if (member_id && created_by && media_file_url && media_type) {
		body['created_datetime'] = get_current_datetime();
		body['is_active_YN'] = 1;
		MemberMedia.create(body).then(function(media){
			result = {success: true  , message: 'Media added successfully for member.', media: media};
			return res.status(200).send(result);
		});
	}else{
		result = {success: false  , 'error': 'Bad Data Provided. Member Id, Created by, Media File Url and Media type fields are mandatory.' };
		return res.status(400).send(result);
	}
});

// Get all the media saved for member
router.get('/member/:member_id/media', ValidateToken, function(req, res){
	let member_id = req.params.member_id;
	MemberMedia.findAll({
			where: {member_id: member_id, is_active_YN: 1},
			order: [
	      ['created_datetime', 'DESC'],
			]
		}).then(function(media){
		result = {success: true  ,media: media};
		return res.status(200).send(result);
	});
});

// Update the media, mainly, it will be used to delete the media
router.put('/media/:media_id', ValidateToken, function(req, res){
	let media_id = req.params.media_id;
	let updated_by = req.body.updated_by;
	let attr_to_update = {};
	attr_to_update['updated_datetime'] = get_current_datetime();
	attr_to_update['is_active_YN'] = 0;
	attr_to_update['updated_by'] = updated_by;

	MemberMedia.update(attr_to_update , {
		where: {
			"member_media_id": media_id
		}
	}).then(media => {
	  result = {success: true  , message: 'Media removed successfully.'};
		return res.status(200).send(result);
	});
});

// Generic Follow API, member shall be able to follow, teams, players, clubs events and universities via this API.
router.post('/follow', ValidateToken, function(req, res){
	let body = req.body;
	let association_id = body.association_id;
	let member_id = body.member_id;
	let created_by = body.created_by;
	let association_fk_id = body.association_fk_id;

	if (association_id && created_by && member_id && association_fk_id) {
		MemberAssociation.findOne({ where: {member_id: member_id , association_fk_id: association_fk_id, association_id: association_id} }).then(function(member_association){
			if (member_association) {
				member_association.updated_datetime = get_current_datetime();
				member_association.is_active_YN = 1;
				member_association.save().then(function(data){
					result = {success: true  , 'message': 'Followed successfully.', data: data };
					return res.status(200).send(result);
				}).catch(function(error){
					result = {success: false  , 'message': 'Something went wrong..', error: error };
					return res.status(500).send(result);
				});
			}else{
				body['created_datetime'] = get_current_datetime();
				MemberAssociation.create(body).then(function(data){
					result = {success: true  , 'message': 'Followed successfully.', data: data };
					return res.status(200).send(result);
				}).catch(function(error){
					result = {success: false  , 'message': 'Something went wrong..', error: error };
					return res.status(500).send(result);
				});
			}
		});
	}else{
		result = {success: false  , 'error': 'Bad Data Provided.' };
		return res.status(400).send(result);
	}
});

// Follow Multiple at a time.
router.post('/follow-multiple', ValidateToken, function(req, res){
	let body = req.body;
	let association_id = body.association_id;
	let member_id = body.member_id;
	let data = body.data;
	let created_by = body.created_by;
	if (member_id && association_id && created_by) {
		data.forEach(function(object){
			if (object.association_fk_id) {
				object['member_id'] = member_id;
				object['association_id'] = association_id;
				object['created_by'] = created_by;
				MemberAssociation.findOne({ where: {member_id: member_id , association_fk_id: object.association_fk_id, association_id: association_id} }).then(function(member_association){
					if (member_association) {
						member_association.updated_datetime = get_current_datetime();
						member_association.is_active_YN = 1;
						console.log("Updating:         ", member_association);
						member_association.save();
					}else{
						object['created_datetime'] = get_current_datetime();
						console.log("SAVING::                    ", object);
						MemberAssociation.create(object);
					}
				});
			}
		});
		result = {success: true, 'message': 'Objects are added in the queue. They will be followed shortly.' };
		return res.status(200).send(result);
	}else{
		result = {success: false  , 'error': 'Bad Data Provided.' };
		return res.status(400).send(result);
	}
});

// Follow Multiple at a time.
router.put('/unfollow-multiple', ValidateToken, function(req, res){
	let body = req.body;
	let association_id = body.association_id;
	let member_id = body.member_id;
	let data = body.data;
	let updated_by = body.updated_by;

	if (member_id && association_id) {
		data.forEach(function(object){
			if (object.association_fk_id) {
				MemberAssociation.findOne({ where: {member_id: member_id , association_fk_id: object.association_fk_id, association_id: association_id} }).then(function(member_association){
					if (member_association) {
						member_association.updated_datetime = get_current_datetime();
						member_association.is_active_YN = 0;
						console.log("Updating:         ", member_association);
						// To unfollow we will set is_active to 0.
						if (updated_by) {
							member_association.updated_by = updated_by;
						}
						member_association.save();
					}
				});
			}
		});
		result = {success: true, 'message': 'Objects are added in the queue. They will be unfollowed shortly.' };
		return res.status(200).send(result);
	}else{
		result = {success: false  , 'error': 'Bad Data Provided.' };
		return res.status(400).send(result);
	}
});

// Generic Unfollow API, member shall be able to unfollow, teams, players, clubs events and universities via this API.
router.put('/unfollow', ValidateToken, function(req, res){
	let body = req.body;
	let association_id = body.association_id;
	let member_id = body.member_id;
	let updated_by = body.updated_by;
	let association_fk_id = body.association_fk_id;

	if (association_id && member_id && association_fk_id) {
		MemberAssociation.findOne({ where: {member_id: member_id , association_fk_id: association_fk_id, association_id: association_id} }).then(function(member_association){
			if (member_association) {
				member_association.updated_datetime = get_current_datetime();
				// To unfollow we will set is_active to 0.
				if (updated_by) {
					member_association.updated_by = updated_by;
				}

				member_association.is_active_YN = 0;
				member_association.save().then(function(data){
					result = {success: true  , 'message': 'Unfollowed successfully.', data: data };
					return res.status(200).send(result);
				}).catch(function(error){
					result = {success: false  , 'message': 'Something went wrong..', error: error };
					return res.status(500).send(result);
				});
			}else{
				result = {success: false  , 'error': 'Member is already not following.' };
				return res.status(400).send(result);
			}
		});
	}else{
		result = {success: false  , 'error': 'Bad Data Provided.' };
		return res.status(400).send(result);
	}
});


// Get Club information by id
router.get('/club/:id', ValidateToken, function(req, res){
	let id = req.params.id;
	let query = "Select * from v_api_org_summary where org_id='"+id+"'";
	sequelize
    .query(query)
    .then(data => {
    	club = format_clubs_json(data[0], 'json_org_info');
    	let result = {success: true, message: "Club retrieved successfully."  ,club: club[0]};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the club.' , error: error};
		return res.status(500).send(result);
	});
});

// 

// Get Club Stats
router.get('/club/:id/stats', ValidateToken, function(req, res){
	let id = req.params.id;
	let start_date = req.query.start_date;
	let end_date = req.query.end_date;
	let additional_query = '';
	
	let query = "Select * from v_json_org_team_summary where org_id='"+id+"'";
	// Add Start Data and End data Query, the start and end date does not exist in the view, so, waiting for that.
	// if (start_date) {
	// 	additional_query = " AND "
	// }

	sequelize
    .query(query)
    .then(data => {
    	club = format_clubs_json(data[0], 'json_team_stats');
    	let result = {success: true, message: "Club retrieved successfully."  ,club: club[0]};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the club.' , error: error};
		return res.status(500).send(result);
	});
});


// Get player followed by the member
router.get('/get-players-followed-by-member/:member_id', ValidateToken, function(req, res){
	let member_id = req.params.member_id;
	// Grouping by player id to get only 1 row, right now it is fetching 5 6 rows per member...
	let query = "SELECT * from v_api_member_player_assoc_summary where member_id='"+member_id+"' group by player_id;";
  sequelize
    .query(query)
    .then(players => {
      let result = {success: true, message: "Players retrieved successfully."  ,players: players[0]};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the players following.' , error: error};
		return res.status(500).send(result);
	});
});

router.get('/teams/stats', ValidateToken, function(req, res){
	let team_id = req.query.team_id;
	let team_year = req.query.team_year;
	let additional_query = '';
	if (team_id || team_year) {
		let query = "Select * from v_json_teams_stats WHERE";
		if (team_id) {
			additional_query = " team_id='"+team_id +"' and";
		}

		if (team_year) {
			additional_query += " team_year='"+team_year +"'";
		}
		
		if (additional_query.endsWith('and')) {
			additional_query = additional_query.replace(/and([^_]*)$/,'');
		}
		query += additional_query;
		sequelize
	    .query(query)
	    .then(teams => {
	    	teams = format_clubs_json(teams[0], 'json_team_stats');
	      let result = {success: true, message: "Teams Stats retrieved successfully.", teams: teams};
	    	return res.status(200).send(result);	  
	    }).catch(function(error){
			console.log("ERROR:     " , error);
			result = {success: false  , message: 'Something went wrong.Could not fetch the teams statistics.' , error: error};
			return res.status(500).send(result);
		})
	}else{
		result = {success: false  , message: 'Missing Parameters. Team Id or Team Year is required.'};
		return res.status(400).send(result);
	}
});

// Get player followed by the member
router.get('/get-clubs-followed-by-member/:member_id', ValidateToken, function(req, res){
	let member_id = req.params.member_id;
	let query = "Select * from v_api_member_club_assoc_summary where member_id='"+member_id+"'";
	sequelize
    .query(query)
    .then(clubs => {
    	// The json_team_stats column returned incomplete JSON response, so, we cannot format that, once that issue is fixed from db then we will format that.
    	clubs = format_clubs_json(clubs[0], 'json_team_stats');
      let result = {success: true, message: "Clubs retrieved successfully."  ,clubs: clubs};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the clubs.' , error: error};
		return res.status(500).send(result);
	});
});

function format_clubs_json(objects, key){
	let multi_stats_json;
	let club_stat;
	objects.forEach(function(object){
		// Check if stats are available
		if (object[key]) {
			// Check if there are multiple objects for an object
			if (object[key].indexOf("},") >= 0){
				// spliting the object to parse it and convert to json
				multi_stats_json = object[key].split('},');
				// for multiple object, we will return array of objects.
				object[key] = [];
				multi_stats_json.forEach(function(stat_json){
				    // when we split, it removes the }, so, we are adding if it does not have }
				    if(!stat_json.endsWith('}')){
			        stat_json = stat_json + '}';
				    }
				    // Parse string into JSON and push to response.
				    object[key].push(JSON.parse(stat_json));
				});
			}else{
				object_stat = JSON.parse(object[key]);
				object[key] = [];
				object[key].push(object_stat);
			}
		}else{
			object[key] = [];
		}
		// console.log("Object:                 ", object);
	});
	return objects;
}

// Search Players by name
router.get('/players/search', ValidateToken, function(req, res){
	let name = req.query.name;
	let query = "Select * from v_api_player_stats";
	if (name) {
		// Replacing space with wildcard
		name = name.replace(" ", "%");
		if (name.endsWith('%')) {
			name = name.replace(/%([^_]*)$/,'');
		}
		query += " Where LOWER(`full_name`) LIKE LOWER('%" + name+ "%');";
	}else{
		result = {success: false  , message: 'Search cannot be empty. Name is required.'};
		return res.status(400).send(result);
	}

	sequelize
    .query(query)
    .then(clubs => {
      let result = {success: true, message: "Players retrieved successfully."  ,clubs: clubs[0]};
			return res.status(200).send(result);
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the players.' , error: error};
		return res.status(500).send(result);
	})
});

// Get all clubs
router.get('/clubs', ValidateToken, function(req, res){
	let result;
	let query = "Select org_id as club_id, org_name, org_state, sport_id, org_logo_url, org_state, num_teams, num_players from organizations WHERE";
	let additional_query = "";
	let limit_query = "";
	let offset_query = "";
	let limit  = req.query.limit;
	let offset  = req.query.offset;
	let sport_id = req.query.sport_id;
	let state = req.query.state;
	let name = req.query.club_name;

	if (name) {
		// Replacing space with wildcard 
		name = name.replace(" ", "%");
		if (name.endsWith('%')) {
			name = name.replace(/%([^_]*)$/,'');
		}
		additional_query = " LOWER(`org_name`) LIKE LOWER('%" + name+ "%') and";
	}
	if (sport_id) {
		additional_query += " sport_id="+sport_id + " and";
	}
	if (state) {
		additional_query += " LOWER(`org_state`) LIKE LOWER('%"+ state+"%')";
	}

	if (additional_query.endsWith('and')) {
		additional_query = additional_query.replace(/and([^_]*)$/,'');
	}

	if (offset) {
		offset_query = " offset " + offset;
	}

	if (limit) {
		limit_query = " limit " + limit;
	}
	query += additional_query;
	if (query.endsWith("WHERE")) {
		query = query.replace(/WHERE([^_]*)$/,'');
	}

	query += limit_query + offset_query;
	sequelize.query(query).then(clubs => {
		sequelize.query("Select count(*) as total from organizations;").then(clubs_count => {
			let total_clubs = clubs_count[0];
			if (total_clubs.length > 0) {
				total_clubs = total_clubs[0].total;
			}

			let result = {success: true, message: "Clubs retrieved successfully.", clubs: clubs[0], matched_clubs_count: clubs[0].length, total_clubs_count: total_clubs};
			return res.status(200).send(result);
		});
  }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the clubs following.' , error: error};
		return res.status(500).send(result);
	})
});

// Get Players a Member follows and its stats
router.get('/members/:member_id/players-with-stats', ValidateToken, function(req, res){
	let member_id = req.params.member_id;
	var ids = "";
	let query = "Select distinct(player_id) from v_api_member_player_assoc_summary where member_id='"+member_id+"'";
  sequelize
    .query(query)
    .then(player_ids => {
			if (player_ids[0].length == 0) {
				result = {success: true  , message: 'Member is not following any player.' , players: []};
				return res.status(200).send(result);
			}
			player_ids[0].forEach(function(id){
				ids += `'` + id['player_id'] + `',`
			});
			if (ids.endsWith(',')) {
				ids = ids.replace(/,([^_]*)$/,'');
			}

			query = "Select * from v_api_member_player_assoc_summary where player_id IN (" + ids+ ")";
			sequelize.query(query).then(players => {

		      let result = {success: true, message: "Players retrieved successfully."  ,players: players[0]};
					return res.status(200).send(result);
		    }).catch(function(error){
				console.log("ERROR:     " , error);
				result = {success: false  , message: 'Something went wrong.Could not fetch the players following.' , error: error};
				return res.status(500).send(result);
			})
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the players following.' , error: error};
		return res.status(500).send(result);
	})
});

// Get Player Stats by Player ID
router.get('/players/get-stats-by-id/:player_id', ValidateToken, function(req, res){
	let player_id = req.params.player_id;
	let query = "SELECT * from v_json_player_summary_stats where player_id='"+player_id+"'";
	sequelize
    .query(query)
    .then(stats => {
    	stats = format_json_data(stats[0]);
      let result = {success: true, message: "Players Stats retrieved successfully."  ,player: stats[0]};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the players following.' , error: error};
		return res.status(500).send(result);
	})
});

// Get Stats of all the players throughout the year.
router.get('/players/stats/:year', ValidateToken, function(req, res){
	let team_year = req.params.year;
	let query = "SELECT * from v_api_player_stats where team_year='"+team_year+"'";
	sequelize
    .query(query)
    .then(stats => {
    	stats = format_json_data(stats[0]);
      let result = {success: true, message: "Players Stats retrieved successfully."  ,stats: stats};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the players following.' , error: error};
		return res.status(500).send(result);
	});
});

function format_json_data(stats){
	let multi_stats_json;
	let player_stat;

	stats.forEach(function(stat){
		// Check if stats are available
		if (stat['json_player_stats']) {
			// Check if there are multiple objects for a player
			if (stat['json_player_stats'].indexOf("},") >= 0){
				// spliting the object to parse it and convert to json
				multi_stats_json = stat['json_player_stats'].split('},');
				// for multiple object, we will return array of objects.
				stat['json_player_stats'] = [];
				multi_stats_json.forEach(function(stat_json){
				    // when we split, it removes the }, so, we are adding if it does not have }
				    if(!stat_json.endsWith('}')){
			        stat_json = stat_json + '}';
				    }
				    // Parse string into JSON and push to response.
				    stat['json_player_stats'].push(JSON.parse(stat_json));
				});
			}else{
				player_stat = JSON.parse(stat['json_player_stats']);
				stat['json_player_stats'] = [];
				stat['json_player_stats'].push(player_stat);
			}
		}else{
			stat['json_player_stats'] = [];
		}
	});
	return stats;
}
// Brackets Implementation
// Get Brackets by EventId
router.get('/brackets/:event_id', ValidateToken, function(req, res){
	let event_id = req.params.event_id;
	let games_brackets;

	GamesBracket.findAll({where: {event_id: event_id}}).then(function(data){
		games_brackets = data;
		GamesBracketDisplay.findAll({where: {event_id: event_id}}).then(function(bracket){
			result = {success: true  , bracket: bracket , games_brackets: games_brackets };
			return res.status(200).send(result);

		}).catch(function(error){
			console.log("ERROR:      ", error);
			result = {success: false  , error: error };
			return res.status(500).send(result);
		});
	}).catch(function(error){
		console.log("ERROR:      ", error);
		result = {success: false  , error: error };
		return res.status(500).send(result);
	});	
});

// Save Brackets Details.
router.post('/brackets', ValidateToken, function (req, res) {
	let body = req.body;
	let is_valid_request = check_if_valid_brackets_request(body);
	let brackets_data = {};
	let display_brackets_data = {};
	let result = {};

	if (is_valid_request){
		brackets_data = get_brackets_data(body, brackets_data);
		display_brackets_data = get_display_brackets_data(body, display_brackets_data);
				
		GamesBracket.findOne({where: {game_id: body.game_id, event_id: body.event_id , division: body.division, bracket_year: body.bracket_year}}).then(function(games_brackets){
			if (games_brackets) {
				games_brackets.update(brackets_data);
			}else{
				GamesBracket.create(brackets_data);
			}
			GamesBracketDisplay.findOne({where: {event_id: body.event_id , division: body.division, bracket_year: body.bracket_year}}).then(function(games_brackets_display){
				if (games_brackets_display) {
					games_brackets_display.update(display_brackets_data).then(function(brackets_data_display){
						result = {success: true  , message: "Bracket Saved successfully."};
  					return res.status(200).send(result);
					});;
				}else{
					GamesBracketDisplay.create(display_brackets_data).then(function(brackets_data_display){
						result = {success: true  , message: "Bracket Saved successfully."};
  					return res.status(200).send(result);
					});
				}
			});
		}).catch(function(err){
			result = {success: false  , error: err};
  		return res.status(500).send(result);
		});
	}else{
		result = {success: false  , message: 'Bad Data Provided.'};
  	return res.status(400).send(result);
	}
});

function check_if_valid_brackets_request(body){
	if (body) {
		let raw_data = body.raw_data;
		let game_id = body.game_id;
		let division = body.division;
		let bracket_year = body.bracket_year;
		let event_id = body.event_id;
		let round_id = body.round_id;
		let game_num = body.game_num;
		let created_by = body.created_by;
		if (game_id && division && bracket_year && event_id && round_id && game_num && created_by && raw_data){
			return true;
		}		
	}
	return false;
}

function get_brackets_data(body, brackets_data){
	brackets_data['event_id'] = body.event_id;
	brackets_data['division'] = body.division;
	brackets_data['bracket_year'] = body.bracket_year;
	brackets_data['game_id'] = body.game_id;
	brackets_data['round_id'] = body.round_id;
	brackets_data['game_num'] = body.game_num;
	brackets_data['results_order'] = body.results_order;
	brackets_data['seed_num_away'] = body.seed_num_away;
	brackets_data['seed_num_home'] = body.seed_num_home;
	brackets_data['created_by'] = body.created_by;
	brackets_data['created_datetime'] = get_current_datetime();
	return brackets_data;
}

function get_display_brackets_data(body, display_brackets_data){
	display_brackets_data['event_id'] = body.event_id;
	display_brackets_data['division'] = body.division;
	display_brackets_data['bracket_year'] = body.bracket_year;
	if (body.raw_data) {
		display_brackets_data['raw_data'] = body.raw_data;
	}
	// Setting default value as 1
	display_brackets_data['is_active_YN'] = 1;
	display_brackets_data['created_by'] = body.created_by;
	display_brackets_data['created_datetime'] = get_current_datetime();
	return display_brackets_data;
}

// Get Promocode details by the code
router.get('/get-promo-code/:code', ValidateToken, function(req, res){
	let result;
	let code = req.params.code;
	let data = [];
	
	let query = "SELECT * from v_promo_codes where promo_code='"+code+"'";
  sequelize
    .query(query)
    .then(promo_code => {
    	// Removing the extra array layer e.g [ [ ] ]
    	if (promo_code[0].length > 0) {
    		data = promo_code[0][0];
    	}else{
    		data = promo_code[0];
    	}
      let result = {success: true, message: "Promocode retrieved successfully."  ,promo_code: data};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the event games.' , error: error};
		return res.status(500).send(result);
	});
});

// Get the Intra game player details.....
router.get('/intragame-player-data', ValidateToken, function(req, res){
	let result;
	let stat_id = req.query.statistic_id;
	let event_id = req.query.event_id;
	let additional_query = '';
	
	if (stat_id) {
		additional_query = ` statistic_id='`+stat_id+`' and`;
	}
	if (event_id) {
		additional_query += ` event_id='`+event_id+`'`;
	}

	if (additional_query.endsWith('and')) {
		additional_query = additional_query.replace(/and([^_]*)$/,'');
	}

	let query = "SELECT * from v_intragame_event_game_player_data where";
	query +=  additional_query;
	
	if (query.endsWith('where')) {
		query = query.replace(/where([^_]*)$/,'');
	}	
	query += ';'
  sequelize
    .query(query)
    .then(data => {
    	let result = {success: true, message: "Intragame Players retrieved successfully."  ,data: data[0]};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the event games.' , error: error};
		return res.status(500).send(result);
	})
});

// Save User Login Audit.
router.post('/create-or-update-login-audit', ValidateToken, function (req, res) {
	let body = req.body;
	let member_id = body.member_id;
	let result = {};
	let current_time = get_current_datetime();
	if (body && member_id){
		body['created_datetime'] = current_time;
		
		MemberLoginAudit.create(body).then((member) => {
  			result = {success: true , message: 'Login Audit details have been persisted successfully.', member: member};
  			return res.status(200).send(result);
			}).catch(error => {
		  	console.log(error);
		  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
		  		message = error.errors[0].message;
		  	}else{
		  		message = "Something went wrong, could not save data."
		  	}
		  	console.log('ERROR      ' , error);
		  	result = {success: false  , message: message , error: error};
		  	return res.status(400).send(result);
		 	});
	}else{
		result = {success: false  , message: 'Bad Data Provided.'};
  	return res.status(400).send(result);
	}
});

// Events
router.get('/get-event-games/:id', ValidateToken, function(req, res){
	let result;
	let event_id = req.params.id;
	let division_id = req.query.division_id;
	
	let additional_query = '';
  	if (division_id) {
    	additional_query = " and division_id='"+division_id+"'";
  	}
  
	let query = "SELECT * from v_teams_games where v_teams_games.is_active_YN != 0 and tournament_id='"+event_id+"'";
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
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the event games.' , error: error};
		return res.status(500).send(result);
	})
});

// Get all events
router.get('/all-events', ValidateToken, function(req, res){
	let result;
	// let query = `Select * from v_events;`
	Event.findAll({
	  include: [{
	    model: EventLocation,
	  },
	  {
	    model: EventFormat,
	  }]
	}).then(events => {
      let result = {success: true, message: "Events retrieved successfully."  ,events: events};
    	return res.status(200).send(result);	  
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the event games.' , error: error};
		return res.status(500).send(result);
	});
});

// Get event by id
router.get('/events/:event_id', ValidateToken, function(req, res){
	let result;
	let event_id = req.params.event_id;

	Event.findOne({where: {event_id: event_id},
	  include: [{
	    model: EventLocation,
	  },
	  {
	    model: EventFormat,
	  }]
	}).then(event => {
      let result = {success: true, message: "Event retrieved successfully."  ,event: event};
			return res.status(200).send(result);
    }).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the event.' , error: error};
		return res.status(500).send(result);
	});
});

router.get('/get-laxers-data', ValidateToken, function(req, res){
	let type = req.query.type;
	let id = req.query.param_value;
	// CALL `usp_reporting_accuracy`('event_id','NXTSH001')
	sequelize.query("CALL `usp_reporting_accuracy`('"+type+"','"+id+"');").then((data) => {
		result = {success: true  , data: data};
		return res.status(200).send(result);
	}).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.' , error: error};
		return res.status(500).send(result);
	})
});

// Get all events and all followers
router.get('/all-events-followers', ValidateToken, function(req, res){
	let result;
	let query = `SELECT * FROM clubsports.v_member_events_association where is_active_YN = 1 ;`;
	sequelize.query(query).then(([results, metadata]) => {
		result = {success: true  , message: 'Event Followers retrieved successfully.' , events: results};
		return res.status(200).send(result);
	}).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the events.' , error: error};
		return res.status(500).send(result);
	})
});

router.get('/get-events-followers-by-member-id/:id', ValidateToken, function(req, res){
	let member_id = req.params.id;
	let result;
	let query = `SELECT * FROM v_member_events_association WHERE is_active_YN = 1 and member_id='`+member_id+`'`;

	sequelize.query(query).then(([results, metadata]) => {

		result = {success: true  , message: 'Event Followers retrieved successfully.' , events: results};
		return res.status(200).send(result);
	}).catch(function(error){
		console.log("ERROR:     " , error);
		result = {success: false  , message: 'Something went wrong.Could not fetch the events.' , error: error};
		return res.status(500).send(result);
	})
});

// Create Followers of Events
router.post('/member-events', ValidateToken, function (req, res) {
	let body = req.body;
	let created_or_updated_by = req.body.created_or_updated_by;
	let success = true;
	let result = {};
	console.log(body);
	if (body){
		let data = body.data;
		if (data) {
			data.forEach(function(obj){
				console.log("OBJ:           " , obj);
				MemberEvent.findOne({where: {member_id: obj.member_id , event_id: obj.event_id}})
				  .then((member) => {
				  	if (member) {
				  		if (created_or_updated_by) {
								obj['updated_by'] = created_or_updated_by;
							}
				  		obj['update_datetime'] = Date.now();
				  		obj['is_active_YN'] = 1;
				  		member.update(obj);
				  	}else{
				  		obj['created_datetime'] = Date.now();
				  		if (created_or_updated_by) {
								obj['created_by'] = created_or_updated_by;
							}
				  		MemberEvent.create(obj);
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

// Unfollow Members from Events
router.put("/remove_member_event", ValidateToken, (req, res, next) => {
	let member_id = req.body.member_id;
	let events = req.body.event_ids;
	let updated_by = req.body.updated_by;
	let attr_to_update = {
		'is_active_YN': 0,
		'update_datetime': Date.now()
	};
	if (updated_by) {
		attr_to_update['updated_by'] = updated_by;
	}

	if (events){
		events.forEach(function(event){
			console.log('Event ID   ' , event.event_id);
			MemberEvent.update(attr_to_update , {
				where: {
					"member_id": member_id,
					"event_id": event.event_id
				}
			}).then(response => {
			  console.log("response         " , response);
			});
		});
	}
	result = {success: true , "message": "Event Members have been added in queue. They will be unfollowed shortly."};
	return res.status(200).send(result);
});

// Player Game Stats
router.get('/players-games-stats', ValidateToken, function(req, res){
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

router.get('/players-summary-stats', ValidateToken, function(req, res){
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
router.get('/normalized_team_games/:id', ValidateToken, function(req, res){
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
router.get('/team-stats', ValidateToken, function(req, res){
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

router.get('/team-stats/:id', ValidateToken, function(req, res){
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
router.post('/member-team', ValidateToken, function (req, res) {
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

router.get('/get-member-team', ValidateToken, function(req, res){
	let query= "SELECT m.member_id, m.team_id, t.team_name FROM member_associations m inner join teams t on m.association_fk_id = t.team_id where m.is_active_YN=1 and m.association_id=3;";
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

// Get teams followed by member 
router.get('/get-teams-by-member-id/:member_id', ValidateToken, function(req, res){
	let member_id = req.params.member_id;
	let sport_id = req.query.sport_id;
	let additional_query = '';
	if (sport_id) {
		additional_query = ` and t.sport_id='`+sport_id+ `'`;
	}
	// let query= "SELECT m.member_id, m.team_id, t.* FROM member_teams_association m inner join teams t on m.team_id = t.team_id where m.is_active_YN=1 and member_id='"+member_id+"'";
	
	let query = "SELECT m.member_id, t.* FROM member_associations m inner join teams t on m.association_fk_id = t.team_id where m.is_active_YN=1 and m.association_id=3 and member_id='"+member_id+"'";

	query += additional_query;
	
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
router.post('/members', ValidateToken, function (req, res) {
	let body = req.body;
	let member_id = body.member_id;
	if (!member_id) {
		member_id = makeid(8);
	}
	let result = {};
	let current_time = get_current_datetime();
	if (body){
		body['member_id'] = member_id;
		body['created_datetime'] = current_time;
		body['sport_id_default'] = 1;
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

router.post('/save-members-data', ValidateToken, function (req, res) {
	let body = req.body;
	let success = true;
	let result = {};
	if (body){
		let data = body.data;
		if (data) {
			data.forEach(function(obj){
				MemberData.findOne({where: {member_id: obj.member_id , field_name: obj.field_name}})
				  .then((member_data) => {
				  	console.log('');
				  	if (member_data) {
				  		console.log("Updating Object.          " , obj);
				  		member_data.update(obj);
				  	}else{
				  		console.log('Creating Object.           ', obj);
				  		MemberData.create(obj);
				  	}
					}).catch(error => {
				  	console.log(error);
				  	if (error && error.errors && error.errors.length > 0 && error.errors[0].message) {
				  		message = error.errors[0].message;
				  	}else{
				  		message = "Something went wrong, could not save member data."
				  	}
				  	console.log('ERROR      ' , error);
				  	result = {success: false  , message: message};
				 	});
			});
			result = {success: true, message: "Data is added in the queue. Data will saved soon."};
			return res.status(200).send(result);
		}
	 }else{
	 	result = {success: false  , message: 'Bad data provided.'};
	 	return res.status(400).send(result);
	}
});
// Removed the Validation to force update the App
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

router.get("/get-member-by-email/:email", ValidateToken, (req, res, next) => {
	let body = req.body;
	let email = req.params.email;
	let result;

  Member.findOne({
	  where: {
	    email_address: email,
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


// Update Member API
router.put("/update-member/:id", ValidateToken, (req, res, next) => {
	let member_id = req.params.id;
	let body = req.body;
	// let sport_id = req.body.sport_id;
	
	// let attr_to_update = {};
	
	// if (sport_id) {
	// 	attr_to_update['sport_id_default'] = sport_id;
	// }
	// if (body.first_name) {
	// 	attr_to_update['first_name'] = body.first_name;
	// }
	// if (body.last_name) {
	// 	attr_to_update['last_name'] = body.last_name;
	// }

	Member.update(body , {
		where: {
			"member_id": member_id
		}
	}).then(response => {
		console.log('Member:       ', response);
	  if (response && response[0]) {
	  	result = {success: true , 'message': 'Member updated successfully.'};	
	  }else{
	  	result = {success: false , 'message': 'Member could not be updated.'};	
	  }
		return res.status(200).send(result);
	}).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

// Intra Game Reporting APIs
router.delete("/game-stats/:id/delete", ValidateToken, (req, res, next) => {
	let stat_id = req.params.id;
	let result;
	// IntraGameData.update({is_active_YN: 0} , { where: { id: stat_id }})
		IntraGameData.findOne({where: { id: stat_id }})
		.then(function(stat){
			if (stat) {
				stat.update({is_active_YN: 0}).then(function(response){
					if (response[0] == 0) {
						result = {success: false  ,message: "Something went wrong. Could not delete the game stat."};
						return res.status(400).send(result);
					}else{
						if (stat_id == 1) {
		          let query = `CALL usp_update_games_table('`+ stat.game_id +`');`;
		          sequelize.query(query);
		        }
						result = {success: true  ,message: "Game Stat deleted successfully."};
						return res.status(200).send(result);
					}
				});
			}else{
				result = {success: false  ,message: "Stat not found."};
				return res.status(400).send(result);
			}
		}).catch(function(error){
			result = {success: false  ,message: "Something went wrong. Could not delete the game stat." , error: error};
			return res.status(500).send(result);
		});
});

router.put("/remove_member_team", ValidateToken, (req, res, next) => {
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

router.get("/game-stats/:id", ValidateToken, (req, res, next) => {
	let body = req.body;
	let game_id = req.params.id;
	let result;

	// let query = "SELECT ir.id as game_stat_id , players.first_name , players.last_name , players.jersey_number, players.position_description , players.player_id, teams.team_name , teams.team_id, ir.member_id , ir.created_datetime as stat_time, games.tournament_name, games.away_team_score , games.home_team_score, games.game_date,stats.statistic_id as statistic_id , stats.statistic_name , stats.stat_UI_short FROM clubsports.intragame_reporting as ir inner join games on games.game_id = ir.game_id left join statistics as stats on ir.statistic_id = stats.statistic_id left join players on ir.player_id=players.player_id left join teams on players.team_id=teams.team_id where ir.is_active_YN != 0 && ir.game_id = '"+ game_id+ "' order by game_stat_id desc;";

	let query = "SELECT IRid, reported_datetime, game_id, team_id, team_name, short_name, player_id, jersey_number, statistic_id, parent_statistic_name, statistic_name, stat_ui_short, mobile_delay_secs, dialogue_box, is_active_YN, visible_gameday_YN, CAST(parent_statistic_id AS UNSIGNED) as parent_statistic_id, reporting_member from v_intragame_player_detail where game_id='" + game_id + "' and is_active_YN != 0 order by IRid";
	// added 'reporting_member' to this query so that we can see who entered the statistic  - Dan 12/10/2019
	sequelize.query(query).then(games => {
    let result = {success: true, message: "Game Stats retrieved successfully."  ,games: games[0]};
		return res.status(200).send(result);
  }).catch(function(error){
  	console.log("ERROR:      " , error);
  	let result = {success: false, error: error};
		return res.status(500).send(result);
  });
});

router.put('/game-stat/:id', ValidateToken, function (req, res) {
	let body = req.body;
	let attr_to_update = {};
	var stat_id = req.params.id;
	let statistic_id = req.body.statistic_id;
	let result;	
	if (body && stat_id){
		if (body.is_active_YN) {
			attr_to_update['is_active_YN'] = body.is_active_YN;
		}
		if (body.player_id) {
			attr_to_update['player_id'] = body.player_id;
		}
		if (body.update_member_id) {
			attr_to_update['updated_member_id'] = body.update_member_id;
		}
		attr_to_update['updated_datetime'] = Date.now();

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
					if ((statistic_id == 1 || statistic_id == 10 || statistic_id == 11 || statistic_id == 12) && body.is_active_YN == 0) {
						let query = `CALL usp_update_games_table('`+ stat.game_id +`');`;
	          sequelize.query(query).then();;
	        }
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
router.get("/games-by-caspio", ValidateToken, (req, res, next) => {
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

router.get("/games", ValidateToken, (req, res, next) => {
	let member_id = req.query.created_by;
	let team_ids = '';
	var todayDate = new Date().toISOString().slice(0,10);
	let result;

	if (member_id) {
		MemberAssociation.findAll({
			attributes: ['association_fk_id']
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
					console.log(team_id.team_id);
					if (team_id.team_id != undefined) {
						if (team_ids == '') {
							team_ids = "'" + team_id.team_id  + "'";
						}else{
							team_ids += ",'" + team_id.team_id + "'";
						}	
					}
				});

				if (team_ids == '') {
					let games = []
					let result = {success: true, message: "No Games found for the member."  ,games: games};
					return res.status(200).send(result);
				}else{
					let query = "SELECT * from v_teams_games where (v_teams_games.home_team_id IN ("+team_ids+") OR v_teams_games.away_team_id IN ("+team_ids+")) AND v_teams_games.is_active_YN != 0";

					let date_query = "AND game_date < '"+todayDate+"'";
				}

				// let order_query = " limit 12";
				// query = query + order_query;

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

router.put('/game/:id', ValidateToken, function (req, res) {
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
router.post('/team', ValidateToken, function (req, res) {
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

router.get('/teams', ValidateToken, function(req, res){
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

router.get('/all_teams', ValidateToken, function(req, res){
	let query_obj;
	let sport_id = req.query.sport_id;
	if (sport_id) {
		query_obj = {
			is_active_YN: {
	    	[Op.ne]: 0
	    },
	    sport_id: sport_id
		}
	}else{
		query_obj = {
			is_active_YN: {
	    	[Op.ne]: 0
	    }
		}
	}
	Team.findAll({
	  where: query_obj
	}).then(function(teams){
		let result = {success: true  ,teams: teams};
	 	return res.status(200).send(result);
	});
});

router.get('/team/:id', ValidateToken, function(req, res){
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
router.post('/player', ValidateToken, function (req, res) {
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
			    is_active_YN: {
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
router.put('/players/edit', ValidateToken, function (req, res) {
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
				if (player.is_active_YN && player.is_active_YN != null) {
					attr_to_update['is_active_YN'] = player.is_active_YN;
				}
				if (player.position_description ) {
					attr_to_update['position_description'] = player.position_description;
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

router.put('/player/:id', ValidateToken, function (req, res) {
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

		if (body.is_active_YN) {
			attr_to_update['is_active_YN'] = body.is_active_YN;
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

router.get('/players', ValidateToken, function(req, res){
	let team_id = req.query.team_id;
	Player.findAll({
	  where: {
	    team_id: team_id,
	    is_active_YN: {
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
// Removed the Validation to force the users to update the app.
router.get('/stats', function(req, res){
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
router.post('/game_participants', ValidateToken, function (req, res) {
	let body = req.body;
	let game_id = body.game_id;
	let member_id = body.member_id;
	let message;
	players = body.players;
	let created_datetime = Date.now()
	players.forEach(function(player){
		body = {
			game_id: game_id, 
			reporting_member_id: member_id ,
			player_id: player.player_id,
			player_first_name: player.player_first_name,
			player_last_name: player.player_last_name,
			player_jersey_num: player.player_jersey_num,
			created_datetime: created_datetime
		}
		GameParticipant.findOrCreate({where: {game_id: game_id , player_id: player.player_id}, defaults: body }).then(([participant, created]) => {
	    console.log(participant.get({
	      plain: true
	    }))
	    console.log('created         ' , created);
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

router.get('/game_participants/:id', ValidateToken, function(req, res){
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

router.post('/register', function(req, res){
	var body = req.body;
	var email = body.email_address;
	var password = body.password;
	if (email && password && email != '' && password.length >= 8) {
		bcrypt.hash(password , 10, function(err, hash){
			if (err) {
				return res.status(500).send({
					success: false,
					error: err
				});
			}else{
				body['password'] = hash;
				body['member_id'] = makeid(8);
				Member.findOrCreate({where: {email_address: email}, defaults: body})
	  		.then(([member, created]) => {
	  			result = {success: true , message: "Member created successfully." , member: member};
	  			return res.status(200).send(result);
	  		}).catch(error => {
	  			return res.status(500).send({
						success: false,
						error: error
					});
	  		});
			}
		});
	}else{
		result = {success: false  , message: 'Invalid Email or password provided. Password minimum length is 8 characters.'};
  	return res.status(400).send(result);
	}
});

router.post('/login', function(req, res){
	let email = req.body.email_address;
	let password = req.body.password;
	let obj;
	if (!email || !password) {
		return res.status(400).send({
				success: false,
				"message": "Email and Password is required."
			});
	}
	Member.findOne({
		where: {
			email_address: email
		}
	}).then(function(member){
		if (member) {
			bcrypt.compare(password, member.password, function(err, response) {
				if (err) {
					return res.status(500).send({
						success: false,
						error: err
					});		
				}else{
					if (response == true) {
						jwt.sign({member} , config.secret, { expiresIn: '24h' } , function(err , token){
							if (err) {
								return res.status(500).send({
									success: false,
									error: err
								});
							}
							return res.status(200).send({
								token: token,
								success: true,
								message: 'User is logged in successfully.'
							});
						});
					}else{
						return res.status(400).send({
							success: false,
							error: 'Invalid Password provided.'
						});
					}
				}
			});
		}else{
			return res.status(400).send({
				success: false,
				"message": "Member not found."
			});
		}
	});
});

// Format of TOKEN
// Authorization: Bearer <access_token>
function ValidateToken(req , res, next) {
	// Until Validation on Mobile Application are implemented by , We are by passing the security on production, so Apps don't stop working.
	// return next();

	const bearer_header = req.headers['authorization'];
	if (bearer_header == undefined) {
		// Forbidden
		return res.status(403).send({
			success: false,
			"message": "Bearer Token not found."
		});
	}else{
		const bearer = bearer_header.split(' ');
		const token = bearer[1];
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
		      verify_cognito_token(token)
					.then(function(response){
						if (response.success == true) {
							next();
						}else{
							return res.status(403).send({
								success: false,
								"message": response.message
							});
						}
					})
					.catch(function(error){
						console.log('Error: ', error);
						return res.status(403).send({
							success: false,
							"error": error
						});
					});
		    } else {
		      console.log("Error! Unable to download JWKs");
		      return res.status(403).send({
						success: false,
						"message": "Error! Unable to download JWKs"
					});
		    }
		  });	
		}else{
			verify_cognito_token(token)
			.then(function(response){
				if (response.success == true) {
					next();
				}else{
					return res.status(403).send({
						success: false,
						"message": response.message
					});
				}
			})
			.catch(function(error){
				console.log('Error: ', error);
				return res.status(403).send({
					success: false,
					"error": error
				});
			});
		}
	 }
}

async function verify_cognito_token(token){
	pems = {};
  var jwk = { kty: process.env['KEY_TYPE'], n: process.env['MODULUS'], e: process.env['EXPONENT']};
  var pem = jwkToPem(jwk);
  pems[process.env['KEY_ID']] = pem;
  var response = {};
  //validate the token
  var decodedJwt = jwt.decode(token, {complete: true});
  if (!decodedJwt) {
    console.log("Not a valid JWT token");
    return response = {
			success: false,
			"message": "Not a valid JWT token."
		};
  }

  var kid = decodedJwt.header.kid;
  var pem = pems[kid];
  if (!pem) {
    console.log('Invalid token');
    return response = {
			success: false,
			"message": "Invalid Token. Pem not found."
		};
  }

  return jwt.verify(token, pem, function(err, payload) {
    if(err) {
      console.log("Invalid Token.");
      return response = {
				success: false,
				"message": err['message']
			};
    } else {
      console.log("Valid Token.");
      console.log(payload);
      sub = payload['sub'];
      return response = {
      	success: true,
      	"message": "Token is valid."
      }
      // next();
    }
  });
}

function makeid(length) {
   var result           = '';
   var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
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
