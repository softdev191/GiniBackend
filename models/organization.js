module.exports = (sequelize, type) => {
    return sequelize.define('organization', {
        org_id: {
          type: type.STRING(8),
          primaryKey: true,
          unique: true
        },
        org_parent_id: {
          type: type.STRING(8)
        },
        club_abbr: {
        	type: type.STRING(4),
        },
        sport_id: {
        	type: type.INTEGER(11),
        	allowNull: false
        },
        org_type: type.STRING(25),
        org_name: {
        	type: type.STRING(80),
        	allowNull: false
        },
        org_short_name: {
        	type: type.STRING(35)
        },
        org_desc: {
        	type: type.STRING(150)
        },
        num_teams: type.INTEGER(11),
        num_players: type.INTEGER(11),
        num_followers: type.INTEGER(11),
        org_address_1: type.STRING(100),
        org_address_2: type.STRING(50),
        org_city: type.STRING(50),
        org_state: type.STRING(6),
        org_zip: type.STRING(10),
        main_contact: type.STRING(40),
        org_logo_url: type.STRING(100),
        org_website_url: type.STRING(100),
        email_address: type.STRING(40),
        org_timezone: type.STRING(10),
        org_instagram: type.STRING(40),
        sponsors_events_YN: type.TINYINT(4),
        event_production_only_YN: type.TINYINT(4),
        is_active_YN: {
        	type: type.TINYINT(4),
        	defaultValue: 1
        },
        add_member_id: type.STRING(8),
        add_ip: type.STRING(25),

        created_datetime: {
      		type: type.DATE,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      	},
      	created_by: type.STRING(8)
    },{
      timestamps: false
    })
}