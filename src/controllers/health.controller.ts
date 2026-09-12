import { checkDatabaseConnection } from '../config/database.js';

export async function getHealth(_request, response, next) {
  try {
    const database = await checkDatabaseConnection();

    response.json({
      success: true,
      message: 'Maskank API is healthy',
      data: {
        service: 'backend',
        database: 'connected',
        databaseTime: database.current_time
      }
    });
  } catch (error) {
    next(error);
  }
}
