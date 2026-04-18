const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  it('should create a 400 error', () => {
    const err = ApiError.badRequest('Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err.status).toBe('fail');
  });

  it('should create a 401 error', () => {
    const err = ApiError.unauthorized('No access');
    expect(err.statusCode).toBe(401);
  });

  it('should create a 403 error', () => {
    const err = ApiError.forbidden('Not allowed');
    expect(err.statusCode).toBe(403);
  });

  it('should create a 404 error', () => {
    const err = ApiError.notFound('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('should create a 409 error', () => {
    const err = ApiError.conflict('Duplicate');
    expect(err.statusCode).toBe(409);
  });

  it('should create a 500 error with isOperational false', () => {
    const err = ApiError.internal('Server error');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('should set status to "fail" for 4xx', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe('fail');
  });

  it('should set status to "error" for 5xx', () => {
    const err = new ApiError(500, 'Server error');
    expect(err.status).toBe('error');
  });
});
