module.exports = (sequelize, type) => {
    return sequelize.define('events_locations', {
        row_num: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        event_id: {
          type: type.STRING(8),
          allowNull: false
        },
        location_id: {
          type: type.STRING(8),
          allowNull: false
        },
        location_desc: type.STRING(50),
        address: type.STRING(60),
        city: type.STRING(30),
        state: type.STRING(8),
        location_lat: type.FLOAT,
        location_long: type.FLOAT,
        restrooms: type.STRING(40),
        num_toilets: type.FLOAT,
        restroom_details: type.STRING(100),
        parking_available: type.STRING(20),
        parking_details: type.STRING(100),
        parking_proximity: type.STRING(40),
        field_map_URL: type.STRING(200),
        is_active_YN: {
          type: type.TINYINT(4),
          allowNull: false
        },
        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
        created_datetime: {
          type: type.DATE,
          allowNull: false
        }
    },{
      timestamps: false,
      freezeTableName: true
    })
}
