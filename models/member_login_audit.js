module.exports = (sequelize, type) => {
    return sequelize.define('member_login_audit', {
        row_num: {
          type: type.BIGINT(20),
          primaryKey: true,
      		autoIncrement: true
        },
        member_id: type.STRING(8),
        ios_UUID: type.STRING(128),
        android_UUID: type.STRING(128),
        loginORlogout: type.TINYINT(4), //1 for login, anyother value for logout
        action_datetime: {
        	type: type.DATE,
        	allowNull: false
        },
        login_lat: type.FLOAT,
        login_long: type.FLOAT,
        android_access_token: type.STRING(250),
        ios_access_token: type.STRING(250),
        created_by: {
          type: type.STRING(40)
        },
        created_datetime: {
      		type: type.DATE
      	}
    },{
      timestamps: false,
      freezeTableName: true,
    })
}