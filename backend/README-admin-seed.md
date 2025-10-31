# Admin Seed Script

This script creates admin users for the Inventory Management System.

## Usage

### Using npm script (recommended)
```bash
npm run seed:admin
```

### Using node directly
```bash
node seed-admin.js
```

## What it does

1. **Checks for existing admin users** - Prevents duplicate creation
2. **Creates two admin accounts** if none exist:
   - System Administrator: `admin@inventory.com` / `admin123!@#`
   - Super Admin: `superadmin@inventory.com` / `super123!@#`
3. **Pre-approves admin accounts** - No manual approval needed
4. **Provides login information** - Shows credentials and access URLs

## Admin Login Access

After running the seed script, admins can login at:
- **Admin Login Page**: `http://localhost:3000/admin/login`
- **Admin Dashboard**: `http://localhost:3000/admin` (after login)

## Default Admin Credentials

```
System Administrator
Email: admin@inventory.com
Password: admin123!@#

Super Admin
Email: superadmin@inventory.com
Password: super123!@#
```

## Notes

- The script will skip creation if admin users already exist
- Admin accounts are automatically approved and ready to use
- For security, change default passwords in production
- The script connects to the same MongoDB database as the main application

## Troubleshooting

If you need to reset admin passwords or recreate admin accounts:
1. Clear the User collection in MongoDB, or
2. Manually update user passwords in the database

## Integration

This script works alongside the main `seed.js` script. The main seed script creates demo users including one admin account (`admin@demo.com`), while this script creates dedicated admin accounts for production use.
