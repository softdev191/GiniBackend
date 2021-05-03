module.exports = (sequelize, type) => {
    return sequelize.define('member_media_reaction', {
        reaction_id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        member_media_id: {
          type: type.INTEGER(11),
          allowNull: false
        },
        member_id: {
          type: type.STRING(8),
          allowNull: false
        },

        is_active_YN: {
          type: type.TINYINT(4),
          defalutValue: 1
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
    })
}
