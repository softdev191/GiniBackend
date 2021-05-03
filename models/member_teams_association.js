module.exports = (sequelize, type) => {
    return sequelize.define('member_teams_association', {
        row_num: {
          type: type.BIGINT,
          primaryKey: true,
          unique: true,
          autoIncrement: true
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },
        team_id: {
        	type: type.STRING(8),
        	allowNull: false
        },
        is_active_YN: {
          type: type.INTEGER(4)
        },
        update_date: {
          type: type.DATE
        },
      	created_datetime: {
      		type: type.DATE,
          allowNull: false
      	},
      	updated_datetime: {
      		type: type.DATE,
          allowNull: false
      	}
    },{
      freezeTableName: true
    })
}