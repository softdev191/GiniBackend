module.exports = (sequelize, type) => {
    return sequelize.define('members', {
        member_id: {
          type: type.STRING(9),
          allowNull: false,
          primaryKey: true,
          unique: true
        },
        email_address: {
          type: type.STRING(80),
          allowNull: false
        },
        password: {
          type: type.STRING(128)
        },
        email_validated: type.TINYINT(4),
        email_validation_GUID: type.STRING(32),
     	  cognito_sub: type.STRING(32), // added 12/20/2019 by Dan Cashion
        first_name: {
        	type: type.STRING(40)
        },
        last_name: {
        	type: type.STRING(50)
        },
        member_type: type.TINYINT(4),
        is_active_YN: {
        	type: type.INTEGER(1),
        	allowNull: false,
        	defaultValue: 1
        },
        is_subscriber_YN: type.INTEGER(4),
        media_subscriber_YN: type.TINYINT(4),
        subscription_startdate: type.DATE,
        sport_id_default: type.INTEGER(4),
        subscription_code: type.STRING(50),
        ios_UUID: type.STRING(128),
        android_UUID: type.STRING(128),
        access_token_ios: type.STRING(256),
        access_token_android: type.STRING(256),
        created_datetime: {
      		type: type.DATE
      	},
      	created_by: type.STRING(40),
        updated_datetime: {
          type: type.DATE
        },
        updated_by: type.STRING(40)
    },{
      timestamps: false,
    })
}
