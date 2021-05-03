module.exports = (sequelize, type) => {
    return sequelize.define('games', {
        game_id: {
          type: type.STRING(8),
          primaryKey: true,
          unique: true
        },
        tournament_id: {
          type: type.STRING(8)
        },
        sport_id: {
          type: type.STRING(8)
        },
        tournament_name: type.STRING(100),
        division: type.STRING(14),
        bracket_year: type.INTEGER(11),

        away_team_id: {
          type: type.STRING(8)
        },
        home_team_id: {
          type: type.STRING(8),
          allowNull: false
        },
        away_team_score: type.INTEGER(11),
      	game_location_city: {
      		type: type.STRING(50)
      	},
        home_team_score: type.INTEGER(11),
        field_description: type.STRING(30),
        field_desc: type.STRING(30),
      	game_location_state: {
      		type: type.STRING(10)
      	},
      	game_location_lat: {
      		type: type.FLOAT
      	},
      	game_location_long: type.FLOAT,
      	game_date: {
      		type: type.DATEONLY,
      		allowNull: false
      	},
      	game_time: type.DATE,
        is_active_YN: type.INTEGER(3),
        is_live_YN: type.SMALLINT,
      	created_datetime: {
      		type: type.DATE,
      		allowNull: false
      	},
      	updated_datetime: {
      		type: type.DATE,
      		allowNull: false
      	}
    })
}