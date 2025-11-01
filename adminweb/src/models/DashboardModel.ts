import mongoose from 'mongoose';
import User from './User';
import SubscriptionPlan from './SubscriptionPlan';
import ContactModel from './ContactModel';
import SupportTicketModel from './SupportTicketModel';

export interface IDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  totalContacts: number;
  totalSupportTickets: number;
  openSupportTickets: number;
  monthlyRevenue: number;
  recentSignups: number;
}

export interface IAdminDashboardStats {
  users: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  inventory: {
    totalSetups: number;
    completedSetups: number;
    inProgressSetups: number;
    failedSetups: number;
  };
  revenue: {
    monthly: number;
    yearly: number;
  };
  system: {
    activeUsers: number;
    totalRevenue: number;
  };
}

export interface IActivity {
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  user: string;
}

class DashboardModel {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<IDashboardStats> {
    try {
      // Get user statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSignups = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Get subscription statistics
      const totalSubscriptions = await SubscriptionPlan.countDocuments({ isActive: true });

      // Calculate monthly revenue (simplified - you might want to track actual payments)
      const activePlans = await SubscriptionPlan.find({ isActive: true });
      const monthlyRevenue = activePlans.reduce((total, plan) => {
        return total + (plan.billingCycle === 'monthly' ? plan.price : plan.price / 12);
      }, 0);

      // Get contact statistics
      const totalContacts = await ContactModel.countDocuments();

      // Get support ticket statistics
      const totalSupportTickets = await SupportTicketModel.countDocuments();
      const openSupportTickets = await SupportTicketModel.countDocuments({
        status: { $in: ['open', 'in-progress', 'waiting-for-customer'] }
      });

      return {
        totalUsers,
        activeUsers,
        totalSubscriptions,
        totalContacts,
        totalSupportTickets,
        openSupportTickets,
        monthlyRevenue,
        recentSignups
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 10): Promise<IActivity[]> {
    try {
      const activities: IActivity[] = [];

      // Get recent user signups
      const recentUsers = await User.find()
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      recentUsers.forEach(user => {
        activities.push({
          type: 'user_signup',
          title: 'New user registered',
          description: `${user.name} joined the platform`,
          timestamp: user.createdAt,
          user: user.name
        });
      });

      // Get recent support tickets
      const recentTickets = await SupportTicketModel.find()
        .select('ticketNumber subject status createdAt customerName')
        .sort({ createdAt: -1 })
        .limit(5);

      recentTickets.forEach(ticket => {
        activities.push({
          type: 'support_ticket',
          title: 'New support ticket',
          description: `Ticket ${ticket.ticketNumber}: ${ticket.subject}`,
          timestamp: ticket.createdAt,
          user: ticket.customerName
        });
      });

      // Sort all activities by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error('Failed to fetch recent activities');
    }
  }

  /**
   * Get admin dashboard statistics (for admin panel)
   */
  static async getAdminDashboardStats(): Promise<IAdminDashboardStats> {
    try {
      // Get user statistics by status
      const userStats = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const users = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      };

      userStats.forEach(stat => {
        users.total += stat.count;
        if (stat._id === 'pending') users.pending = stat.count;
        if (stat._id === 'approved') users.approved = stat.count;
        if (stat._id === 'rejected') users.rejected = stat.count;
      });

      // For now, set inventory stats to 0 since we don't have inventory setup model yet
      // This should be updated when inventory setup functionality is implemented
      const inventory = {
        totalSetups: 0,
        completedSetups: 0,
        inProgressSetups: 0,
        failedSetups: 0
      };

      // Calculate revenue from subscriptions
      const activePlans = await SubscriptionPlan.find({ isActive: true });
      const monthlyRevenue = activePlans.reduce((total, plan) => {
        return total + (plan.billingCycle === 'monthly' ? plan.price : plan.price / 12);
      }, 0);

      // Calculate yearly revenue (simplified)
      const yearlyRevenue = monthlyRevenue * 12;

      const revenue = {
        monthly: monthlyRevenue,
        yearly: yearlyRevenue
      };

      // Get active users count
      const activeUsers = await User.countDocuments({ isActive: true });

      const system = {
        activeUsers,
        totalRevenue: yearlyRevenue
      };

      return {
        users,
        inventory,
        revenue,
        system
      };
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw new Error('Failed to fetch admin dashboard statistics');
    }
  }
}

export default DashboardModel;
