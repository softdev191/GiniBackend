module.exports = (sequelize, type) => {
    return sequelize.define('member_tokens', {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },
        token: {
        	type: type.TEXT('long'),
          allowNull: false
        },
        token_generation_time: {
      		type: type.DATE,
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