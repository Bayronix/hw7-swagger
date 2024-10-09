import createHttpError from 'http-errors';
import sessionCollection from '../db/models/Session.js';
import userCollection from '../db/models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Спочатку перевіряємо заголовок Authorization
    const authHeader = req.get('Authorization');

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      } else {
        return next(createHttpError(401, 'Auth header should be of type Bearer'));
      }
    }

    
    if (!token) {
      token = req.query.token; 
    }

    if (!token) {
      return next(createHttpError(401, 'Please provide Authorization header or token in query'));
    }

    const session = await sessionCollection.findOne({ accessToken: token });

    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    const isAccessTokenExpired = new Date() > new Date(session.accessTokenValidUntil);

    if (isAccessTokenExpired) {
      return next(createHttpError(401, 'Access token expired'));
    }

    const user = await userCollection.findById(session.userId);

    if (!user) {
      return next(createHttpError(401, 'User not found'));
    }

    req.user = user;

    next();
  } catch  {
    next(createHttpError(500, 'Internal Server Error'));
  }
};
