module.exports = (sequelize, type) => {
    return sequelize.define('games_brackets_display', {
        bracket_id: {
          type: type.INTEGER(11),
          primaryKey: true,
      		autoIncrement: true
        },
        event_id: {
          type: type.STRING(8),
          allowNull: false
        },
        raw_data: {
        	type: type.TEXT('long'),
        },
        division: {
          type: type.STRING(14),
          allowNull: false
        },
        bracket_year: {
          type: type.INTEGER(11),
          allowNull: false
        },
        is_active_YN: {
        	type: type.TINYINT(4),
        	default: 1,
        	allowNull: false
        },
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
      freezeTableName: true,
    })
}