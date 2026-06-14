let io = null;

exports.init = (ioInstance) => {
  io = ioInstance;
};

exports.emitToTeam = (teamId, event, data) => {
  if (!io) return;
  io.to(teamId.toString()).emit(event, data);
};

exports.emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(userId.toString()).emit(event, data);
};

exports.getIO = () => io;
