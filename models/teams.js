module.exports = (sequelize, type) => {
    return sequelize.define('teams', {
        team_id: {
          type: type.STRING(8),
          primaryKey: true,
          unique: true
        },
        sport_id: {
          type: type.INTEGER
        },
        gender: {
        	type: type.STRING(10)
        },
        team_name: type.STRING(60),
        short_name: type.STRING(30),
        team_tag: type.STRING(30),
        
      	team_level: type.STRING(10),
        team_division: type.STRING(15),
        team_year: type.INTEGER(11),
        
        parent_team_id: type.STRING(8),
        parent_team_name: type.STRING(60),
        
        is_active_YN: type.INTEGER(1),


        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
        updated_by: type.STRING(40),
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
