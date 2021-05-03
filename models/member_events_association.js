module.exports = (sequelize, type) => {
    return sequelize.define('member_events_association', {
        row_num: {
          type: type.INTEGER(10),
          primaryKey: true,
          unique: true,
          autoIncrement: true
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },
        event_id: {
        	type: type.STRING(8),
        	allowNull: false
        },
        is_active_YN: {
          type: type.TINYINT(4),
          defaultValue: 1
        },
        created_by: type.STRING(40),
        update_datetime: {
          type: type.DATE
        },
      	created_datetime: {
      		type: type.DATE
      	},
      	updated_by: {
      		type: type.STRING(40)
      	}
    },{
      freezeTableName: true,
      timestamps: false,
    })
}