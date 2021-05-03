module.exports = (sequelize, type) => {
  return sequelize.define('events_format', {
    format_id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    format_description: {
    	type: type.STRING(100),
    	allowNull: false
    },
    period_type: type.TINYINT(4),
    central_timer: type.STRING(5),
    scoring_rules: type.STRING(50),
    playoff_determination: type.STRING(60),
    OT_rules: type.STRING(50),
    is_active_YN: {
    	type: type.TINYINT(4),
    	allowNull: false
    },
    created_by:{
    	type: type.STRING(40),
    	allowNull: false
    },
    created_datetime: {
    	type: type.DATE,
    	allowNull: false
    },
    updated_by:{
    	type: type.STRING(40)
    },
    updated_datetime: {
    	type: type.DATE
    }
  },{
    timestamps: false,
    freezeTableName: true
  })
}