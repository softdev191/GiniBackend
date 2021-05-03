module.exports = (sequelize, type) => {
    return sequelize.define('players', {
        row_num: {
          type: type.BIGINT,
          primaryKey: true,
          unique: true,
          autoIncrement: true
        },
        player_id: {
          type: type.STRING(8),
          allowNull: false,
          unique: true
        },
        team_id: {
        	type: type.STRING(8),
        	allowNull: false
        },
        first_name: type.STRING(50),
      	last_name: type.STRING(70),
        jersey_number: type.INTEGER,
        position_description: type.STRING(20),
        is_subscriber_YN: type.TINYINT(4),
      	is_active_YN: type.INTEGER(1),
        created_by: type.STRING(25),
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