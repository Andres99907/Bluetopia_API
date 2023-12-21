'use strict';

module.exports = function(OrdersHistory) {
  /**
   *
   * @param {Function(Error, object)} callback
   */
  OrdersHistory.getOrdHist = function(callback) {
    OrdersHistory.find({include: 'usuario'}, (err, list) => {
      if (err) return callback(err);

      return callback(null, list);
    });
  };
};
