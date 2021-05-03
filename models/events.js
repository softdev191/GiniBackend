module.exports = (sequelize, type) => {
    return sequelize.define('events', {
        event_id: {
          type: type.STRING(8),
          primaryKey: true,
          unique: true
        },
        sport_id: {
          type: type.TINYINT(4),

        },
        format_id: {
          type: type.TINYINT(4),
          allowNull: false
        },
        event_type: type.STRING(30),
        event_desc: type.STRING(100),
        event_address: type.STRING(100),
        event_city: type.STRING(40),
        event_state: type.STRING(10),
        event_startdate: {
          type: type.DATE,
          allowNull: false
        },
        event_enddate: {
          type: type.DATE
        },
        event_location_lat: type.FLOAT,
        event_location_long: type.FLOAT,
        multilocation: type.STRING(3),

        event_map_desc: {
          type: type.STRING(30)
        },
        event_map_url: {
          type: type.STRING(120)
        },
        is_live_YN: type.TINYINT(4),
        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
        created_datetime: {
      		type: type.DATE
      	},
        updated_by: type.STRING(40),
      	updated_datetime: {
      		type: type.DATE
      	}
    },{
      timestamps: false,
      freezeTableName: true
    })
}