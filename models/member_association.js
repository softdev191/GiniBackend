module.exports = (sequelize, type) => {
    return sequelize.define('member_associations', {
        row_num: {
          type: type.INTEGER(10),
          primaryKey: true,
          autoIncrement: true
        },
        app_id: type.TINYINT(4),
        sport_id: type.TINYINT(4),
        association_id: {
          type: type.TINYINT(4),
          allowNull: false
        },
        member_id: {
          type: type.STRING(8)
        },
        association_fk_id: {
        	type: type.STRING(8)
        },
        notifications_YN: {
          type: type.TINYINT(4),
          defaultValue: 1
        },
        is_active_YN: {
          type: type.TINYINT(4),
          defaultValue: 1
        },
        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
        updated_datetime: {
          type: type.DATE
        },
      	created_datetime: {
      		type: type.DATE,
          allowNull: false
      	},
      	updated_by: {
      		type: type.STRING(40)
      	}
    },{
      freezeTableName: true,
      timestamps: false,
    })
}