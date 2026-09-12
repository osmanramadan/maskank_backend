export function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || 500;
  let message = statusCode === 500 ? 'Internal server error' : error.message;

  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Image exceeds the maximum allowed file size';
  } else if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Too many image files were uploaded';
  }

  if (statusCode === 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    success: false,
    message
  });
}
