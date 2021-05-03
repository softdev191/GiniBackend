const Sequelize = require('sequelize');
const GameModel = require('./models/games');
const GameParticipantModel = require('./models/game_participants');
const MemberTeamModel = require('./models/member_teams_association');
const IntraGameDataModel = require('./models/intragame_reporting');
const PlayerModel = require('./models/players');
const TeamModel = require('./models/teams');
const StatModel = require('./models/statistics');
const MemberModel = require('./models/members');
const MemberDataModel = require('./models/member_data');
const EventModel = require('./models/events');
const EventLocationModel = require('./models/event_location');
const EventFormatModel = require('./models/event_format');
const MemberEventModel = require('./models/member_events_association');
const MemberLoginAuditModel = require('./models/member_login_audit');
const MemberTokenModel = require('./models/member_tokens');
const GamesBracketModel = require('./models/games_brackets');
const GamesBracketDisplayModel = require('./models/games_brackets_display');
const MemberAssociationModel = require('./models/member_association');
const MemberAssociationTypeModel = require('./models/member_association_type');
const OrganizationModel = require('./models/organization');
const MemberMediaModel = require('./models/member_media');
const MemberMediaReactionModel = require('./models/member_media_reactions');

let config = require('./services/config.json');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  pool: {
      max: 50,
      idle: 5000, //The maximum time, in milliseconds, that a connection can be idle before being released.
      acquire: 60000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
      evict: 1000 // after which sequelize-pool will remove idle connections.
    }
});

const Game = GameModel(sequelize, Sequelize);
const Player = PlayerModel(sequelize, Sequelize);
const GameParticipant = GameParticipantModel(sequelize, Sequelize);
const MemberTeam = MemberTeamModel(sequelize, Sequelize);
const IntraGameData = IntraGameDataModel(sequelize, Sequelize);
const Team = TeamModel(sequelize, Sequelize);
const Stat = StatModel(sequelize, Sequelize);
const Member = MemberModel(sequelize, Sequelize);
const MemberData = MemberDataModel(sequelize, Sequelize);
const Event = EventModel(sequelize, Sequelize);
const EventLocation = EventLocationModel(sequelize, Sequelize);
const EventFormat = EventFormatModel(sequelize, Sequelize);
const MemberEvent = MemberEventModel(sequelize, Sequelize);
const MemberLoginAudit = MemberLoginAuditModel(sequelize, Sequelize);
const MemberToken = MemberTokenModel(sequelize, Sequelize);
const GamesBracket = GamesBracketModel(sequelize, Sequelize);
const GamesBracketDisplay = GamesBracketDisplayModel(sequelize, Sequelize);
const MemberAssociation = MemberAssociationModel(sequelize, Sequelize);
const MemberAssociationType = MemberAssociationTypeModel(sequelize, Sequelize);
const Organization = OrganizationModel(sequelize, Sequelize);
const MemberMedia = MemberMediaModel(sequelize, Sequelize);
const MemberMediaReaction = MemberMediaReactionModel(sequelize, Sequelize);


Team.hasMany(Player, {foreignKey: 'team_id'});
Player.belongsTo(Team, {foreignKey: 'team_id'});

Event.hasMany(Game , {foreignKey: 'tournament_id'});
Game.belongsTo(Event, {foreignKey: 'tournament_id'});

Member.hasMany(MemberData, {foreignKey: 'member_id'});
MemberData.belongsTo(Member, {foreignKey: 'member_id'});

Event.hasMany(EventLocation, {foreignKey: 'event_id'});
EventLocation.belongsTo(Event, {foreignKey: 'event_id'});

EventFormat.hasMany(Event, {foreignKey: 'format_id'});
Event.belongsTo(EventFormat, {foreignKey: 'format_id'});

Event.hasMany(GamesBracket, {foreignKey: 'event_id'});
GamesBracket.belongsTo(Event, {foreignKey: 'event_id'});

Event.hasMany(GamesBracketDisplay, {foreignKey: 'event_id'});
GamesBracketDisplay.belongsTo(Event, {foreignKey: 'event_id'});

sequelize.sync()
  .then(() => {
    console.log(`Database & tables created!`)
  })

module.exports = {
  sequelize,
  Player,
  Game,
  GameParticipant,
  MemberTeam,
  IntraGameData,
  Team,
  Stat,
  Member,
  MemberData,
  Event,
  MemberEvent,
  MemberLoginAudit,
  MemberToken,
  EventLocation,
  EventFormat,
  GamesBracket,
  GamesBracketDisplay,
  MemberAssociation,
  MemberAssociationType,
  Organization,
  MemberMedia,
  MemberMediaReaction
}
