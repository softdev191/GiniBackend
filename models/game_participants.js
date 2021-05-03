module.exports = (sequelize, type) => {
  return sequelize.define('game_participants', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    game_id: {
    	type: type.STRING(8),
    	allowNull: false
    },
  	player_id: {
  		type: type.STRING(8),
      allowNull: false
    },
  	player_first_name: {
  		type: type.STRING(30)
  	},
  	player_last_name: {
  		type: type.STRING(30)
  	},
  	player_jersey_num: type.INTEGER(11),
    reporting_member_id: {
      type: type.STRING(8),
      allowNull: false
    },
  	created_datetime: {
  		type: type.DATE
  	},
  	updated_datetime: {
  		type: type.DATE
  	}
  },{
    timestamps: false,
  })
}