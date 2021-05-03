module.exports = (sequelize, type) => {
    return sequelize.define('member_association_type', {
        association_id: {
          type: type.TINYINT(4),
          primaryKey: true,
          autoIncrement: true
        },
        association_desc: {
          type: type.STRING(30),
          allowNull: false
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