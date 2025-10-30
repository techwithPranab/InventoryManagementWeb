// Sample shipping data for seeding
module.exports = [
  {
    carrier: 'FedEx',
    trackingNumber: 'FDX123456789',
    shippedDate: new Date(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    deliveredDate: null,
    status: 'shipped',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    notes: 'Handle with care',
    cost: 150
  },
  {
    carrier: 'UPS',
    trackingNumber: 'UPS987654321',
    shippedDate: new Date(),
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    deliveredDate: null,
    status: 'in_transit',
    shippingAddress: {
      street: '456 Park Ave',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      country: 'USA'
    },
    notes: '',
    cost: 90
  },
  {
    carrier: 'DHL',
    trackingNumber: 'DHL555888333',
    shippedDate: new Date(),
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    deliveredDate: null,
    status: 'pending',
    shippingAddress: {
      street: '789 Broadway',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94133',
      country: 'USA'
    },
    notes: 'Fragile',
    cost: 120
  }
];
