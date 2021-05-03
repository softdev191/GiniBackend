module.exports = (sequelize, type) => {
    return sequelize.define('statistics', {
        statistic_id: {
          type: type.INTEGER(3),
          primaryKey: true,
          unique: true
        },
        parent_statistic_id: {
          type: type.INTEGER(11)
        },
        sport_id: {
          type: type.INTEGER(1),
          allowNull: false
        },
        statistic_name: {
        	type: type.STRING(30),
        	allowNull: false
        },
        stat_UI_short: {
        	type: type.STRING(10)
        },
        mobile_delay_secs: {
        	type: type.INTEGER(3)
        },

        dialogue_box: {
        	type: type.STRING(60)
        },
        mobile_sort: type.INTEGER(4),
        is_active_YN: type.INTEGER(1),

        created_by: {
          type: type.STRING(40),
          allowNull: false
        },
      	created_datetime: {
          type: type.DATE,
          allowNull: false
        },
        updated_datetime: {
          type: type.DATE,
          allowNull: false
        }
    })
}