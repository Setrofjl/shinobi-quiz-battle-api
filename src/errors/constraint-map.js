// A database rule was broken -> what the client should hear.
// The key is the constraint name from YOUR migration. PostgreSQL names a
// foreign key "<table>_<column>_fkey" when the migration does not name it.
// Write one entry for each constraint a client can hit. Example:
//
//   uq_player_nickname: {
//     status: 409,
//     code: 'NICKNAME_TAKEN',
//     message: 'That nickname is already used in this game.',
//   },
//
// A constraint that is not listed here still answers 409, with the code CONFLICT.
module.exports = {
  uq_player_session_nickname: {
    status: 409,
    code: 'NICKNAME_TAKEN',
    message: 'That nickname is already used in this session.',
  },
  uq_player_session_user: {
    status: 409,
    code: 'SEAT_ALREADY_EXISTS',
    message: 'This account already has a seat in the session.',
  },
  uq_game_session_join_code: {
    status: 409,
    code: 'SESSION_CODE_CONFLICT',
    message: 'That session code is already in use. Try again.',
  },
  GameSession_questionSetId_fkey: {
    status: 409,
    code: 'QUESTION_SET_IN_USE',
    message: 'This question set is used by a session and cannot be deleted.',
  },
};
