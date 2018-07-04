const logger = require('./logger');

describe('logger', () => {

  it('should log something', () => {
    logger.info('something');
    logger.warn('a bit more');
  });

});