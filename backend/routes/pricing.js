const express = require('express');
const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/pricing/overview
// @desc    Get pricing overview and analytics
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    // Get pricing statistics
    const pricingStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgCostPrice: { $avg: '$costPrice' },
          avgSellingPrice: { $avg: '$sellingPrice' },
          minCostPrice: { $min: '$costPrice' },
          maxCostPrice: { $max: '$costPrice' },
          minSellingPrice: { $min: '$sellingPrice' },
          maxSellingPrice: { $max: '$sellingPrice' },
          totalValue: { $sum: { $multiply: ['$costPrice', 1] } }
        }
      }
    ]);

    // Get profit margin distribution
    const profitMargins = await Product.aggregate([
      { $match: { isActive: true, costPrice: { $gt: 0 } } },
      {
        $project: {
          profitMargin: {
            $round: [
              { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
              2
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$profitMargin', 10] }, then: '0-10%' },
                { case: { $lt: ['$profitMargin', 25] }, then: '10-25%' },
                { case: { $lt: ['$profitMargin', 50] }, then: '25-50%' },
                { case: { $lt: ['$profitMargin', 75] }, then: '50-75%' },
                { case: { $gte: ['$profitMargin', 75] }, then: '75%+' }
              ],
              default: 'Other'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get top profitable products
    const topProfitableProducts = await Product.aggregate([
      { $match: { isActive: true, costPrice: { $gt: 0 } } },
      {
        $project: {
          name: 1,
          sku: 1,
          costPrice: 1,
          sellingPrice: 1,
          profitMargin: {
            $round: [
              { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
              2
            ]
          },
          profitAmount: { $subtract: ['$sellingPrice', '$costPrice'] }
        }
      },
      { $sort: { profitMargin: -1 } },
      { $limit: 10 }
    ]);

    const stats = pricingStats[0] || {
      totalProducts: 0,
      avgCostPrice: 0,
      avgSellingPrice: 0,
      minCostPrice: 0,
      maxCostPrice: 0,
      minSellingPrice: 0,
      maxSellingPrice: 0,
      totalValue: 0
    };

    res.json({
      pricingOverview: {
        totalProducts: stats.totalProducts,
        averageCostPrice: Math.round(stats.avgCostPrice * 100) / 100,
        averageSellingPrice: Math.round(stats.avgSellingPrice * 100) / 100,
        averageProfitMargin: stats.avgCostPrice > 0 ?
          Math.round(((stats.avgSellingPrice - stats.avgCostPrice) / stats.avgCostPrice) * 100 * 100) / 100 : 0,
        priceRange: {
          cost: {
            min: Math.round(stats.minCostPrice * 100) / 100,
            max: Math.round(stats.maxCostPrice * 100) / 100
          },
          selling: {
            min: Math.round(stats.minSellingPrice * 100) / 100,
            max: Math.round(stats.maxSellingPrice * 100) / 100
          }
        },
        totalInventoryValue: Math.round(stats.totalValue * 100) / 100
      },
      profitMarginDistribution: profitMargins,
      topProfitableProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pricing/products
// @desc    Get product pricing details
// @access  Private
router.get('/products', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'profitMargin',
      sortOrder = 'desc',
      category,
      minMargin,
      maxMargin
    } = req.query;

    const query = { isActive: true };
    const sort = {};

    if (category) {
      query.category = category;
    }

    if (minMargin !== undefined || maxMargin !== undefined) {
      query.$expr = query.$expr || {};
      if (minMargin !== undefined && maxMargin !== undefined) {
        query.$expr = {
          $and: [
            {
              $gte: [
                { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
                Number.parseFloat(minMargin)
              ]
            },
            {
              $lte: [
                { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
                Number.parseFloat(maxMargin)
              ]
            }
          ]
        };
      } else if (minMargin !== undefined) {
        query.$expr = {
          $gte: [
            { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
            Number.parseFloat(minMargin)
          ]
        };
      } else if (maxMargin !== undefined) {
        query.$expr = {
          $lte: [
            { $multiply: [{ $divide: [{ $subtract: ['$sellingPrice', '$costPrice'] }, '$costPrice'] }, 100] },
            Number.parseFloat(maxMargin)
          ]
        };
      }
    }

    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('name sku costPrice sellingPrice category');

    // Add calculated fields
    const productsWithPricing = products.map(product => {
      const profitAmount = product.sellingPrice - product.costPrice;
      const profitMargin = product.costPrice > 0 ? (profitAmount / product.costPrice) * 100 : 0;

      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        pricing: {
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          profitAmount: Math.round(profitAmount * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100
        }
      };
    });

    const total = await Product.countDocuments(query);

    res.json({
      products: productsWithPricing,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pricing/categories
// @desc    Get pricing by categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categoryPricing = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          productCount: { $sum: 1 },
          avgCostPrice: { $avg: '$costPrice' },
          avgSellingPrice: { $avg: '$sellingPrice' },
          minSellingPrice: { $min: '$sellingPrice' },
          maxSellingPrice: { $max: '$sellingPrice' },
          totalValue: { $sum: '$costPrice' }
        }
      },
      {
        $project: {
          categoryName: 1,
          productCount: 1,
          avgCostPrice: { $round: ['$avgCostPrice', 2] },
          avgSellingPrice: { $round: ['$avgSellingPrice', 2] },
          minSellingPrice: { $round: ['$minSellingPrice', 2] },
          maxSellingPrice: { $round: ['$maxSellingPrice', 2] },
          avgProfitMargin: {
            $round: [
              { $multiply: [{ $divide: [{ $subtract: ['$avgSellingPrice', '$avgCostPrice'] }, '$avgCostPrice'] }, 100] },
              2
            ]
          },
          totalValue: { $round: ['$totalValue', 2] }
        }
      },
      { $sort: { categoryName: 1 } }
    ]);

    res.json({ categoryPricing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pricing/trends
// @desc    Get pricing trends over time
// @access  Private
router.get('/trends', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let groupBy, startDate;

    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      groupBy = {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$createdAt'
        }
      };
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      groupBy = {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$createdAt'
        }
      };
    } else { // year
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      groupBy = {
        $dateToString: {
          format: '%Y-%m',
          date: '$createdAt'
        }
      };
    }

    const pricingTrends = await Product.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: groupBy,
          productCount: { $sum: 1 },
          avgCostPrice: { $avg: '$costPrice' },
          avgSellingPrice: { $avg: '$sellingPrice' },
          totalValue: { $sum: '$costPrice' }
        }
      },
      {
        $project: {
          date: '$_id',
          productCount: 1,
          avgCostPrice: { $round: ['$avgCostPrice', 2] },
          avgSellingPrice: { $round: ['$avgSellingPrice', 2] },
          avgProfitMargin: {
            $round: [
              { $multiply: [{ $divide: [{ $subtract: ['$avgSellingPrice', '$avgCostPrice'] }, '$avgCostPrice'] }, 100] },
              2
            ]
          },
          totalValue: { $round: ['$totalValue', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      pricingTrends,
      period
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pricing/product/:id
// @desc    Get detailed pricing for a specific product
// @access  Private
router.get('/product/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate pricing details
    const profitAmount = product.sellingPrice - product.costPrice;
    const profitMargin = product.costPrice > 0 ? (profitAmount / product.costPrice) * 100 : 0;

    // Get sales history for pricing analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesHistory = await SalesOrder.aggregate([
      { $match: { orderDate: { $gte: thirtyDaysAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.product': product._id } },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.shippedQuantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          avgPrice: { $avg: '$items.unitPrice' }
        }
      }
    ]);

    const salesData = salesHistory[0] || {
      totalSold: 0,
      totalRevenue: 0,
      avgPrice: 0
    };

    res.json({
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        pricing: {
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          profitAmount: Math.round(profitAmount * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100
        },
        salesData: {
          totalSold: salesData.totalSold,
          totalRevenue: Math.round(salesData.totalRevenue * 100) / 100,
          avgSellingPrice: Math.round(salesData.avgPrice * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
