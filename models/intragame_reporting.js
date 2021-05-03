module.exports = (sequelize, type) => {
    return sequelize.define('intragame_reporting', {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        game_id: {
        	type: type.STRING(8),
        	allowNull: false
        },
        statistic_id: {
          type: type.INTEGER(11),
          allowNull: false
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },
        player_id: {
          type: type.STRING(8),
          allowNull: false
        },
        is_active_YN: type.INTEGER(1),
      	created_datetime: {
      		type: type.DATE
      	},
      	updated_datetime: {
      		type: type.DATE
      	},
        updated_member_id: {
          type: type.STRING(8)
        }
    },{
      freezeTableName: true,
      timestamps: false,
    })
}