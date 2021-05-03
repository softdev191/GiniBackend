module.exports = (sequelize, type) => {
    return sequelize.define('games_brackets', {
        bracket_id: {
          type: type.INTEGER(11),
          primaryKey: true,
      		autoIncrement: true
        },
        game_id: {
        	type: type.STRING(8),
        	allowNull: false
        },
        event_id: {
          type: type.STRING(8),
          allowNull: false
        },
        division: {
          type: type.STRING(14),
          allowNull: false
        },
        bracket_year: {
          type: type.INTEGER(11),
          allowNull: false
        },
        round_id: {
        	type: type.STRING(20),
        	allowNull: false
        },
        game_num: {
        	type: type.INTEGER(11),
        	allowNull: false
        },
        results_order: type.INTEGER(11),
        seed_num_away: type.TINYINT(11),
        seed_num_home: type.TINYINT(4),
        created_by: {
        	type: type.STRING(40),
        	allowNull: false
        },
        created_datetime: {
      		type: type.DATE,
      		allowNull: false
      	},
      	updated_by: type.STRING(40),
      	updated_datetime: {
      		type: type.DATE
      	}
    },{
      timestamps: false,
    })
}