module.exports = (sequelize, type) => {
    return sequelize.define('member_data', {
        row_num: {
          type: type.BIGINT,
          primaryKey: true,
          unique: true,
          autoIncrement: true
        },
        member_id: {
          type: type.STRING(9),
          allowNull: false
        },
        field_name: {
        	type: type.STRING(20),
        	allowNull: false
        },
        field_value: {
        	type: type.STRING(40)
        },
        is_active_YN: {
        	type: type.INTEGER(1),
        	allowNull: false,
        	defaultValue: 1
        },
        created_datetime: {
      		type: type.DATE,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      	},
      	created_by: type.STRING(40),
      	updated_datetime: {
      		type: type.DATE
      	},
      	updated_by: type.STRING(40)
    },{
      freezeTableName: true,
      timestamps: false,
      updated_datetime: 'updateTimestamp',
    })
}