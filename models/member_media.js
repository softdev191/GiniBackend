module.exports = (sequelize, type) => {
    return sequelize.define('member_media', {
        member_media_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },
        media_type: {
          type: type.STRING(20),
          allowNull: false
        },
        media_thumbnail_url: {
          type: type.STRING(200),
          allowNull: false
        },
        media_file_url: {
          type: type.STRING(200),
          allowNull: false
        },
        is_active_YN: {
          type: type.TINYINT(4),
          defalutValue: 1
        },
        media_description: {
          type: type.STRING(254)
        },
        date_taken: {
          type: type.DATE
        },
        latitude: {
          type: type.FLOAT
        },
        longitude: {
          type: type.FLOAT
        },
        altitude: {
          type: type.FLOAT
        },
        media_aspect_ratio: {
          type: type.FLOAT,
          allowNull: false
        },
        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
        created_datetime: {
          type: type.DATE,
          allowNull: false
        },
        updated_datetime: {
          type: type.DATE
        },
        updated_by: type.STRING(40)
    },{
      timestamps: false,
      freezeTableName: true
    })
}
