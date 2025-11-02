const express = require('express');
const { auth, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private
router.get('/overview', [auth, requireClientCode], async (req, res) => {
  try {
    const { Product, Category, Warehouse, Inventory, PurchaseOrder, SalesOrder } = req.models;

    // Get basic counts
    const [
      totalProducts,
      totalCategories,
      totalWarehouses,
      totalPurchaseOrders,
      totalSalesOrders
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      Warehouse.countDocuments({ isActive: true }),
      PurchaseOrder.countDocuments(),
      SalesOrder.countDocuments()
    ]);

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentPurchases, recentSales] = await Promise.all([
      PurchaseOrder.countDocuments({ 
        orderDate: { $gte: thirtyDaysAgo } 
      }),
      SalesOrder.countDocuments({ 
        orderDate: { $gte: thirtyDaysAgo } 
      })
    ]);

    // Get revenue (last 30 days)
    const revenueResult = await SalesOrder.aggregate([
      { 
        $match: { 
          orderDate: { $gte: thirtyDaysAgo },
          status: { $in: ['shipped', 'delivered'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get low stock products
    const lowStockProducts = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          $expr: { $lte: ['$quantity', '$productInfo.reorderLevel'] },
          'productInfo.isActive': true
        }
      },
      { $count: 'total' }
    ]);

    const lowStockCount = lowStockProducts[0]?.total || 0;

    res.json({
      overview: {
        totalProducts,
        totalCategories,
        totalWarehouses,
        totalPurchaseOrders,
        totalSalesOrders,
        recentPurchases,
        recentSales,
        totalRevenue,
        lowStockCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities
// @access  Private
router.get('/recent-activities', [auth, requireClientCode], async (req, res) => {
  try {
    const { PurchaseOrder, SalesOrder } = req.models;
    const limit = parseInt(req.query.limit) || 10;

    const [recentPurchases, recentSales] = await Promise.all([
      PurchaseOrder.find()
        .populate('supplier', 'name')
        .populate('warehouse', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('orderNumber supplier status totalAmount createdAt'),
      
      SalesOrder.find()
        .populate('warehouse', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('orderNumber customer.name status totalAmount createdAt')
    ]);

    // Combine and sort activities
    const activities = [
      ...recentPurchases.map(po => ({
        type: 'purchase',
        id: po._id,
        orderNumber: po.orderNumber,
        party: po.supplier?.name,
        warehouse: po.warehouse?.name,
        status: po.status,
        amount: po.totalAmount,
        createdAt: po.createdAt,
        createdBy: po.createdBy?.name
      })),
      ...recentSales.map(so => ({
        type: 'sale',
        id: so._id,
        orderNumber: so.orderNumber,
        party: so.customer.name,
        warehouse: so.warehouse?.name,
        status: so.status,
        amount: so.totalAmount,
        createdAt: so.createdAt,
        createdBy: so.createdBy?.name
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
     .slice(0, limit);

    res.json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/inventory-alerts
// @desc    Get inventory alerts (low stock, out of stock)
// @access  Private
router.get('/inventory-alerts', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    
    const lowStockProducts = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      { $unwind: '$warehouseInfo' },
      {
        $match: {
          $or: [
            { 
              $and: [
                { quantity: { $gt: 0 } },
                { $expr: { $lte: ['$quantity', '$productInfo.reorderLevel'] } }
              ]
            },
            { quantity: 0 }
          ],
          'productInfo.isActive': true,
          'warehouseInfo.isActive': true
        }
      },
      {
        $project: {
          product: {
            _id: '$productInfo._id',
            name: '$productInfo.name',
            sku: '$productInfo.sku',
            reorderLevel: '$productInfo.reorderLevel',
            minStockLevel: '$productInfo.minStockLevel'
          },
          warehouse: {
            _id: '$warehouseInfo._id',
            name: '$warehouseInfo.name',
            code: '$warehouseInfo.code'
          },
          currentQuantity: '$quantity',
          alertType: {
            $cond: {
              if: { $eq: ['$quantity', 0] },
              then: 'out_of_stock',
              else: 'low_stock'
            }
          }
        }
      },
      { $sort: { alertType: 1, 'product.name': 1 } },
      { $limit: 50 }
    ]);

    res.json({ alerts: lowStockProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-products
// @desc    Get top selling products
// @access  Private
router.get('/top-products', [auth, requireClientCode], async (req, res) => {
  try {
    const { SalesOrder } = req.models;
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topProducts = await SalesOrder.aggregate([
      { 
        $match: { 
          orderDate: { $gte: startDate },
          status: { $in: ['shipped', 'delivered'] }
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantitySold: { $sum: '$items.shippedQuantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          product: {
            _id: '$productInfo._id',
            name: '$productInfo.name',
            sku: '$productInfo.sku'
          },
          totalQuantitySold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 }
    ]);

    res.json({ topProducts, period: `${days} days` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales data for chart
// @access  Private
router.get('/sales-chart', [auth, requireClientCode], async (req, res) => {
  try {
    const { SalesOrder, PurchaseOrder } = req.models;
    const { period = 'month' } = req.query;
    let groupBy, startDate;

    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      groupBy = {
        $dateToString: { 
          format: '%Y-%m-%d', 
          date: '$orderDate' 
        }
      };
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      groupBy = {
        $dateToString: { 
          format: '%Y-%m-%d', 
          date: '$orderDate' 
        }
      };
    } else { // year
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      groupBy = {
        $dateToString: { 
          format: '%Y-%m', 
          date: '$orderDate' 
        }
      };
    }

    const salesData = await SalesOrder.aggregate([
      { 
        $match: { 
          orderDate: { $gte: startDate },
          status: { $in: ['shipped', 'delivered'] }
        } 
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const purchaseData = await PurchaseOrder.aggregate([
      { 
        $match: { 
          orderDate: { $gte: startDate },
          status: 'received'
        } 
      },
      {
        $group: {
          _id: groupBy,
          totalPurchases: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ 
      salesData, 
      purchaseData, 
      period 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/warehouse-summary
// @desc    Get warehouse summary
// @access  Private
router.get('/warehouse-summary', [auth, requireClientCode], async (req, res) => {
  try {
    const { Warehouse } = req.models;
    
    const warehouseSummary = await Warehouse.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'warehouse',
          as: 'inventory'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          capacity: 1,
          currentOccupancy: 1,
          totalProducts: { $size: '$inventory' },
          totalQuantity: { $sum: '$inventory.quantity' },
          occupancyPercentage: {
            $cond: {
              if: { $eq: ['$capacity', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$currentOccupancy', '$capacity'] },
                  100
                ]
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({ warehouses: warehouseSummary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
