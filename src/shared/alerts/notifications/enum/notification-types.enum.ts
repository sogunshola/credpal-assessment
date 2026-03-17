export enum NotificationTypes {
  REQUEST_MADE = 'request_made',
  REQUEST_ACCEPTED_CUSTOMER = 'request_accepted_customer',
  REQUEST_DECLINED_CUSTOMER = 'request_declined_customer',
  REQUEST_ACCEPTED_VENDOR = 'request_accepted_vendor',
  REQUEST_DECLINED_VENDOR = 'request_declined_vendor',
  SENT_MONEY = 'sent_money',
  RECEIVED_MONEY = 'received_money',
  FUNDED_WALLET = 'funded_wallet',
  WITHDRAWAL = 'withdrawal',

  ORDER_MADE = 'order_made',
  ORDER_REQUEST_RECEIVED = 'order_request_received',
  ORDER_DISPATCHED = 'order_dispatched',
  ORDER_DELIVERED = 'order_delivered',
}
